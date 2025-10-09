import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for writing lesson data
 * Fetches writing-specific data from relevant tables
 * GET /api/lessons/writing/[task_id]
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

    console.log('[WritingLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[WritingLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Writing lesson not found',
            task_id: taskId,
            message: 'The requested writing exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch writing task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'writing') {
      return NextResponse.json(
        {
          error: 'Writing lesson not found',
          task_id: taskId,
          message: 'The requested writing exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: writingTask, error: writingError } = await supabase
      .from('writing_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (writingError || !writingTask) {
      console.error('[WritingLessonAPI] Missing writing task row:', writingError);
      return NextResponse.json(
        {
          error: 'Writing lesson not found',
          task_id: taskId,
          message: 'Writing content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const content = writingTask.content || {};
    const settings = writingTask.settings || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: content.exercise_type || 'writing_task',
      chapterTitle: 'Writing Exercise',
      lessonName: content.title,
      exerciseObjective: 'Develop writing skills',
      difficultyLevel: settings.difficulty_level,
      language: settings.language,
    });

    const lessonData = {
      ...base,
      prompt: content.instructions || content.prompt || settings.prompt,
      word_count:
        settings.word_count ||
        taskRow.parameters?.word_count ||
        content.word_count ||
        150,
      time_limit:
        settings.time_limit ||
        taskRow.parameters?.time_limit ||
        content.time_limit ||
        30,
      grading_criteria: writingTask.rating_schema || [],
      writing_type: settings.task_type || content.task_type || 'essay',
      instructions: content.instructions || null,
      tips: content.tips || [],
      metadata: taskRow.metadata || {},
    };

    console.log('[WritingLessonAPI] Returning task-based writing lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[WritingLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}