import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fetch exercise data for a given task_id
 * This endpoint serves data for various exercise types including chatbot roleplay
 * GET /api/exercise-data?task_id=<uuid>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: task_id' },
        { status: 400 }
      );
    }

    console.log('[ExerciseData] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[ExerciseData] Failed to fetch task row:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Exercise data not found for the given task_id' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch exercise data' },
        { status: 500 }
      );
    }

    if (!taskRow) {
      return NextResponse.json(
        { error: 'Exercise data not found for the given task_id' },
        { status: 404 }
      );
    }

    const metadata = taskRow.metadata || {};
    const parameters = taskRow.parameters || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: metadata.exercise_type,
      chapterId: metadata.chapter_id,
      chapterTitle: metadata.chapter_title,
      lessonName: metadata.lesson_name,
      exerciseObjective: metadata.exercise_objective,
      difficultyLevel: metadata.difficulty_level,
      language: metadata.language,
    });

    const exerciseData: Record<string, any> = {
      course_name: base.course_name,
      chapter_id: base.chapter_id,
      chapter_title: base.chapter_title,
      exercise_id: taskId,
      exercise_objective: base.exercise_objective,
      exercise_type: base.exercise_type,
      status: base.status,
      task_id: taskId,
      lesson_name: base.lesson_name,
      assignment_type: taskRow.task_type,
      language: base.language,
      difficulty_level: base.difficulty_level,
      parameters,
      metadata,
    };

    if (taskRow.task_type === 'chatbot') {
      const { data: chatbotAssignment, error: chatbotError } = await supabase
        .from('chatbot_tasks')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (chatbotError) {
        console.error('[ExerciseData] Failed to fetch chatbot content:', chatbotError);
      }

      const content = chatbotAssignment?.content || {};
      exerciseData.chatbot_instructions = content.instructions || null;
      exerciseData.topic = parameters.topic || content.topic;
      exerciseData.chapter_title = base.chapter_title || 'Chatbot Conversation';
      exerciseData.exercise_type = content.exercise_type || 'chatbot_roleplay';
      exerciseData.exercise_objective =
        base.exercise_objective ||
        `Practice ${exerciseData.language || 'language'} conversation at ${
          exerciseData.difficulty_level || 'A1'
        } level`;
    }

    console.log('[ExerciseData] Returning task-based payload for', taskId);
    return NextResponse.json(exerciseData);

  } catch (error) {
    console.error('[ExerciseData] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}