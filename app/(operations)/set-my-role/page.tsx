'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/types/globals'

export default function SetMyRolePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const setRole = async (role: UserRole) => {
    if (!user) return
    
    setIsUpdating(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: role,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Role set to ${role}! Please sign out and back in to apply changes.` 
        })
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to set role' 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to set role' 
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <p className="text-center text-gray-600">Please sign in first</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentRole = user.publicMetadata?.role as UserRole | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-24 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Role Setup</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Set your role to access different features. This is a temporary setup page.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Current User:</p>
              <p className="font-medium">{user.fullName || user.username || user.emailAddresses[0]?.emailAddress}</p>
              <p className="text-sm text-gray-600 mt-2">Current Role:</p>
              <p className="font-medium">{currentRole || 'Not set'}</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Select Your Role:</h3>
              
              <Button
                onClick={() => setRole('teacher')}
                disabled={isUpdating}
                className="w-full justify-start"
                variant={currentRole === 'teacher' ? 'default' : 'outline'}
              >
                <div className="text-left">
                  <p className="font-medium">Teacher</p>
                  <p className="text-xs opacity-75">Create assignments, manage students, view progress</p>
                </div>
              </Button>

              <Button
                onClick={() => setRole('student')}
                disabled={isUpdating}
                className="w-full justify-start"
                variant={currentRole === 'student' ? 'default' : 'outline'}
              >
                <div className="text-left">
                  <p className="font-medium">Student</p>
                  <p className="text-xs opacity-75">Access lessons, take tests, practice</p>
                </div>
              </Button>

              <Button
                onClick={() => setRole('admin')}
                disabled={isUpdating}
                className="w-full justify-start"
                variant={currentRole === 'admin' ? 'default' : 'outline'}
              >
                <div className="text-left">
                  <p className="font-medium">Admin</p>
                  <p className="text-xs opacity-75">Full system access, manage all users</p>
                </div>
              </Button>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> After setting your role, you must sign out and sign back in for the changes to take effect.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}