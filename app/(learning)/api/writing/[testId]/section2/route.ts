import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId
    
    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      )
    }
    
    // Get course parameter from query string
    const { searchParams } = request.nextUrl
    const course = searchParams.get('course')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Fetch section 2 writing exercise data for the specified test ID
    let query = supabase
      .from('writing_tests')
      .select('*')
      .eq('test_id', testId)
      .eq('section', 2)
    
    // Add course filter if provided
    if (course) {
      query = query.eq('course', course)
    }
    
    const { data, error } = await query.single()
    
    if (error) {
      console.error('Error fetching writing section 2:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Writing section 2 not found' },
        { status: 404 }
      )
    }
    
    // Parse the question_data JSON if it exists
    if (data.question_data) {
      try {
        if (typeof data.question_data === 'string') {
          data.question_data = JSON.parse(data.question_data)
        }
      } catch (parseError) {
        console.error('Error parsing question_data JSON:', parseError)
        // Keep original string if parsing fails
      }
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error in writing section 2 API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
