import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData, mapTaskQuestions } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for listening lesson data
 * Fetches listening-specific data from relevant tables
 * GET /api/lessons/listening/[task_id]
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

    console.log('[ListeningLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[ListeningLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Listening lesson not found',
            task_id: taskId,
            message: 'The requested listening exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch listening task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'listening') {
      return NextResponse.json(
        {
          error: 'Listening lesson not found',
          task_id: taskId,
          message: 'The requested listening exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: listeningTask, error: listeningError } = await supabase
      .from('listening_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (listeningError || !listeningTask) {
      console.error('[ListeningLessonAPI] Missing listening task row:', listeningError);
      return NextResponse.json(
        {
          error: 'Listening lesson not found',
          task_id: taskId,
          message: 'Listening content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const { data: questionRows, error: questionsError } = await supabase
      .from('task_questions')
      .select('*')
      .eq('task_id', taskId)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('[ListeningLessonAPI] Failed to fetch questions:', questionsError);
    }

    const base = buildBaseLessonData(taskRow, {
      exerciseType: 'listening_task',
      chapterTitle: 'Listening Exercise',
      lessonName: listeningTask.content?.title,
      exerciseObjective: 'Improve listening skills',
      difficultyLevel:
        listeningTask.settings?.level || listeningTask.settings?.difficulty_level,
      language: listeningTask.settings?.language,
    });

    const lessonData = {
      ...base,
      audio_url: listeningTask.audio_url || listeningTask.content?.audio_url,
      transcript:
        listeningTask.transcript || listeningTask.content?.transcript || null,
      questions: mapTaskQuestions(questionRows || []),
      duration:
        listeningTask.settings?.audio_duration || listeningTask.content?.duration,
      metadata: listeningTask.content?.metadata || listeningTask.settings || {},
    };

    console.log('[ListeningLessonAPI] Returning task-based listening lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[ListeningLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}