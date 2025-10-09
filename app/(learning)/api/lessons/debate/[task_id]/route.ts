import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for debate lesson data
 * GET /api/lessons/debate/[task_id]
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

    console.log('[DebateLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[DebateLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Debate lesson not found',
            task_id: taskId,
            message: 'The requested debate exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch debate task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'debate') {
      return NextResponse.json(
        {
          error: 'Debate lesson not found',
          task_id: taskId,
          message: 'The requested debate exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: debateTask, error: debateError } = await supabase
      .from('debate_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (debateError || !debateTask) {
      console.error('[DebateLessonAPI] Missing debate task row:', debateError);
      return NextResponse.json(
        {
          error: 'Debate lesson not found',
          task_id: taskId,
          message: 'Debate content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const parameters = taskRow.parameters || {};
    const content = debateTask.content || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: 'debate_exercise',
      chapterTitle: 'Debate Exercise',
      lessonName: parameters.assignment_title,
      exerciseObjective:
        `Practice structured debate in ${
          parameters.language || content.language || 'language'
        } at ${
          parameters.difficulty_level || content.cefr_level || 'B1'
        } level`,
      difficultyLevel: parameters.difficulty_level || content.cefr_level,
      language: parameters.language || content.language,
    });

    const lessonData = {
      ...base,
      chapter_theme: parameters.debate_topic || content.debate_topic || 'Debate Practice',
      lesson_name:
        base.lesson_name ||
        `Debate: ${parameters.debate_topic || content.debate_topic || 'Topic'}`,
      debate_topic: parameters.debate_topic || content.debate_topic,
      instructions: content.instructions || null,
      metadata: taskRow.metadata || {},
    };

    console.log('[DebateLessonAPI] Returning task-based debate lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[DebateLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}