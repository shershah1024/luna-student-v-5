/**
 * Centralized Task Completion Service
 * 
 * This service provides a unified way to track task completion across all lesson types.
 * It handles creating/updating task_completions records consistently for:
 * - Reading tasks
 * - Listening tasks  
 * - Writing tasks
 * - Speaking tasks
 * - Pronunciation tasks
 * - Vocabulary tasks
 * - Chatbot/Roleplay tasks
 * - Quiz/Review tasks
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Task completion thresholds by task type
// All tasks now mark as complete regardless of score - any attempt counts as completion
const COMPLETION_THRESHOLDS = {
  reading: 0,       // Any completion counts
  listening: 0,     // Any completion counts
  writing: 0,       // Any completion counts
  speaking: 0,      // Any completion counts
  pronunciation: 0, // Any completion counts
  vocabulary: 0,    // Any completion counts
  chatbot: 0,       // Any completion counts
  roleplay: 0,      // Any completion counts
  quiz: 0,          // Any completion counts
  review: 0,        // Any completion counts
  default: 0        // Any completion counts
};

// Course ID constant
const COURSE_ID = 'telc_a2';

// Get task type from task ID
export function getTaskTypeFromTaskId(taskId: string): string {
  // Task ID usually ends with the task type
  const parts = taskId.split('_');
  const lastPart = parts[parts.length - 1];
  
  // Common task type patterns
  const taskTypes = ['reading', 'listening', 'writing', 'speaking', 'pronunciation', 
                     'vocabulary', 'chatbot', 'roleplay', 'quiz', 'review'];
  
  for (const type of taskTypes) {
    if (lastPart.includes(type) || taskId.includes(type)) {
      return type;
    }
  }
  
  return 'default';
}

// Interface for task completion data
export interface TaskCompletionData {
  userId: string;
  taskId: string;
  attempt_id?: number;        // Specific attempt number
  metadata?: any;            // Additional data specific to task type
  forceComplete?: boolean;   // Force mark as complete
}

/**
 * Update or create task completion record
 * 
 * @param data - Task completion data
 * @returns Success status and completion record
 */
export async function updateTaskCompletion(data: TaskCompletionData) {
  const { userId, taskId, attempt_id, metadata, forceComplete } = data;
  
  try {
    // Get task type
    const taskType = getTaskTypeFromTaskId(taskId);
    
    // Determine if task should be marked as complete
    // Now any attempt marks the task as complete (threshold is 0 for all tasks)
    const threshold = COMPLETION_THRESHOLDS[taskType as keyof typeof COMPLETION_THRESHOLDS] || COMPLETION_THRESHOLDS.default;
    const isComplete = forceComplete || true; // Always mark as complete on any attempt
    
    // Check if task completion already exists
    const { data: existingCompletion, error: fetchError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = Row not found, which is expected for new completions
      console.error('[TaskCompletionService] Error fetching existing completion:', fetchError);
      throw fetchError;
    }
    
    const currentTime = new Date().toISOString();
    
    if (existingCompletion) {
      // Update existing completion
      const shouldUpdate = 
        !existingCompletion.completed_at || // Not yet marked complete
        forceComplete; // Force update
      
      if (shouldUpdate) {
        const updateData: any = {
          updated_at: currentTime
        };
        
        // Always mark as complete on any attempt (no score threshold required)
        if (!existingCompletion.completed_at) {
          updateData.completed_at = currentTime;
        }
        
        // Increment attempts and set attempt_id
        updateData.attempts = (existingCompletion.attempts || 0) + 1;
        updateData.attempt_id = attempt_id || updateData.attempts;
        
        const { data: updatedCompletion, error: updateError } = await supabase
          .from('task_completions')
          .update(updateData)
          .eq('id', existingCompletion.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('[TaskCompletionService] Error updating completion:', updateError);
          throw updateError;
        }
        
        console.log('[TaskCompletionService] Updated task completion:', {
          taskId,
          userId,
          completed: !!updatedCompletion.completed_at
        });
        
        return {
          success: true,
          completion: updatedCompletion,
          wasCompleted: !!existingCompletion.completed_at,
          isNowCompleted: !!updatedCompletion.completed_at
        };
      } else {
        // No update needed
        console.log('[TaskCompletionService] No update needed for task:', taskId);
        return {
          success: true,
          completion: existingCompletion,
          wasCompleted: !!existingCompletion.completed_at,
          isNowCompleted: !!existingCompletion.completed_at
        };
      }
    } else {
      // Create new task completion
      const completionData: any = {
        user_id: userId,
        task_id: taskId,
        course_id: COURSE_ID,
        attempts: 1,
        attempt_id: attempt_id || 1,
        created_at: currentTime,
        updated_at: currentTime
      };
      
      // Always mark as complete on first attempt (no score threshold required)
      completionData.completed_at = currentTime;
      
      const { data: newCompletion, error: insertError } = await supabase
        .from('task_completions')
        .insert(completionData)
        .select()
        .single();
      
      if (insertError) {
        console.error('[TaskCompletionService] Error creating completion:', insertError);
        throw insertError;
      }
      
      console.log('[TaskCompletionService] Created task completion:', {
        taskId,
        userId,
        completed: !!newCompletion.completed_at
      });
      
      return {
        success: true,
        completion: newCompletion,
        wasCompleted: false,
        isNowCompleted: !!newCompletion.completed_at
      };
    }
  } catch (error) {
    console.error('[TaskCompletionService] Error in updateTaskCompletion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark a task as complete regardless of score
 * Useful for tasks without scoring like chatbot interactions
 */
export async function markTaskComplete(userId: string, taskId: string) {
  return updateTaskCompletion({
    userId,
    taskId,
    forceComplete: true
  });
}

/**
 * Get task completion status for a user and task
 */
export async function getTaskCompletion(userId: string, taskId: string) {
  try {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('[TaskCompletionService] Error fetching completion:', error);
      throw error;
    }
    
    return {
      success: true,
      completion: data,
      isCompleted: data ? !!data.completed_at : false
    };
  } catch (error) {
    console.error('[TaskCompletionService] Error in getTaskCompletion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isCompleted: false
    };
  }
}

/**
 * Get all task completions for a user in the course
 */
export async function getCourseCompletions(userId: string) {
  try {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', COURSE_ID)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('[TaskCompletionService] Error fetching course completions:', error);
      throw error;
    }
    
    // Convert to map for easier lookup
    const completionMap = (data || []).reduce((acc: any, item: any) => {
      acc[item.task_id] = {
        isCompleted: !!item.completed_at,
        completedAt: item.completed_at,
        attempts: item.attempts
      };
      return acc;
    }, {});
    
    return {
      success: true,
      completions: completionMap,
      totalCompleted: data?.filter(item => item.completed_at).length || 0
    };
  } catch (error) {
    console.error('[TaskCompletionService] Error in getCourseCompletions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      completions: {}
    };
  }
}