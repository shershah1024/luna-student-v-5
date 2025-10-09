import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Save quiz results to the database after completion
 * POST /api/quiz/save-results
 */
export async function POST(request: NextRequest) {
  console.log('=== QUIZ RESULTS SAVE START ===');
  console.log('[QUIZ RESULTS] Request timestamp:', new Date().toISOString());

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[QUIZ RESULTS] Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const {
      taskId,
      quizId,
      score,
      totalQuestions,
      timeTakenSeconds,
      answers,
      difficultyLevel,
      quizTitle
    } = body;

    console.log('[QUIZ RESULTS] Request data:', {
      taskId,
      quizId,
      score,
      totalQuestions,
      timeTakenSeconds,
      userId,
      difficultyLevel,
      quizTitle,
      answersCount: answers ? Object.keys(answers).length : 0
    });

    // Validate required fields
    if (!taskId || score === undefined || !totalQuestions || !timeTakenSeconds) {
      console.log('[QUIZ RESULTS] Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, score, totalQuestions, timeTakenSeconds' 
      }, { status: 400 });
    }

    // Validate score range
    if (score < 0 || score > totalQuestions) {
      console.log('[QUIZ RESULTS] Invalid score range:', { score, totalQuestions });
      return NextResponse.json({ 
        error: 'Score must be between 0 and totalQuestions' 
      }, { status: 400 });
    }

    // Prepare quiz result data
    const quizResultData = {
      user_id: userId,
      task_id: taskId,
      quiz_id: quizId || null,
      score: score,
      total_questions: totalQuestions,
      time_taken_seconds: timeTakenSeconds,
      answers: answers ? JSON.stringify(answers) : null,
      difficulty_level: difficultyLevel || null,
      quiz_title: quizTitle || null
    };

    console.log('[QUIZ RESULTS] Inserting quiz result...');

    // Insert quiz result into database
    const { data: insertedResult, error: insertError } = await supabase
      .from('quiz_results')
      .insert(quizResultData)
      .select('*')
      .single();

    if (insertError) {
      console.error('[QUIZ RESULTS] Error inserting quiz result:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save quiz results',
        details: insertError.message
      }, { status: 500 });
    }

    console.log('[QUIZ RESULTS] Successfully saved quiz result:', {
      id: insertedResult.id,
      taskId: insertedResult.task_id,
      score: insertedResult.score,
      totalQuestions: insertedResult.total_questions,
      percentage: insertedResult.percentage,
      timeTaken: insertedResult.time_taken_seconds
    });

    // Check if this quiz result should trigger task completion
    const percentage = (score / totalQuestions) * 100;
    let taskCompletionResult = null;

    if (percentage >= 70) { // 70% threshold for quiz completion
      console.log('[QUIZ RESULTS] Quiz score qualifies for task completion, updating task progress...');
      
      try {
        // Check if task completion already exists
        const { data: existingCompletion, error: completionError } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .single();

        if (completionError && completionError.code !== 'PGRST116') {
          console.error('[QUIZ RESULTS] Error checking existing completion:', completionError);
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
                console.log('[QUIZ RESULTS] Updated task completion:', updatedCompletion.id);
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
              console.log('[QUIZ RESULTS] Created task completion:', newCompletion.id);
            }
          }
        }
      } catch (taskError) {
        console.error('[QUIZ RESULTS] Task completion update error:', taskError);
        // Don't fail the whole operation if task completion fails
      }
    }

    // Return success response
    const response = {
      success: true,
      quizResult: {
        id: insertedResult.id,
        taskId: insertedResult.task_id,
        score: insertedResult.score,
        totalQuestions: insertedResult.total_questions,
        percentage: insertedResult.percentage,
        timeTakenSeconds: insertedResult.time_taken_seconds,
        createdAt: insertedResult.created_at
      },
      taskCompletion: taskCompletionResult,
      timestamp: new Date().toISOString()
    };

    console.log('[QUIZ RESULTS] Success response:', {
      ...response,
      quizResult: `[ID: ${response.quizResult.id}]`,
      taskCompletion: taskCompletionResult ? `[ID: ${taskCompletionResult.id}]` : 'None'
    });
    console.log('=== QUIZ RESULTS SAVE END (SUCCESS) ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[QUIZ RESULTS] Unexpected error:', error);
    console.error('[QUIZ RESULTS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== QUIZ RESULTS SAVE END (ERROR) ===');

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}