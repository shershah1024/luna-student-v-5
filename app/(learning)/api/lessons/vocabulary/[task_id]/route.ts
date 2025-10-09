import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for vocabulary lesson data
 * Fetches vocabulary-specific data from relevant tables
 * GET /api/lessons/vocabulary/[task_id]
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

    console.log('[VocabularyLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[VocabularyLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Vocabulary lesson not found',
            task_id: taskId,
            message: 'The requested vocabulary exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch vocabulary task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'vocabulary') {
      return NextResponse.json(
        {
          error: 'Vocabulary lesson not found',
          task_id: taskId,
          message: 'The requested vocabulary exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: vocabTask, error: vocabError } = await supabase
      .from('vocabulary_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (vocabError || !vocabTask) {
      console.error('[VocabularyLessonAPI] Missing vocabulary task row:', vocabError);
      return NextResponse.json(
        {
          error: 'Vocabulary lesson not found',
          task_id: taskId,
          message: 'Vocabulary content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const content = vocabTask.content || {};
    const settings = vocabTask.settings || {};
    const words = content.vocabulary_data?.words || content.words || [];

    const base = buildBaseLessonData(taskRow, {
      exerciseType: 'vocabulary_learning',
      chapterTitle: 'Vocabulary Lesson',
      lessonName: settings.assignment_title,
      exerciseObjective: 'Master new vocabulary words',
      difficultyLevel: settings.cefr_level,
      language: settings.language,
    });

    const lessonData = {
      ...base,
      vocabulary_words: words,
      word_count: words.length,
      practice_modes: ['flashcards', 'matching', 'spelling', 'listening'],
      target_mastery: 80,
      metadata: taskRow.metadata || {},
    };

    console.log('[VocabularyLessonAPI] Returning task-based vocabulary lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[VocabularyLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}