import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';


export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  // Log the incoming request URL
  console.log('[API] /api/writing-tasks called with URL:', req.url);
  console.log('[API] PRODUCTION DEBUG - Request details:', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer')
  });
  
  // Get the authenticated user
  const { userId } = await auth();
  console.log('[API] Authenticated userId:', userId);
  
  // If no authenticated user, return 401
  if (!userId) {
    console.warn('[API] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('task_id');
  console.log('[API] Query params:', { taskId });
  console.log('[API] PRODUCTION DEBUG - Detailed params:', {
    taskId: taskId,
    taskIdType: typeof taskId,
    taskIdLength: taskId?.length,
    allParams: Object.fromEntries(searchParams.entries()),
    isValidTaskId: !!taskId && taskId.length > 0
  });

  let query = supabase
    .from('writing_assignments')
    .select(`
      id,
      task_id,
      instruction,
      assignment_id,
      lesson_id,
      level,
      image_url,
      created_at
    `);

  if (taskId) {
    query = query.eq('task_id', taskId);
    
    console.log('[API] PRODUCTION DEBUG - About to execute Supabase query:', {
      table: 'writing_assignments',
      filter: `task_id = ${taskId}`,
      timestamp: new Date().toISOString()
    });
    
    // Fetch single writing assignment
    const { data, error } = await query.single();

    console.log('[API] PRODUCTION DEBUG - Supabase query completed:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      dataKeys: data ? Object.keys(data) : null,
      dataTaskId: data?.task_id
    });

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[API] Writing assignment not found for task_id:', taskId);
        console.log('[API] PRODUCTION DEBUG - Not found details:', {
          searchedTaskId: taskId,
          errorCode: error.code,
          errorMessage: error.message,
          table: 'writing_assignments'
        });
        return NextResponse.json(
          { error: 'Writing assignment not found' }, 
          { status: 404 }
        );
      }
      console.error('[API] Supabase query error:', error);
      console.error('[API] PRODUCTION DEBUG - Database error:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Supabase query result:', data);
    console.log('[API] PRODUCTION DEBUG - Success response:', {
      dataExists: !!data,
      dataSize: JSON.stringify(data).length,
      dataType: typeof data,
      returnedTaskId: data?.task_id,
      matchesRequestedTaskId: data?.task_id === taskId
    });
    return NextResponse.json(data);
  } else {
    // Fetch all writing assignments
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[API] Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  }
}
