import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get course parameter from query string
    const { searchParams } = request.nextUrl
    const course = searchParams.get('course')
    
    console.log(`[API] Fetching speaking tests for course: ${course}`)
    
    if (!course) {
      return NextResponse.json({ error: 'Course parameter is required' }, { status: 400 })
    }
    
    let query = supabase
      .from('speaking_tasks')
      .select('*')
      .eq('course', course)
      .order('test_id', { ascending: true })
      .order('section', { ascending: true })
    
    const { data, error } = await query
    
    if (error) {
      console.error('[API] Error fetching speaking tests:', error)
      return NextResponse.json({ error: 'Failed to fetch speaking tests' }, { status: 500 })
    }
    
    console.log(`[API] Found ${data?.length || 0} speaking tests for ${course}`)
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[API] Error in speaking-tests route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}