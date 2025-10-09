import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData, mapTaskQuestions } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for reading lesson data
 * Fetches reading-specific data from relevant tables
 * GET /api/lessons/reading/[task_id]
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

    console.log('[ReadingLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[ReadingLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Reading lesson not found',
            task_id: taskId,
            message: 'The requested reading exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch reading task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'reading') {
      return NextResponse.json(
        {
          error: 'Reading lesson not found',
          task_id: taskId,
          message: 'The requested reading exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: readingTask, error: readingError } = await supabase
      .from('reading_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (readingError || !readingTask) {
      console.error('[ReadingLessonAPI] Missing reading task row:', readingError);
      return NextResponse.json(
        {
          error: 'Reading lesson not found',
          task_id: taskId,
          message: 'Reading content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const { data: questions, error: questionsError } = await supabase
      .from('task_questions')
      .select('*')
      .eq('task_id', taskId)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('[ReadingLessonAPI] Failed to fetch questions:', questionsError);
    }

    const base = buildBaseLessonData(taskRow, {
      exerciseType: 'reading_task',
      chapterTitle: 'Reading Exercise',
      lessonName: readingTask.content?.text_title,
      exerciseObjective: 'Improve reading comprehension skills',
      difficultyLevel: readingTask.settings?.reading_instructions?.level,
      language: readingTask.settings?.reading_instructions?.language,
    });

    const lessonData = {
      ...base,
      reading_text:
        readingTask.content?.passage ||
        readingTask.content?.reading_text ||
        readingTask.content?.text ||
        '',
      text_title:
        readingTask.content?.text_title ||
        base.lesson_name ||
        'Reading Passage',
      questions: mapTaskQuestions(questions || []),
      word_count: readingTask.content?.word_count,
      metadata: readingTask.content?.metadata || readingTask.settings || {},
    };

    console.log('[ReadingLessonAPI] Returning task-based reading lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[ReadingLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}