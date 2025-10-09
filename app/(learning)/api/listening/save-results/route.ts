import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Save listening exercise results to the database after completion
 * POST /api/listening/save-results
 */
export async function POST(request: NextRequest) {
  console.log('=== LISTENING RESULTS SAVE START ===');
  console.log('[LISTENING RESULTS] Request timestamp:', new Date().toISOString());

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[LISTENING RESULTS] Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const {
      taskId,
      exerciseId,
      audioTitle,
      audioUrl,
      score,
      maxScore,
      audioPlayCount,
      timeTakenSeconds,
      questionResults,
      transcriptViewed
    } = body;

    console.log('[LISTENING RESULTS] Request data:', {
      taskId,
      exerciseId,
      audioTitle,
      score,
      maxScore,
      audioPlayCount,
      timeTakenSeconds,
      userId,
      transcriptViewed,
      questionResultsCount: questionResults ? questionResults.length : 0
    });

    // Validate required fields
    if (!taskId || score === undefined || !maxScore) {
      console.log('[LISTENING RESULTS] Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, score, maxScore' 
      }, { status: 400 });
    }

    // Validate score range
    if (score < 0 || score > maxScore) {
      console.log('[LISTENING RESULTS] Invalid score range:', { score, maxScore });
      return NextResponse.json({ 
        error: 'Score must be between 0 and maxScore' 
      }, { status: 400 });
    }

    // Prepare listening result data
    const listeningResultData = {
      user_id: userId,
      task_id: taskId,
      exercise_id: exerciseId || null,
      audio_title: audioTitle || null,
      audio_url: audioUrl || null,
      score: score,
      max_score: maxScore,
      audio_play_count: audioPlayCount || 1,
      time_taken_seconds: timeTakenSeconds || null,
      question_results: questionResults ? JSON.stringify(questionResults) : null,
      transcript_viewed: transcriptViewed || false
    };

    console.log('[LISTENING RESULTS] Inserting listening result...');

    // Insert listening result into database
    const { data: insertedResult, error: insertError } = await supabase
      .from('listening_results')
      .insert(listeningResultData)
      .select('*')
      .single();

    if (insertError) {
      console.error('[LISTENING RESULTS] Error inserting listening result:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save listening results',
        details: insertError.message
      }, { status: 500 });
    }

    console.log('[LISTENING RESULTS] Successfully saved listening result:', {
      id: insertedResult.id,
      taskId: insertedResult.task_id,
      score: insertedResult.score,
      maxScore: insertedResult.max_score,
      percentage: insertedResult.percentage,
      audioPlayCount: insertedResult.audio_play_count
    });

    // Check if this listening result should trigger task completion
    const percentage = (score / maxScore) * 100;
    let taskCompletionResult = null;

    if (percentage >= 70) { // 70% threshold for listening completion
      console.log('[LISTENING RESULTS] Listening score qualifies for task completion, updating task progress...');
      
      try {
        // Check if task completion already exists
        const { data: existingCompletion, error: completionError } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .single();

        if (completionError && completionError.code !== 'PGRST116') {
          console.error('[LISTENING RESULTS] Error checking existing completion:', completionError);
        } else {
          const currentTime = new Date().toISOString();

          if (existingCompletion) {
            // Update existing completion with better score if applicable
            const shouldUpdate = !existingCompletion.completed_at || percentage > (existingCompletion.score || 0);
            
            if (shouldUpdate) {
              const updateData: any = {
                score: percentage,
                updated_at: currentTime
              };

              if (!existingCompletion.completed_at) {
                updateData.completed_at = currentTime;
              }

              const { data: updatedCompletion, error: updateError } = await supabase
                .from('task_completions')
                .update(updateData)
                .eq('id', existingCompletion.id)
                .select()
                .single();

              if (!updateError) {
                taskCompletionResult = updatedCompletion;
                console.log('[LISTENING RESULTS] Updated task completion:', updatedCompletion.id);
              }
            }
          } else {
            // Create new task completion
            const completionData = {
              user_id: userId,
              task_id: taskId,
              course_id: 'goethe-a1', // Hardcoded for now, could be derived from taskId
              score: percentage,
              attempts: 1,
              completed_at: currentTime,
              created_at: currentTime,
              updated_at: currentTime
            };

            const { data: newCompletion, error: insertCompletionError } = await supabase
              .from('task_completions')
              .insert(completionData)
              .select()
              .single();

            if (!insertCompletionError) {
              taskCompletionResult = newCompletion;
              console.log('[LISTENING RESULTS] Created task completion:', newCompletion.id);
            }
          }
        }
      } catch (taskError) {
        console.error('[LISTENING RESULTS] Task completion update error:', taskError);
        // Don't fail the whole operation if task completion fails
      }
    }

    // Return success response
    const response = {
      success: true,
      listeningResult: {
        id: insertedResult.id,
        taskId: insertedResult.task_id,
        score: insertedResult.score,
        maxScore: insertedResult.max_score,
        percentage: insertedResult.percentage,
        audioPlayCount: insertedResult.audio_play_count,
        timeTakenSeconds: insertedResult.time_taken_seconds,
        createdAt: insertedResult.created_at
      },
      taskCompletion: taskCompletionResult,
      timestamp: new Date().toISOString()
    };

    console.log('[LISTENING RESULTS] Success response:', {
      ...response,
      listeningResult: `[ID: ${response.listeningResult.id}]`,
      taskCompletion: taskCompletionResult ? `[ID: ${taskCompletionResult.id}]` : 'None'
    });
    console.log('=== LISTENING RESULTS SAVE END (SUCCESS) ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[LISTENING RESULTS] Unexpected error:', error);
    console.error('[LISTENING RESULTS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== LISTENING RESULTS SAVE END (ERROR) ===');

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}