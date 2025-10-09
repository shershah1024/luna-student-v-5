import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * API endpoint to save pronunciation lesson scores
 * Saves individual word scores and calculates overall lesson performance
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user using Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const {
      task_id,
      course_name = 'goethe-a1',
      words_attempted,
      word_scores,
      average_score,
      is_partial = false
    } = await req.json();

    // Validate required data
    if (!task_id || !words_attempted || average_score === undefined) {
      return NextResponse.json(
        { error: 'Missing required data: task_id, words_attempted, and average_score are required' },
        { status: 400 }
      );
    }

    console.log('[Pronunciation Lesson Score] Saving scores for task:', task_id, {
      userId,
      wordsCount: words_attempted.length,
      averageScore: average_score
    });

    // Generate a unique attempt ID for this lesson session
    const attemptId = `lesson_${task_id}_${Date.now()}`;

    // Save individual word scores
    if (word_scores && Object.keys(word_scores).length > 0) {
      const wordScoreRecords = Object.entries(word_scores).map(([word, score]) => ({
        user_id: userId,
        task_id,
        course: course_name,
        word,
        pronunciation_score: score as number,
        attempt_id: attemptId,
        exercise_type: 'pronunciation_practice',
        created_at: new Date().toISOString()
      }));

      const { error: wordScoresError } = await supabase
        .from('pronunciation_scores')
        .insert(wordScoreRecords);

      if (wordScoresError) {
        console.error('[Pronunciation Lesson Score] Error saving word scores:', wordScoresError);
        // Continue even if individual word scores fail
      } else {
        console.log('[Pronunciation Lesson Score] Saved', wordScoreRecords.length, 'word scores');
      }
    }

    // Only create lesson summary and update task completion if this is the final save
    let summaryData = null;
    if (!is_partial) {
      // Create a summary record in pronunciation_scores with aggregated data
      const lessonSummary = {
        user_id: userId,
        task_id,
        course: course_name,
        word: 'LESSON_SUMMARY', // Special marker for lesson summaries
        pronunciation_score: average_score,
        attempt_id: attemptId,
        exercise_type: 'pronunciation_practice',
        word_details: {
          words_attempted,
          word_scores,
          total_words: words_attempted.length,
          average_score,
          completed_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      const { data, error: summaryError } = await supabase
        .from('pronunciation_scores')
        .insert(lessonSummary)
        .select()
        .single();

      if (summaryError) {
        console.error('[Pronunciation Lesson Score] Error saving lesson summary:', summaryError);
      } else {
        console.log('[Pronunciation Lesson Score] Saved lesson summary with id:', data?.id);
        summaryData = data;
      }

      // Note: Task completion is handled by the frontend's completeTask() call in the page component
      console.log('[Pronunciation Lesson Score] Lesson summary saved successfully');
    }

    // Return success response
    return NextResponse.json({
      success: true,
      attempt_id: attemptId,
      average_score,
      words_count: words_attempted.length,
      summary_id: summaryData?.id || null,
      message: 'Pronunciation scores saved successfully'
    });

  } catch (error) {
    console.error('[Pronunciation Lesson Score] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
