import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Update lesson progress when vocabulary items reach mastery levels
 * This API creates or updates task_completions records based on vocabulary progress
 * POST /api/vocabulary/update-lesson-progress
 */
export async function POST(request: NextRequest) {
  console.log('=== LESSON PROGRESS UPDATE START ===');
  console.log('[LESSON PROGRESS] Request timestamp:', new Date().toISOString());

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[LESSON PROGRESS] Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { taskId, courseId } = body;

    console.log('[LESSON PROGRESS] Request data:', { taskId, courseId, userId });

    if (!taskId || !courseId) {
      console.log('[LESSON PROGRESS] Missing required fields');
      return NextResponse.json({ 
        error: 'taskId and courseId are required' 
      }, { status: 400 });
    }

    // Step 1: Check vocabulary mastery progress for this task
    console.log('[LESSON PROGRESS] Checking vocabulary mastery for task...');
    const { data: vocabData, error: vocabError } = await supabase
      .from('user_vocabulary')
      .select('learning_status')
      .eq('user_id', userId)
      .eq('task_id', taskId);

    if (vocabError) {
      console.error('[LESSON PROGRESS] Error fetching vocabulary:', vocabError);
      return NextResponse.json({ 
        error: 'Failed to fetch vocabulary progress' 
      }, { status: 500 });
    }

    if (!vocabData || vocabData.length === 0) {
      console.log('[LESSON PROGRESS] No vocabulary found for task');
      return NextResponse.json({ 
        error: 'No vocabulary found for this task' 
      }, { status: 404 });
    }

    // Calculate progress metrics
    const totalWords = vocabData.length;
    const masteredWords = vocabData.filter(word => 
      parseInt(word.learning_status) >= 5
    ).length;
    const wellPracticedWords = vocabData.filter(word => 
      parseInt(word.learning_status) >= 3
    ).length;
    
    const masteryPercentage = (masteredWords / totalWords) * 100;
    const practicePercentage = (wellPracticedWords / totalWords) * 100;
    
    console.log('[LESSON PROGRESS] Vocabulary progress:', {
      totalWords,
      masteredWords,
      wellPracticedWords,
      masteryPercentage,
      practicePercentage
    });

    // Step 2: Check if task completion already exists
    const { data: existingCompletion, error: completionError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single();

    if (completionError && completionError.code !== 'PGRST116') {
      console.error('[LESSON PROGRESS] Error checking existing completion:', completionError);
      return NextResponse.json({ 
        error: 'Failed to check existing completion' 
      }, { status: 500 });
    }

    console.log('[LESSON PROGRESS] Existing completion:', existingCompletion ? 'Found' : 'Not found');

    // Step 3: Determine if lesson should be marked as completed
    const shouldMarkCompleted = masteryPercentage >= 80; // 80% mastery threshold
    const currentTime = new Date().toISOString();

    let result;

    if (existingCompletion) {
      // Update existing completion record
      console.log('[LESSON PROGRESS] Updating existing completion record...');
      
      const updateData: any = {
        score: masteryPercentage,
        updated_at: currentTime
      };

      // Mark as completed if threshold reached and not already completed
      if (shouldMarkCompleted && !existingCompletion.completed_at) {
        updateData.completed_at = currentTime;
        console.log('[LESSON PROGRESS] Marking task as completed');
      }

      const { data: updatedCompletion, error: updateError } = await supabase
        .from('task_completions')
        .update(updateData)
        .eq('id', existingCompletion.id)
        .select()
        .single();

      if (updateError) {
        console.error('[LESSON PROGRESS] Error updating completion:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update task completion' 
        }, { status: 500 });
      }

      result = updatedCompletion;

    } else {
      // Create new completion record
      console.log('[LESSON PROGRESS] Creating new completion record...');
      
      const completionData: any = {
        user_id: userId,
        task_id: taskId,
        course_id: courseId,
        score: masteryPercentage,
        attempts: 1,
        created_at: currentTime,
        updated_at: currentTime
      };

      // Mark as completed if threshold reached
      if (shouldMarkCompleted) {
        completionData.completed_at = currentTime;
        console.log('[LESSON PROGRESS] Creating task as completed');
      }

      const { data: newCompletion, error: insertError } = await supabase
        .from('task_completions')
        .insert(completionData)
        .select()
        .single();

      if (insertError) {
        console.error('[LESSON PROGRESS] Error inserting completion:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create task completion' 
        }, { status: 500 });
      }

      result = newCompletion;
    }

    // Step 4: Return success response
    const response = {
      success: true,
      taskId,
      courseId,
      userId,
      completion: result,
      progress: {
        totalWords,
        masteredWords,
        wellPracticedWords,
        masteryPercentage,
        practicePercentage,
        isCompleted: shouldMarkCompleted
      },
      timestamp: currentTime
    };

    console.log('[LESSON PROGRESS] Success response:', {
      ...response,
      completion: `[ID: ${result.id}]`
    });
    console.log('=== LESSON PROGRESS UPDATE END (SUCCESS) ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[LESSON PROGRESS] Unexpected error:', error);
    console.error('[LESSON PROGRESS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== LESSON PROGRESS UPDATE END (ERROR) ===');

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}