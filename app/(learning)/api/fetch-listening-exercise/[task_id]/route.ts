// app/api/fetch-listening-exercise/[task_id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint to fetch complete listening exercise data
 * Combines data from multiple tables for listening lessons
 * Route: /api/fetch-listening-exercise/[task_id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  try {
    const { task_id } = params;

    if (!task_id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    console.log('[LISTENING-EXERCISE] Fetching data for task_id:', task_id);

    // Validate UUID format
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(task_id)) {
      console.log('[LISTENING-EXERCISE] Invalid UUID format:', task_id);
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Fetch main assignment data
    console.log('[LISTENING-EXERCISE] Fetching task from tasks table...');
    const { data: assignment, error: assignmentError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (assignmentError || !assignment) {
      console.error('[LISTENING-EXERCISE] Assignment not found:', assignmentError);
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    console.log('[LISTENING-EXERCISE] Task found:', assignment.task_type);

    // Initialize response data structure
    let exerciseData: any = {
      task_id: assignment.id,
      assignment_type: assignment.task_type,
      title: assignment.title,
      created_at: assignment.created_at,
      teacher_id: assignment.teacher_id,
      parameters: assignment.parameters,
      metadata: assignment.metadata,
      status: assignment.status
    };

    // Fetch listening exercise content from listening_tasks
    console.log('[LISTENING-EXERCISE] Fetching listening exercise content...');
    const { data: listeningData, error: listeningError } = await supabase
      .from('listening_tasks')
      .select('*')
      .eq('task_id', task_id)
      .single();

    if (listeningData) {
      console.log('[LISTENING-EXERCISE] Listening exercise content found');
      exerciseData = {
        ...exerciseData,
        content: listeningData.content,
        audio_url: listeningData.audio_url,
        transcript: listeningData.transcript,
        full_transcript: listeningData.transcript,
        settings: listeningData.settings
      };
    } else {
      console.log('[LISTENING-EXERCISE] No listening exercise content found:', listeningError);
    }

    // Fetch questions from luna_quiz_questions  
    console.log('[LISTENING-EXERCISE] Fetching questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('task_questions')
      .select('*')
      .eq('task_id', task_id)
      .order('question_number');

    if (questions && questions.length > 0) {
      console.log('[LISTENING-EXERCISE] Found', questions.length, 'questions');
      exerciseData.questions = questions;
      
      // Also include questions in the expected format for the component
      exerciseData.questionsData = questions.map(q => ({
        id: q.id,
        question_number: q.question_number,
        type: q.question_type,
        points: q.points,
        metadata: q.metadata,
        answer: q.answer,
        ...(q.body || {})
      }));
    } else {
      console.log('[LISTENING-EXERCISE] No questions found:', questionsError);
      exerciseData.questions = [];
      exerciseData.questionsData = [];
    }

    // Check if this task has audio URL stored elsewhere (from our audio generation)
    if (!exerciseData.audio_url) {
      console.log('[LISTENING-EXERCISE] Checking for audio URL in other sources...');
      
      // Try to find audio URL from recent API responses or other storage
      // For now, we'll rely on the audio URL being stored in luna_audio_dialogue_assignments
      // or passed via the listening quiz creation response
    }

    // Calculate total points from questions
    const totalPoints = questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;
    exerciseData.total_points = totalPoints;

    // Set exercise type for component compatibility
    exerciseData.exercise_type = 'listening';

    console.log('[LISTENING-EXERCISE] Response data prepared:', {
      task_id: exerciseData.task_id,
      assignment_type: exerciseData.assignment_type,
      title: exerciseData.title,
      has_content: !!exerciseData.content,
      has_audio_url: !!exerciseData.audio_url,
      has_transcript: !!exerciseData.transcript,
      questions_count: exerciseData.questions?.length || 0,
      total_points: exerciseData.total_points
    });

    return NextResponse.json(exerciseData);

  } catch (error) {
    console.error('[LISTENING-EXERCISE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}