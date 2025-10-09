import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for speaking lesson data
 * GET /api/lessons/speaking/[task_id]
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

    console.log('[SpeakingLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[SpeakingLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Speaking lesson not found',
            task_id: taskId,
            message: 'The requested speaking exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch speaking task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'speaking') {
      return NextResponse.json(
        {
          error: 'Speaking lesson not found',
          task_id: taskId,
          message: 'The requested speaking exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: speakingTask, error: speakingError } = await supabase
      .from('speaking_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (speakingError || !speakingTask) {
      console.error('[SpeakingLessonAPI] Missing speaking task row:', speakingError);
      return NextResponse.json(
        {
          error: 'Speaking lesson not found',
          task_id: taskId,
          message: 'Speaking content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const content = speakingTask.content || {};
    const settings = speakingTask.settings || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: content.exercise_type || settings.exercise_subtype || 'speaking_task',
      chapterTitle: 'Speaking Exercise',
      lessonName: content.title || settings.lesson_name,
      exerciseObjective: content.objective || settings.exercise_objective || 'Develop speaking skills',
      difficultyLevel: settings.difficulty_level || content.cefr_level,
      language: settings.language || content.language,
    });

    const lessonData = {
      ...base,
      prompt: content.instructions || settings.prompt,
      recording_duration: settings.duration || content.duration || 60,
      evaluation_criteria:
        settings.evaluation_criteria || settings.rating_schema || content.rating_schema || [],
      tips: settings.tips || content.tips || [],
      metadata: taskRow.metadata || {},
    };

    console.log('[SpeakingLessonAPI] Returning task-based speaking lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[SpeakingLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}