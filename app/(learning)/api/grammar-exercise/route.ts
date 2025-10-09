// app/api/grammar-exercise/route.ts
// Endpoint to fetch grammar exercise data by task_id

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[GRAMMAR-EXERCISE] Fetching grammar exercise for task_id: ${taskId}`);

    // Fetch grammar exercise from grammar_tasks table
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('grammar_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (exerciseError || !exerciseData) {
      console.error('[GRAMMAR-EXERCISE] Error fetching from grammar_tasks:', exerciseError);
      return NextResponse.json(
        { error: 'Grammar exercise not found' },
        { status: 404 }
      );
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from('task_questions')
      .select('*')
      .eq('task_id', taskId)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('[GRAMMAR-EXERCISE] Error fetching questions:', questionsError);
    }

    const questions = (questionsData || []).map((q: any) => ({
      question_number: q.question_number,
      ...((q.body as any) || {}),
      points: q.points
    }));

    // Return the grammar exercise data
    console.log(`[GRAMMAR-EXERCISE] Successfully fetched exercise with ${questions.length} questions`);

    return NextResponse.json({
      task_id: taskId,
      title: exerciseData.content?.title || exerciseData.settings?.title || 'Grammar Exercise',
      instructions: exerciseData.content?.instructions || exerciseData.settings?.instructions || 'Complete the grammar exercise below.',
      grammar_topics: exerciseData.settings?.grammar_topics || exerciseData.content?.grammar_topics || [],
      questions,
      level: exerciseData.settings?.level || exerciseData.settings?.language_level || 'B1',
      language: exerciseData.settings?.language || 'English',
      estimated_time: exerciseData.content?.metadata?.estimated_time || exerciseData.settings?.estimated_time,
      metadata: exerciseData.content?.metadata || exerciseData.settings || {}
    });

  } catch (error) {
    console.error('[GRAMMAR-EXERCISE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}