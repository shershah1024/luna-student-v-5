/**
 * Clerk webhook handler to automatically assign roles after signup
 * This webhook is triggered when a user completes signup
 */

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not set')
    return new Response('Server configuration error', { status: 500 })
  }

  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, public_metadata, unsafe_metadata } = evt.data
    const userEmail = email_addresses?.[0]?.email_address

    console.log('[WEBHOOK] User created:', {
      userId: id,
      email: userEmail,
      publicMetadata: public_metadata
    })

    // Check if user joined via join code
    const joinCode = public_metadata?.join_code || unsafe_metadata?.join_code
    if (joinCode) {
      console.log('[WEBHOOK] Student joined via code:', {
        userId: id,
        joinCode
      })

      try {
        // Fetch join code details
        const { data: codeData, error: codeError } = await supabase
          .from('student_join_codes')
          .select('*')
          .eq('code', joinCode)
          .eq('is_active', true)
          .single()

        if (codeError || !codeData) {
          console.error('[WEBHOOK] Join code not found or inactive:', joinCode)
        } else {
          // Check if expired
          if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
            console.error('[WEBHOOK] Join code expired:', joinCode)
          }
          // Check max uses
          else if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
            console.error('[WEBHOOK] Join code max uses reached:', joinCode)
          }
          else {
            // Update user metadata to mark as student
            const client = await clerkClient()
            await client.users.updateUser(id, {
              publicMetadata: {
                is_student: true,
                role: 'student',
                teacher_id: codeData.teacher_id,
                class_id: codeData.class_id,
              }
            })

            console.log('[WEBHOOK] Updated student metadata for join code user')

            // Insert into teacher_students
            const { error: insertError } = await supabase
              .from('teacher_students')
              .insert({
                teacher_id: codeData.teacher_id,
                student_id: id, // Clerk user ID only!
                class_id: codeData.class_id, // Class ID from join code
                joined_via: 'join_code',
                status: 'active'
              })

            if (insertError) {
              console.error('[WEBHOOK] Error creating teacher_students via join code:', insertError)
            } else {
              // Increment usage count
              await supabase
                .from('student_join_codes')
                .update({
                  current_uses: codeData.current_uses + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', codeData.id)

              // Track usage
              await supabase
                .from('student_join_code_usage')
                .insert({
                  join_code_id: codeData.id,
                  student_id: id
                })

              console.log('[WEBHOOK] Successfully processed join code:', {
                code: joinCode,
                studentId: id,
                teacherId: codeData.teacher_id,
                classId: codeData.class_id
              })
            }
          }
        }
      } catch (error) {
        console.error('[WEBHOOK] Error processing join code:', error)
      }
    }

    // Check if there's an invitation code in the metadata (old flow)
    const inviteCode = unsafe_metadata?.inviteCode as string | undefined

    if (inviteCode) {
      try {
        // Validate and use the invitation
        const { data: invitation, error: fetchError } = await supabase
          .from('invitations')
          .select('*')
          .eq('code', inviteCode.toUpperCase())
          .single()

        if (!fetchError && invitation) {
          // Check if invitation is still valid
          const isExpired = invitation.expires_at && new Date(invitation.expires_at) < new Date()
          const maxUsesReached = invitation.max_uses && invitation.uses_count >= invitation.max_uses

          if (!isExpired && !maxUsesReached) {
            // Update user with the role from invitation
            await clerkClient().users.updateUser(id, {
              publicMetadata: {
                role: invitation.role,
                teacherId: invitation.teacher_id,
                invitedBy: invitation.teacher_name,
                className: invitation.metadata?.className,
                courseName: invitation.metadata?.courseName
              }
            })

            // Increment usage count
            await supabase
              .from('invitations')
              .update({
                uses_count: invitation.uses_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', invitation.id)

            console.log(`User ${id} assigned role ${invitation.role} from invitation ${inviteCode}`)
          }
        }
      } catch (error) {
        console.error('Error processing invitation:', error)
      }
    } else {
      // No invitation code - don't assign role yet, let user choose on role selection page
      console.log(`User ${id} created without role - will select on role-selection page`)
    }
  }

  if (eventType === 'organizationMembership.created' || eventType === 'organizationMembership.updated') {
    console.log('[WEBHOOK] Organization membership event received:', {
      eventType,
      data: evt.data
    })

    const membership = evt.data as {
      user_id?: string
      role?: string
      organization_id?: string
      public_user_data?: {
        user_id?: string
      }
    }

    // Get userId from either direct field or nested public_user_data
    const userId = membership.user_id || membership.public_user_data?.user_id
    const role = membership.role
    const orgId = membership.organization_id

    console.log('[WEBHOOK] Extracted membership details:', {
      userId,
      role,
      orgId
    })

    if (!userId) {
      console.error('[WEBHOOK] No user_id found in membership data')
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    if (!role) {
      console.error('[WEBHOOK] No role found in membership data')
      return NextResponse.json({ error: 'Missing role' }, { status: 400 })
    }

    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)

      console.log('[WEBHOOK] Current user metadata:', {
        userId,
        currentMetadata: user.publicMetadata
      })

      const currentMetadata = (user.publicMetadata || {}) as Record<string, any>
      const updatedMetadata = { ...currentMetadata }

      if (role === 'org:teacher') {
        console.log('[WEBHOOK] Setting is_teacher = true for user:', userId)
        updatedMetadata.is_teacher = true
        if (!updatedMetadata.role || updatedMetadata.role === 'guest') {
          updatedMetadata.role = 'teacher'
        }
      }

      if (role === 'org:institute_admin') {
        console.log('[WEBHOOK] Setting is_institute_admin = true for user:', userId)
        updatedMetadata.is_institute_admin = true
        if (!updatedMetadata.role || updatedMetadata.role === 'teacher' || updatedMetadata.role === 'guest') {
          updatedMetadata.role = 'institute_admin'
        }
      }

      console.log('[WEBHOOK] Updating user metadata to:', updatedMetadata)

      await client.users.updateUser(userId, {
        publicMetadata: updatedMetadata,
      })

      console.log('[WEBHOOK] Successfully updated user metadata for:', userId)
    } catch (error) {
      console.error('[WEBHOOK] Error updating metadata for membership change:', {
        error,
        userId,
        role,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      return NextResponse.json({
        error: 'Failed to update user metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Webhook processed' }, { status: 200 })
}