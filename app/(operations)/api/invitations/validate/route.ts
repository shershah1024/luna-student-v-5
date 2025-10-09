/**
 * API endpoint to validate invitation codes during signup
 * Returns invitation details if valid
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ 
        error: 'Invitation code is required' 
      }, { status: 400 })
    }
    
    // Fetch invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()
    
    if (error || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid invitation code' 
      }, { status: 404 })
    }
    
    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 410 })
    }
    
    // Check if invitation has reached max uses
    if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
      return NextResponse.json({ 
        error: 'This invitation has reached its maximum number of uses' 
      }, { status: 410 })
    }
    
    return NextResponse.json({
      valid: true,
      invitation: {
        role: invitation.role,
        teacherName: invitation.teacher_name,
        metadata: invitation.metadata,
        className: invitation.metadata?.className,
        courseName: invitation.metadata?.courseName
      }
    })
    
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json({ 
      error: 'Failed to validate invitation' 
    }, { status: 500 })
  }
}