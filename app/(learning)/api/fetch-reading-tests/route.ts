import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('[Fetch Reading Tests] Request received')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Fetch Reading Tests] No user ID - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Fetch Reading Tests] Fetching TELC A1 exams with reading tests')
    
    // Get all active TELC A1 exams with their reading test associations
    const { data: exams, error: examError } = await supabase
      .from('exams')
      .select(`
        exam_id,
        title,
        description,
        reading_test_id,
        total_sections,
        estimated_duration_minutes
      `)
      .eq('course', 'telc_a1')
      .eq('is_active', true)
      .not('reading_test_id', 'is', null)
      .order('created_at', { ascending: true })

    if (examError) {
      console.error('[Fetch Reading Tests] Exam query error:', examError)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    console.log(`[Fetch Reading Tests] Found ${exams?.length || 0} exams with reading tests`)

    if (!exams || exams.length === 0) {
      return NextResponse.json([])
    }

    // Get unique reading test IDs
    const readingTestIds = Array.from(new Set(exams.map(exam => exam.reading_test_id).filter(Boolean)))
    console.log(`[Fetch Reading Tests] Unique reading test IDs: ${readingTestIds.length}`)

    // Fetch reading test sections for these test IDs
    const { data: readingSections, error: readingError } = await supabase
      .from('reading_tests')
      .select('test_id, section, question_data, created_at')
      .in('test_id', readingTestIds)
      .eq('course', 'telc_a1')
      .order('test_id', { ascending: true })
      .order('section', { ascending: true })

    if (readingError) {
      console.error('[Fetch Reading Tests] Reading tests query error:', readingError)
      return NextResponse.json({ error: 'Failed to fetch reading test sections' }, { status: 500 })
    }

    console.log(`[Fetch Reading Tests] Found ${readingSections?.length || 0} reading test sections`)

    // Group sections by test_id
    const sectionsByTestId = (readingSections || []).reduce((acc, section) => {
      if (!acc[section.test_id]) {
        acc[section.test_id] = []
      }
      acc[section.test_id].push({
        section: section.section,
        hasQuestionData: !!section.question_data
      })
      return acc
    }, {} as Record<string, any[]>)

    // Build the response format
    const result = exams.map(exam => ({
      exam_id: exam.exam_id,
      title: exam.title,
      description: exam.description,
      reading_test_id: exam.reading_test_id,
      total_sections: exam.total_sections,
      estimated_duration_minutes: exam.estimated_duration_minutes,
      sections: sectionsByTestId[exam.reading_test_id] || []
    }))

    console.log(`[Fetch Reading Tests] Returning ${result.length} reading tests`)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Fetch Reading Tests] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}