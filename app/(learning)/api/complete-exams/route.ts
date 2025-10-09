import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const course = searchParams.get('course')
    const limit = searchParams.get('limit') || '10'

    if (!course) {
      return NextResponse.json({ error: 'Course parameter is required' }, { status: 400 })
    }

    // Convert course format: 'goethe-a1' -> 'goethe_a1' for database query
    const dbCourse = course.replace('-', '_')

    // Fetch exams from the database
    const { data: examsData, error: examsError } = await supabase
      .from('exams')
      .select('exam_id, course, title, description, total_sections, estimated_duration_minutes')
      .eq('course', dbCourse)
      .eq('is_active', true)
      .limit(parseInt(limit, 10))

    if (examsError) {
      console.error('Database error:', examsError)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    const formattedExams = (examsData || []).map((exam: any) => ({
      exam_id: exam.exam_id,
      course: course, // Return the original course format
      exam_name: exam.title || `TELC A1 Practice Exam`,
      test_components: ['reading', 'listening', 'writing', 'speaking'],
      reading_count: 3,
      listening_count: 3,
      writing_count: 2,
      grammar_count: 0,
      total_tests: exam.total_sections || 8
    }))

    return NextResponse.json({ 
      exams: formattedExams,
      total: formattedExams.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

//