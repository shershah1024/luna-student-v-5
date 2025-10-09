import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for pronunciation lesson data
 * GET /api/lessons/pronunciation/[task_id]
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

    console.log('[PronunciationLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[PronunciationLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Pronunciation lesson not found',
            task_id: taskId,
            message: 'The requested pronunciation exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch pronunciation task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'pronunciation') {
      return NextResponse.json(
        {
          error: 'Pronunciation lesson not found',
          task_id: taskId,
          message: 'The requested pronunciation exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: pronunciationTask, error: pronunciationError } = await supabase
      .from('pronunciation_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (pronunciationError || !pronunciationTask) {
      console.error('[PronunciationLessonAPI] Missing pronunciation task row:', pronunciationError);
      return NextResponse.json(
        {
          error: 'Pronunciation lesson not found',
          task_id: taskId,
          message: 'Pronunciation content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const content = pronunciationTask.content || {};
    const settings = pronunciationTask.settings || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: content.exercise_type || 'pronunciation_practice',
      chapterTitle: 'Pronunciation Practice',
      lessonName: content.title || settings.topic,
      exerciseObjective: 'Master pronunciation',
      difficultyLevel: settings.difficulty_level || content.difficulty_level,
      language: settings.language || content.language,
    });

    const lessonData = {
      ...base,
      target_words: content.words || content.words_list || settings.words || [],
      phonemes: content.focus_sounds || settings.focus_sounds || [],
      audio_samples: content.audio_samples || [],
      metadata: taskRow.metadata || {},
    };

    console.log('[PronunciationLessonAPI] Returning task-based pronunciation lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[PronunciationLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}