import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'


export const dynamic = "force-dynamic";
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get the difficulty from the query params if provided
    const { searchParams } = request.nextUrl
    const difficulty = searchParams.get('difficulty')
    const course = searchParams.get('course')
    
    let query = supabase
      .from('reading_tests')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Add course filter if provided, otherwise default to goethe_a1
    if (course) {
      query = query.eq('course', course)
    } else {
      query = query.eq('course', 'goethe_a1')
    }
    
    // Add difficulty filter if provided
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching reading papers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Parse JSON fields for each paper
    const parsedData = data.map(row => {
      let questionData = row.question_data
      if (typeof questionData === 'string') {
        try {
          questionData = JSON.parse(questionData)
        } catch (e) {
          console.warn('Failed to parse question_data as JSON:', e)
        }
      }
      return {
        ...questionData,
        section: row.section,
        test_id: row.test_id,
        created_at: row.created_at,
        course: row.course
      }
    })
    
    return NextResponse.json(parsedData)
  } catch (err) {
    console.error('Error processing request:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
