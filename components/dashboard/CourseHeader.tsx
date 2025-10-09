'use client'

import { ArrowLeft, BookOpen, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface CourseHeaderProps {
  courseId: string
  courseTitle: string
  courseLevel: string
  organization: string
  showBackButton?: boolean
  currentSection?: string
}

export default function CourseHeader({ 
  courseId, 
  courseTitle, 
  courseLevel, 
  organization,
  showBackButton = true,
  currentSection
}: CourseHeaderProps) {
  const router = useRouter()

  const handleUnenroll = async () => {
    if (!confirm('Are you sure you want to unenroll from this course? Your progress will be saved.')) {
      return
    }

    try {
      const response = await fetch(`/api/enrollments?courseId=${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Successfully unenrolled from course')
        router.push('/courses')
      } else {
        toast.error('Failed to unenroll from course')
      }
    } catch (error) {
      console.error('Error unenrolling:', error)
      toast.error('An error occurred while unenrolling')
    }
  }

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-blue-100 text-blue-700'
      case 'B1':
      case 'B2':
        return 'bg-purple-100 text-purple-700'
      case 'C1':
      case 'C2':
        return 'bg-indigo-100 text-indigo-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="bg-white border-b sticky top-20 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            )}
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="font-semibold text-lg">{courseTitle}</h2>
                <div className="flex items-center gap-2">
                  <Badge className={`${getBadgeColor(courseLevel)} text-xs`}>{courseLevel}</Badge>
                  <span className="text-xs text-gray-500">{organization}</span>
                  {currentSection && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-600">{currentSection}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleUnenroll}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Unenroll
          </Button>
        </div>
      </div>
    </div>
  )
}