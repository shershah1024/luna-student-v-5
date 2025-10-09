import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  console.log('[Speaking Task API] Request received')
  
  try {
    const { searchParams } = request.nextUrl
    const testId = searchParams.get('test_id')
    const section = searchParams.get('section')
    
    console.log('[Speaking Task API] Request params:', { testId, section })
    
    if (!testId || !section) {
      return NextResponse.json({ error: 'test_id and section parameters are required' }, { status: 400 })
    }
    
    // Query speaking_tasks table which has clean data and rich instructions
    const { data, error } = await supabase
      .from('speaking_tasks')
      .select('*')
      .eq('test_id', testId)
      .eq('section', parseInt(section))
      .single()

    if (error) {
      console.error('[Speaking Task API] Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch speaking task' }, { status: 500 })
    }

    if (!data) {
      console.log('[Speaking Task API] No data found for:', { testId, section })
      return NextResponse.json({ error: 'Speaking task not found' }, { status: 404 })
    }

    console.log('[Speaking Task API] Found speaking task:', { testId, section })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Speaking Task API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}