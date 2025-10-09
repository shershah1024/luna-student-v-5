/**
 * Admin API endpoint to set user roles
 * Following Clerk's 2024 best practices
 */

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkRole } from '@/lib/roles-v2'
import { UserRole } from '@/types/globals'

export async function POST(request: Request) {
  try {
    // Get current user
    const { userId: currentUserId } = await auth()
    
    // Parse request body
    const { userId, role } = await request.json()
    
    // TEMPORARY: Allow users to set their own role during development
    // In production, only admins should be able to set roles
    const isSettingOwnRole = currentUserId === userId
    const isAdmin = await checkRole('admin')
    
    if (!isSettingOwnRole && !isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden - You can only set your own role or be an admin' 
      }, { status: 403 })
    }
    
    // Validate inputs
    if (!userId || !role) {
      return NextResponse.json({ 
        error: 'Missing userId or role' 
      }, { status: 400 })
    }
    
    const validRoles: UserRole[] = ['admin', 'teacher', 'student', 'parent']
    if (!validRoles.includes(role as UserRole)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: admin, teacher, student, parent' 
      }, { status: 400 })
    }
    
    // Get Clerk client instance (must be awaited in Next.js)
    const client = await clerkClient()
    
    // Update user's role in public metadata
    const user = await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: `User role updated to ${role}`,
      userId,
      role,
      publicMetadata: user.publicMetadata
    })
    
  } catch (error) {
    console.error('Error setting user role:', error)
    return NextResponse.json({ 
      error: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check current user's role
export async function GET() {
  try {
    const { sessionClaims } = await auth()
    const role = sessionClaims?.metadata?.role
    
    return NextResponse.json({ 
      role: role || null,
      hasRole: !!role
    })
    
  } catch (error) {
    console.error('Error getting user role:', error)
    return NextResponse.json({ 
      error: 'Failed to get user role' 
    }, { status: 500 })
  }
}