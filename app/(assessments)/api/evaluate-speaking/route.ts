import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  console.log('[Evaluate Speaking] Received evaluation request');

  try {
    const { task_id, test_id, exam_id } = await req.json();

    // Authenticate user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!task_id) {
      return NextResponse.json({ error: 'Missing task_id' }, { status: 400 });
    }

    console.log('[Evaluate Speaking] Processing evaluation for', { userId, task_id, test_id });

    // Check if conversation exists
    const { data: latestLog, error: latestError } = await supabase
      .from('task_conversation_logs')
      .select('conversation_id')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error('[Evaluate Speaking] Error fetching latest conversation id:', latestError);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }

    const conversationId = latestLog?.conversation_id;

    if (!conversationId) {
      return NextResponse.json({ error: 'No conversation found for this task' }, { status: 404 });
    }

    const { data: conversation, error: fetchError } = await supabase
      .from('task_conversation_logs')
      .select('role, message, payload')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .order('turn_index', { ascending: true });

    if (fetchError) {
      console.error('[Evaluate Speaking] Error fetching conversation:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }

    if (!conversation || conversation.length === 0) {
      return NextResponse.json({ error: 'No conversation found for this task' }, { status: 404 });
    }

    // Get course and section information to route to correct evaluation endpoint
    const { data: taskDetails, error: taskError } = await supabase
      .from('speaking_tasks')
      .select('settings')
      .eq('task_id', task_id)
      .single();

    if (taskError || !taskDetails) {
      console.error('[Evaluate Speaking] Error fetching task details:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const course = taskDetails.settings?.course;
    const section = taskDetails.settings?.section;

    // Route to the generic speaking evaluation endpoint
    const evaluationEndpoint = `${req.nextUrl.origin}/api/speaking-evaluations`;
    
    // Support Goethe courses (converted from telc)
    if (!course || !course.startsWith('goethe_')) {
      console.log('[Evaluate Speaking] Warning: Non-Goethe course detected:', course);
      // Continue anyway as we now support all courses generically
    }

    console.log('[Evaluate Speaking] Routing to:', evaluationEndpoint, 'for course:', course, 'section:', section);

    // Call the appropriate evaluation API
    const evaluationResponse = await fetch(evaluationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
        'Cookie': req.headers.get('Cookie') || '',
      },
      body: JSON.stringify({ task_id, test_id, exam_id })
    });

    if (!evaluationResponse.ok) {
      throw new Error(`Evaluation API failed: ${evaluationResponse.status}`);
    }

    const evaluation = await evaluationResponse.json();

    console.log('[Evaluate Speaking] Evaluation completed successfully');
    
    return NextResponse.json({
      success: true,
      evaluation,
      message: 'Speaking evaluation completed successfully'
    });

  } catch (error) {
    console.error('[Evaluate Speaking] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}