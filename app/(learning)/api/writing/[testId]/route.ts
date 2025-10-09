import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const testId = params.testId
    const { searchParams } = request.nextUrl
    const section = searchParams.get('section')
    const course = searchParams.get('course')
    
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }
    
    if (!section) {
      return NextResponse.json({ error: 'Section parameter is required' }, { status: 400 })
    }
    
    console.log(`[Writing API] Fetching test: ${testId}, section: ${section}, course: ${course}`)
    
    // Try to fetch with the provided course name first
    let data = null
    let error = null
    
    if (course) {
      // If course has hyphens, prioritize the underscore format (which has correct data structure)
      const priorityFormats = course.includes('-') 
        ? [course.replace(/-/g, '_'), course] // Try underscore first, then hyphen
        : [course, course.replace(/_/g, '-')] // Try underscore first, then hyphen
      
      console.log(`[Writing API] Trying course formats in order: ${priorityFormats.join(', ')}`)
      
      for (const courseFormat of priorityFormats) {
        const query = supabase
          .from('writing_tests')
          .select('*')
          .eq('test_id', testId)
          .eq('section', parseInt(section, 10))
          .eq('course', courseFormat)
        
        const result = await query.single()
        
        if (!result.error && result.data) {
          console.log(`[Writing API] Found data with course format: ${courseFormat}`)
          data = result.data
          break
        } else {
          console.log(`[Writing API] No data found with course format: ${courseFormat}`)
          error = result.error
        }
      }
    } else {
      // No course filter - get any matching test_id and section
      const query = supabase
        .from('writing_tests')
        .select('*')
        .eq('test_id', testId)
        .eq('section', parseInt(section, 10))
      
      const result = await query.single()
      data = result.data
      error = result.error
    }
    
    if (error) {
      console.error('[Writing API] Error fetching writing test:', error)
      return NextResponse.json({ error: 'Failed to fetch test data' }, { status: 500 })
    }
    
    if (!data) {
      console.log(`[Writing API] No data found for test: ${testId}, section: ${section}, course: ${course}`)
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }
    
    // Parse question_data if it's a JSON string
    if (data.question_data && typeof data.question_data === 'string') {
      try {
        data.question_data = JSON.parse(data.question_data)
        console.log(`[Writing API] Parsed question_data JSON string`)
      } catch (parseError) {
        console.error('[Writing API] Error parsing question_data JSON:', parseError)
        // Keep original string if parsing fails
      }
    }
    
    console.log(`[Writing API] Found writing test data:`, {
      testId: data.test_id,
      section: data.section,
      course: data.course,
      hasQuestionData: !!data.question_data,
      questionDataType: typeof data.question_data
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Writing API] Error in route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}