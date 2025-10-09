import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  console.log('[Listening Section API] Request received')
  
  try {
    const { searchParams } = request.nextUrl
    const testId = searchParams.get('test_id')
    const section = searchParams.get('section')
    
    console.log('[Listening Section API] Request params:', { testId, section })
    
    if (!testId || !section) {
      return NextResponse.json({ error: 'test_id and section parameters are required' }, { status: 400 })
    }
    
    // Simple query - hardcode course to telc_a1 and get specific section
    const { data, error } = await supabase
      .from('listening_tests')
      .select('*')
      .eq('course', 'telc_a1')
      .eq('test_id', testId)
      .eq('section', parseInt(section))
      .single()

    if (error) {
      console.error('[Listening Section API] Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch listening section' }, { status: 500 })
    }

    if (!data) {
      console.log('[Listening Section API] No data found for:', { testId, section })
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    console.log('[Listening Section API] Found listening section:', { testId, section })
    
    // Parse question_data if it's a string
    if (data.question_data && typeof data.question_data === 'string') {
      try {
        data.question_data = JSON.parse(data.question_data)
      } catch (parseError) {
        console.error('[Listening Section API] Error parsing question_data:', parseError)
      }
    }
    
    // Ensure test_id and audio_url are included in the question_data
    if (data.question_data && typeof data.question_data === 'object') {
      data.question_data.test_id = testId
      data.question_data.audio_url = data.audio_url
      data.question_data.transcript = data.transcript
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Listening Section API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}