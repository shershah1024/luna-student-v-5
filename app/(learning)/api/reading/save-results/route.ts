import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Save reading exercise results to the database after completion
 * POST /api/reading/save-results
 */
export async function POST(request: NextRequest) {
  console.log('=== READING RESULTS SAVE START ===');
  console.log('[READING RESULTS] Request timestamp:', new Date().toISOString());

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[READING RESULTS] Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const {
      taskId,
      sectionId,
      lessonId,
      title,
      score,
      maxScore,
      timeTakenSeconds,
      exerciseResults,
      readingTextPreview
    } = body;

    console.log('[READING RESULTS] Request data:', {
      taskId,
      sectionId,
      lessonId,
      title,
      score,
      maxScore,
      timeTakenSeconds,
      userId,
      exerciseResultsCount: exerciseResults ? exerciseResults.length : 0,
      readingTextPreviewLength: readingTextPreview ? readingTextPreview.length : 0
    });

    // Validate required fields
    if (!taskId || score === undefined || !maxScore) {
      console.log('[READING RESULTS] Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: taskId, score, maxScore' 
      }, { status: 400 });
    }

    // Validate score range
    if (score < 0 || score > maxScore) {
      console.log('[READING RESULTS] Invalid score range:', { score, maxScore });
      return NextResponse.json({ 
        error: 'Score must be between 0 and maxScore' 
      }, { status: 400 });
    }

    // Prepare reading result data
    const readingResultData = {
      user_id: userId,
      task_id: taskId,
      section_id: sectionId || null,
      lesson_id: lessonId || null,
      title: title || null,
      score: score,
      max_score: maxScore,
      time_taken_seconds: timeTakenSeconds || null,
      exercise_results: exerciseResults ? JSON.stringify(exerciseResults) : null,
      reading_text_preview: readingTextPreview || null
    };

    console.log('[READING RESULTS] Inserting reading result...');

    // Insert reading result into database
    const { data: insertedResult, error: insertError } = await supabase
      .from('reading_results')
      .insert(readingResultData)
      .select('*')
      .single();

    if (insertError) {
      console.error('[READING RESULTS] Error inserting reading result:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save reading results',
        details: insertError.message
      }, { status: 500 });
    }

    console.log('[READING RESULTS] Successfully saved reading result:', {
      id: insertedResult.id,
      taskId: insertedResult.task_id,
      score: insertedResult.score,
      maxScore: insertedResult.max_score,
      percentage: insertedResult.percentage
    });

    // Check if this reading result should trigger task completion
    const percentage = (score / maxScore) * 100;
    let taskCompletionResult = null;

    if (percentage >= 70) { // 70% threshold for reading completion
      console.log('[READING RESULTS] Reading score qualifies for task completion, updating task progress...');
      
      try {
        // Check if task completion already exists
        const { data: existingCompletion, error: completionError } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .single();

        if (completionError && completionError.code !== 'PGRST116') {
          console.error('[READING RESULTS] Error checking existing completion:', completionError);
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
                console.log('[READING RESULTS] Updated task completion:', updatedCompletion.id);
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
              console.log('[READING RESULTS] Created task completion:', newCompletion.id);
            }
          }
        }
      } catch (taskError) {
        console.error('[READING RESULTS] Task completion update error:', taskError);
        // Don't fail the whole operation if task completion fails
      }
    }

    // Return success response
    const response = {
      success: true,
      readingResult: {
        id: insertedResult.id,
        taskId: insertedResult.task_id,
        score: insertedResult.score,
        maxScore: insertedResult.max_score,
        percentage: insertedResult.percentage,
        timeTakenSeconds: insertedResult.time_taken_seconds,
        createdAt: insertedResult.created_at
      },
      taskCompletion: taskCompletionResult,
      timestamp: new Date().toISOString()
    };

    console.log('[READING RESULTS] Success response:', {
      ...response,
      readingResult: `[ID: ${response.readingResult.id}]`,
      taskCompletion: taskCompletionResult ? `[ID: ${taskCompletionResult.id}]` : 'None'
    });
    console.log('=== READING RESULTS SAVE END (SUCCESS) ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[READING RESULTS] Unexpected error:', error);
    console.error('[READING RESULTS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== READING RESULTS SAVE END (ERROR) ===');

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}