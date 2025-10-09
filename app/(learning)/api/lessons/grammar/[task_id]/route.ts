import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for grammar lesson data
 * Fetches grammar-specific data from relevant tables
 * GET /api/lessons/grammar/[task_id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  try {
    const taskId = params.task_id;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing task_id parameter' },
        { status: 400 }
      );
    }

    console.log('[GrammarLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[GrammarLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Grammar lesson not found',
            task_id: taskId,
            message: 'The requested grammar exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch grammar task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'grammar') {
      return NextResponse.json(
        {
          error: 'Grammar lesson not found',
          task_id: taskId,
          message: 'The requested grammar exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: grammarTask, error: grammarError } = await supabase
      .from('grammar_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (grammarError || !grammarTask) {
      console.error('[GrammarLessonAPI] Missing grammar task row:', grammarError);
      return NextResponse.json(
        {
          error: 'Grammar lesson not found',
          task_id: taskId,
          message: 'Grammar content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const content = grammarTask.content || {};
    const settings = grammarTask.settings || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: content.exercise_type || 'grammar_main',
      chapterTitle: 'Grammar Lesson',
      lessonName: content.title || settings.title,
      exerciseObjective: 'Master grammar concepts',
      difficultyLevel: settings.level,
      language: settings.language,
    });

    const lessonData = {
      ...base,
      grammar_topic: content.topic || settings.topic || base.lesson_name,
      grammar_rules: content.rules || settings.rules || [],
      examples: content.examples || settings.examples || [],
      exercises: content.exercises || settings.exercises || [],
      is_main_grammar:
        (content.exercise_type || settings.exercise_type || 'grammar_main') === 'grammar_main',
      metadata: taskRow.metadata || {},
    };

    console.log('[GrammarLessonAPI] Returning task-based grammar lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[GrammarLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}