import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { appEvents, TASK_COMPLETED, TASK_STARTED } from '@/lib/events';

interface ProgressData {
  totalTasks: number;
  completedCount: number;
  completedTasks: string[];
  progressPercentage: number;
}

interface TaskProgress {
  completed: boolean;
  progress: any;
}

export function useProgress(courseId?: string) {
  const { user } = useUser();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!user || !courseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user-progress?course_id=${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user?.id, courseId]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress
  };
}

export function useTaskProgress(taskId: string) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Simplified - no initial fetch since user is actively doing the lesson
  // No startTask since it's not useful for progress tracking

  const completeTask = async (courseId?: string, timeSpent?: number) => {
    if (!user || !taskId) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          courseId,
          action: 'complete',
          timeSpent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      setIsCompleted(true); // Update local state immediately
      
      // Emit event to notify other components
      appEvents.emit(TASK_COMPLETED, { taskId, courseId });
      
      return true;
    } catch (err) {
      console.error('Error completing task:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // No useEffect - no automatic API calls on mount

  return {
    loading,
    error,
    isCompleted,
    completeTask
  };
}