import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { testId: string; sectionId: string } }
) {
  try {
    const testId = params.testId
    const sectionId = params.sectionId
    
    if (!testId || !sectionId) {
      return NextResponse.json(
        { error: 'Test ID and Section ID are required' },
        { status: 400 }
      )
    }
    
    // Extract section number from sectionId (e.g., "section1" -> 1)
    const sectionMatch = sectionId.match(/section(\d+)/)
    if (!sectionMatch) {
      return NextResponse.json(
        { error: 'Invalid section format. Expected format: section1, section2, etc.' },
        { status: 400 }
      )
    }
    
    const sectionNumber = parseInt(sectionMatch[1])
    
    // Get course parameter from query string
    const { searchParams } = request.nextUrl
    const course = searchParams.get('course')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Fetch writing exercise data for the specified test ID and section
    let data = null
    let error = null
    
    if (course) {
      // If course has hyphens, prioritize the underscore format (which has correct data structure)
      const priorityFormats = course.includes('-') 
        ? [course.replace(/-/g, '_'), course] // Try underscore first, then hyphen
        : [course, course.replace(/_/g, '-')] // Try underscore first, then hyphen
      
      console.log(`[Writing Section API] Trying course formats in order: ${priorityFormats.join(', ')}`)
      
      for (const courseFormat of priorityFormats) {
        const query = supabase
          .from('writing_tests')
          .select('*')
          .eq('test_id', testId)
          .eq('section', sectionNumber)
          .eq('course', courseFormat)
        
        const result = await query.single()
        
        if (!result.error && result.data) {
          console.log(`[Writing Section API] Found data with course format: ${courseFormat}`)
          data = result.data
          break
        } else {
          console.log(`[Writing Section API] No data found with course format: ${courseFormat}`)
          error = result.error
        }
      }
    } else {
      // No course filter - get any matching test_id and section
      const query = supabase
        .from('writing_tests')
        .select('*')
        .eq('test_id', testId)
        .eq('section', sectionNumber)
      
      const result = await query.single()
      data = result.data
      error = result.error
    }
    
    if (error) {
      console.error(`Error fetching writing section ${sectionNumber}:`, error)
      return NextResponse.json({ error: 'Failed to fetch test data' }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json(
        { error: `Writing section ${sectionNumber} not found` },
        { status: 404 }
      )
    }
    
    // Parse the question_data JSON if it exists
    if (data.question_data && typeof data.question_data === 'string') {
      try {
        data.question_data = JSON.parse(data.question_data)
        console.log(`[Writing Section API] Parsed question_data JSON string`)
      } catch (parseError) {
        console.error('[Writing Section API] Error parsing question_data JSON:', parseError)
        // Keep original string if parsing fails
      }
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error in writing section API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 