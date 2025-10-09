/**
 * API route to fetch student assignments
 * Returns all assignments for the authenticated user
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch student assignments
    const { data: assignments, error } = await supabase
      .from('student_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })

    if (error) {
      console.error('Error fetching student assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error in student-assignments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { task_id, title, task_type } = body

    if (!task_id || !title) {
      return NextResponse.json(
        { error: 'task_id and title are required' },
        { status: 400 }
      )
    }

    // Insert or update student assignment
    const { data, error } = await supabase
      .from('student_assignments')
      .upsert({
        user_id: userId,
        task_id,
        title,
        task_type,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,task_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating student assignment:', error)
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignment: data })
  } catch (error) {
    console.error('Error in student-assignments POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
