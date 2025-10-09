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
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Get course parameter from query string
    const { searchParams } = request.nextUrl
    const course = searchParams.get('course')
    
    // Fetch all available sections for this test ID
    let query = supabase
      .from('writing_tests')
      .select('section')
      .eq('test_id', testId)
    
    // Add course filter if provided, prioritizing underscore format
    if (course) {
      const priorityFormats = course.includes('-') 
        ? [course.replace(/-/g, '_'), course] // Try underscore first, then hyphen
        : [course, course.replace(/_/g, '-')] // Try underscore first, then hyphen
      
      console.log(`[Writing Sections API] Trying course formats: ${priorityFormats.join(', ')}`)
      
      // Try to get sections with preferred course format
      query = query.eq('course', priorityFormats[0])
    }
    
    const { data, error } = await query.order('section', { ascending: true })
    
    if (error) {
      console.error(`Error fetching sections for test ${testId}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: `No sections found for test ${testId}` },
        { status: 404 }
      )
    }
    
    // Extract section numbers and return as array
    const sections = data.map(item => item.section)
    
    return NextResponse.json(sections)
  } catch (error) {
    console.error('Unexpected error in writing sections API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 