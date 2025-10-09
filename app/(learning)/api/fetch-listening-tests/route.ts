import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('[Fetch Listening Tests] Request received')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Fetch Listening Tests] No user ID - unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[Fetch Listening Tests] Fetching TELC A1 exams with listening tests')
    
    // Get all active TELC A1 exams with their listening test associations
    const { data: exams, error: examError } = await supabase
      .from('exams')
      .select(`
        exam_id,
        title,
        description,
        listening_test_id,
        total_sections,
        estimated_duration_minutes
      `)
      .eq('course', 'telc_a1')
      .eq('is_active', true)
      .not('listening_test_id', 'is', null)
      .order('created_at', { ascending: true })

    if (examError) {
      console.error('[Fetch Listening Tests] Exam query error:', examError)
      return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
    }

    console.log(`[Fetch Listening Tests] Found ${exams?.length || 0} exams with listening tests`)

    if (!exams || exams.length === 0) {
      return NextResponse.json([])
    }

    // Get unique listening test IDs
    const listeningTestIds = Array.from(new Set(exams.map(exam => exam.listening_test_id).filter(Boolean)))
    console.log(`[Fetch Listening Tests] Unique listening test IDs: ${listeningTestIds.length}`)

    // Fetch listening test sections for these test IDs
    const { data: listeningSections, error: listeningError } = await supabase
      .from('listening_tests')
      .select('test_id, section, question_data, audio_url, created_at')
      .in('test_id', listeningTestIds)
      .eq('course', 'telc_a1')
      .order('test_id', { ascending: true })
      .order('section', { ascending: true })

    if (listeningError) {
      console.error('[Fetch Listening Tests] Listening tests query error:', listeningError)
      return NextResponse.json({ error: 'Failed to fetch listening test sections' }, { status: 500 })
    }

    console.log(`[Fetch Listening Tests] Found ${listeningSections?.length || 0} listening test sections`)

    // Group sections by test_id
    const sectionsByTestId = (listeningSections || []).reduce((acc, section) => {
      if (!acc[section.test_id]) {
        acc[section.test_id] = []
      }
      acc[section.test_id].push({
        section: section.section,
        hasQuestionData: !!section.question_data,
        hasAudio: !!section.audio_url
      })
      return acc
    }, {} as Record<string, any[]>)

    // Build the response format
    const result = exams.map(exam => ({
      exam_id: exam.exam_id,
      title: exam.title,
      description: exam.description,
      listening_test_id: exam.listening_test_id,
      total_sections: exam.total_sections,
      estimated_duration_minutes: exam.estimated_duration_minutes,
      sections: sectionsByTestId[exam.listening_test_id] || []
    }))

    console.log(`[Fetch Listening Tests] Returning ${result.length} listening tests`)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Fetch Listening Tests] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}