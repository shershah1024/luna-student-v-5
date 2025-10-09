import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('[Fetch Writing Tests] Request received')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Fetch Writing Tests] No user ID - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Fetch Writing Tests] Fetching TELC A1 exams with writing tests')
    
    // Get all active TELC A1 exams with their writing test associations
    const { data: exams, error: examError } = await supabase
      .from('exams')
      .select(`
        exam_id,
        title,
        description,
        writing_test_id,
        total_sections,
        estimated_duration_minutes
      `)
      .eq('course', 'telc_a1')
      .eq('is_active', true)
      .not('writing_test_id', 'is', null)
      .order('created_at', { ascending: true })

    if (examError) {
      console.error('[Fetch Writing Tests] Exam query error:', examError)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    console.log(`[Fetch Writing Tests] Found ${exams?.length || 0} exams with writing tests`)

    if (!exams || exams.length === 0) {
      return NextResponse.json([])
    }

    // Get unique writing test IDs
    const writingTestIds = Array.from(new Set(exams.map(exam => exam.writing_test_id).filter(Boolean)))
    console.log(`[Fetch Writing Tests] Unique writing test IDs: ${writingTestIds.length}`)

    // Fetch writing test sections for these test IDs
    const { data: writingSections, error: writingError } = await supabase
      .from('writing_tests')
      .select('test_id, section, question_data, created_at')
      .in('test_id', writingTestIds)
      .eq('course', 'telc_a1')
      .order('test_id', { ascending: true })
      .order('section', { ascending: true })

    if (writingError) {
      console.error('[Fetch Writing Tests] Writing tests query error:', writingError)
      return NextResponse.json({ error: 'Failed to fetch writing test sections' }, { status: 500 })
    }

    console.log(`[Fetch Writing Tests] Found ${writingSections?.length || 0} writing test sections`)

    // Group sections by test_id
    const sectionsByTestId = (writingSections || []).reduce((acc, section) => {
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
      writing_test_id: exam.writing_test_id,
      total_sections: exam.total_sections,
      estimated_duration_minutes: exam.estimated_duration_minutes,
      sections: sectionsByTestId[exam.writing_test_id] || []
    }))

    console.log(`[Fetch Writing Tests] Returning ${result.length} writing tests`)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Fetch Writing Tests] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}