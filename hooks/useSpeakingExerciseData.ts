'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Hook to fetch speaking exercise data from speaking_tasks table
 * Fetches both the task metadata and speaking-specific content
 * Also attempts to fetch from lesson_speaking_instructions if available
 */
export function useSpeakingExerciseData(taskId: string | undefined) {
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) {
      setIsLoading(false);
      return;
    }

    async function fetchExerciseData() {
      try {
        // Initialize Supabase client with anon key
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('[useSpeakingExerciseData] Fetching for task_id:', taskId);

        // Fetch speaking task data with parent task info
        const { data: speakingTask, error: speakingError } = await supabase
          .from('speaking_tasks')
          .select(`
            *,
            task:tasks(*)
          `)
          .eq('task_id', taskId)
          .single();

        if (speakingError) {
          console.error('[useSpeakingExerciseData] Error fetching speaking task:', speakingError);
          setError(speakingError.message);
          setIsLoading(false);
          return;
        }

        console.log('[useSpeakingExerciseData] Speaking task data:', speakingTask);

        // Try to fetch from lesson_speaking_instructions (legacy table)
        const { data: instructions } = await supabase
          .from('lesson_speaking_instructions')
          .select('*')
          .eq('task_id', taskId)
          .single();

        console.log('[useSpeakingExerciseData] Instructions data:', instructions);

        // Extract content and settings from JSONB fields
        const content = speakingTask?.content || {};
        const settings = speakingTask?.settings || {};
        const task = speakingTask?.task || {};

        // Transform the data - prioritize lesson_speaking_instructions if available
        const transformedData = {
          task_id: taskId,
          // Bot instruction for LiveKit (from content.instructions or legacy table)
          bot_instruction: content.instructions || instructions?.bot_instruction || '',
          // UI display fields (prioritize legacy table, fallback to content)
          user_instruction: instructions?.user_instruction || content.user_instruction || '',
          lesson_title: instructions?.lesson_title || content.lesson_title || task.title || '',
          topic: instructions?.topic || content.topic || task.parameters?.topic || '',
          level: instructions?.level || task.level || task.parameters?.difficulty_level || '',
          tips: instructions?.tips || content.tips || []
        };

        console.log('[useSpeakingExerciseData] Transformed data:', transformedData);

        setExerciseData(transformedData);
        setIsLoading(false);
      } catch (err) {
        console.error('[useSpeakingExerciseData] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }

    fetchExerciseData();
  }, [taskId]);

  return { exerciseData, isLoading, error };
}