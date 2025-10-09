/**
 * API endpoint for teachers to create invitation links
 * Teachers can generate links that automatically assign roles to new signups
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UserRole, getUserRole } from '@/lib/roles'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Generate a unique invitation code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user details
    const user = await currentUser()
    const userRole = getUserRole(user)
    
    // Check if user is teacher or admin
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ADMIN) {
      return NextResponse.json({ 
        error: 'Only teachers and admins can create invitations' 
      }, { status: 403 })
    }
    
    // Parse request body
    const { 
      role = UserRole.STUDENT,
      maxUses = null,
      expiresInDays = 30,
      className,
      courseName
    } = await request.json()
    
    // Teachers can only create student invitations
    if (userRole === UserRole.TEACHER && role !== UserRole.STUDENT) {
      return NextResponse.json({ 
        error: 'Teachers can only create student invitations' 
      }, { status: 403 })
    }
    
    // Generate unique code
    let code = generateInviteCode()
    let attempts = 0
    
    // Ensure code is unique
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('code', code)
        .single()
      
      if (!existing) break
      code = generateInviteCode()
      attempts++
    }
    
    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    
    // Create invitation in database
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        code,
        teacher_id: userId,
        teacher_name: user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user?.username || 'Teacher',
        role,
        max_uses: maxUses,
        expires_at: expiresAt.toISOString(),
        metadata: {
          className,
          courseName,
          createdBy: userRole
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating invitation:', error)
      return NextResponse.json({ 
        error: 'Failed to create invitation' 
      }, { status: 500 })
    }
    
    // Generate signup link
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const signupLink = `${baseUrl}/sign-up?invite=${code}`
    
    return NextResponse.json({
      success: true,
      invitation: {
        code,
        link: signupLink,
        role,
        expiresAt: invitation.expires_at,
        maxUses: invitation.max_uses,
        metadata: invitation.metadata
      }
    })
    
  } catch (error) {
    console.error('Error in invitation creation:', error)
    return NextResponse.json({ 
      error: 'Failed to create invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to list teacher's invitations
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await currentUser()
    const userRole = getUserRole(user)
    
    if (userRole !== UserRole.TEACHER && userRole !== UserRole.ADMIN) {
      return NextResponse.json({ 
        error: 'Only teachers and admins can view invitations' 
      }, { status: 403 })
    }
    
    // Get teacher's invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch invitations' 
      }, { status: 500 })
    }
    
    // Add full links to response
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const invitationsWithLinks = invitations.map(inv => ({
      ...inv,
      link: `${baseUrl}/sign-up?invite=${inv.code}`,
      isActive: inv.expires_at ? new Date(inv.expires_at) > new Date() : true,
      hasRemainingUses: inv.max_uses ? inv.uses_count < inv.max_uses : true
    }))
    
    return NextResponse.json({ 
      invitations: invitationsWithLinks 
    })
    
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch invitations' 
    }, { status: 500 })
  }
}