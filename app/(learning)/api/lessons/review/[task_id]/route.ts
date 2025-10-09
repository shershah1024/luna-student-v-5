import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for review lesson data
 * GET /api/lessons/review/[task_id]
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

    console.log('[ReviewLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[ReviewLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Review lesson not found',
            task_id: taskId,
            message: 'The requested review exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch review task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'review') {
      return NextResponse.json(
        {
          error: 'Review lesson not found',
          task_id: taskId,
          message: 'The requested review exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const metadata = taskRow.metadata || {};
    const exerciseList = metadata.exercise_list || [];

    const base = buildBaseLessonData(taskRow, {
      exerciseType: metadata.exercise_type || 'unit_review',
      chapterId: metadata.chapter_id,
      chapterTitle: metadata.chapter_title,
      lessonName: metadata.lesson_name || 'Unit Review',
      exerciseObjective:
        metadata.exercise_objective || 'Review and consolidate chapter learning',
      difficultyLevel: metadata.difficulty_level,
      language: metadata.language,
    });

    const lessonData = {
      ...base,
      review_topics: metadata.review_topics || [],
      exercise_list: exerciseList,
      total_exercises: exerciseList.length,
      metadata,
    };

    console.log('[ReviewLessonAPI] Returning task-based review lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[ReviewLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}