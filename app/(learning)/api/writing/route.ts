import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const course = searchParams.get('course')

    if (!course) {
      return NextResponse.json({ error: 'Course parameter is required' }, { status: 400 })
    }

    console.log(`[API] Fetching writing tests for course: ${course}`)

    // Query the unified writing_tests table for all courses
    // Order by section first to ensure proper section ordering within each test
    const { data, error } = await supabase
      .from('writing_tests')
      .select('*')
      .eq('course', course)
      .order('test_id', { ascending: true })
      .order('section', { ascending: true })

    if (error) {
      console.error('[API] Error fetching writing tests:', error)
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
    }

    console.log(`[API] Found ${data?.length || 0} writing tests for ${course}`)

    // Return the full data array - the frontend will handle grouping
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[API] Error in writing route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
