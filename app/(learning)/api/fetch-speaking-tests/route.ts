import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('[Fetch Speaking Tests] Request received')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Fetch Speaking Tests] No user ID - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Fetch Speaking Tests] Fetching TELC A1 exams with speaking tests')
    
    // Get all active TELC A1 exams with their speaking test associations
    const { data: exams, error: examError } = await supabase
      .from('exams')
      .select(`
        exam_id,
        title,
        description,
        speaking_test_id,
        total_sections,
        estimated_duration_minutes
      `)
      .eq('course', 'telc_a1')
      .eq('is_active', true)
      .not('speaking_test_id', 'is', null)
      .order('created_at', { ascending: true })

    if (examError) {
      console.error('[Fetch Speaking Tests] Exam query error:', examError)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    console.log(`[Fetch Speaking Tests] Found ${exams?.length || 0} exams with speaking tests`)

    if (!exams || exams.length === 0) {
      return NextResponse.json([])
    }

    // Get unique speaking test IDs
    const speakingTestIds = Array.from(new Set(exams.map(exam => exam.speaking_test_id).filter(Boolean)))
    console.log(`[Fetch Speaking Tests] Unique speaking test IDs: ${speakingTestIds.length}`)

    // Fetch speaking test sections for these test IDs from speaking_tasks table
    const { data: speakingSections, error: speakingError } = await supabase
      .from('speaking_tasks')
      .select('test_id, section, task_id, test_taker_instructions, image_url, created_at')
      .in('test_id', speakingTestIds)
      .order('test_id', { ascending: true })
      .order('section', { ascending: true })

    if (speakingError) {
      console.error('[Fetch Speaking Tests] Speaking tests query error:', speakingError)
      return NextResponse.json({ error: 'Failed to fetch speaking test sections' }, { status: 500 })
    }

    console.log(`[Fetch Speaking Tests] Found ${speakingSections?.length || 0} speaking test sections`)

    // Group sections by test_id
    const sectionsByTestId = (speakingSections || []).reduce((acc, section) => {
      if (!acc[section.test_id]) {
        acc[section.test_id] = []
      }
      acc[section.test_id].push({
        section: section.section,
        task_id: section.task_id,
        test_taker_instructions: section.test_taker_instructions,
        image_url: section.image_url
      })
      return acc
    }, {} as Record<string, any[]>)

    // Build the response format
    const result = exams.map(exam => ({
      exam_id: exam.exam_id,
      title: exam.title,
      description: exam.description,
      speaking_test_id: exam.speaking_test_id,
      total_sections: exam.total_sections,
      estimated_duration_minutes: exam.estimated_duration_minutes,
      sections: sectionsByTestId[exam.speaking_test_id] || []
    }))

    console.log(`[Fetch Speaking Tests] Returning ${result.length} speaking tests`)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Fetch Speaking Tests] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}