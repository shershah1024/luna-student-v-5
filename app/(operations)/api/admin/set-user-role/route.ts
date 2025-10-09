/**
 * Admin API endpoint to set user roles
 * Only accessible by admin users
 */

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UserRole, isValidRole } from '@/lib/roles'

export async function POST(request: Request) {
  try {
    // Check if current user is authenticated
    const { userId: adminUserId } = await auth()
    if (!adminUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get admin user details
    const adminUser = await clerkClient().users.getUser(adminUserId)
    const adminRole = adminUser.publicMetadata?.role as UserRole | undefined
    
    // Check if user is admin
    if (adminRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }
    
    // Parse request body
    const { userId, role } = await request.json()
    
    // Validate inputs
    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }
    
    if (!isValidRole(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: admin, teacher, student, parent' 
      }, { status: 400 })
    }
    
    // Update user's role in Clerk
    await clerkClient().users.updateUser(userId, {
      publicMetadata: {
        role: role
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: `User role updated to ${role}`,
      userId,
      role
    })
    
  } catch (error) {
    console.error('Error setting user role:', error)
    return NextResponse.json({ 
      error: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}