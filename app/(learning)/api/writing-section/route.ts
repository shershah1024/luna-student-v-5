import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  console.log('[Writing Section API] Request received')
  
  try {
    const { searchParams } = request.nextUrl
    const testId = searchParams.get('test_id')
    const section = searchParams.get('section')
    
    console.log('[Writing Section API] Request params:', { testId, section })
    
    if (!testId || !section) {
      return NextResponse.json({ error: 'test_id and section parameters are required' }, { status: 400 })
    }
    
    // Simple query - hardcode course to telc_a1 and get specific section
    const { data, error } = await supabase
      .from('writing_tests')
      .select('*')
      .eq('course', 'telc_a1')
      .eq('test_id', testId)
      .eq('section', parseInt(section))
      .single()

    if (error) {
      console.error('[Writing Section API] Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch writing section' }, { status: 500 })
    }

    if (!data) {
      console.log('[Writing Section API] No data found for:', { testId, section })
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    console.log('[Writing Section API] Found writing section:', { testId, section })
    
    // Parse question_data if it's a string
    if (data.question_data && typeof data.question_data === 'string') {
      try {
        data.question_data = JSON.parse(data.question_data)
      } catch (parseError) {
        console.error('[Writing Section API] Error parsing question_data:', parseError)
      }
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Writing Section API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}