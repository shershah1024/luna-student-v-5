'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import ListeningExerciseComponent from '@/components/lessons/exercises/ListeningExerciseComponent';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Dedicated page for listening exercises
 * Handles its own data fetching and state management
 * Route: /lessons/listening/[task_id]
 */
export default function ListeningTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  
  // Fetch listening exercise data using dedicated API
  const fetchListeningExercise = async (taskId: string) => {
    const response = await fetch(`/api/fetch-listening-exercise/${taskId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch listening exercise: ${response.status} ${errorText}`);
    }
    return response.json();
  };

  const { data: exerciseData, isLoading, error } = useQuery({
    queryKey: ['listening-exercise', taskId],
    queryFn: () => fetchListeningExercise(taskId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!taskId,
  });

  const isListeningQuiz = exerciseData?.assignment_type === 'listening_quiz';
  const isAudioDialogue = exerciseData?.assignment_type === 'audio-dialogue';
  
  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);

  console.log('[ListeningTaskPage] Component state:', {
    taskId,
    hasExerciseData: !!exerciseData,
    isLoading,
    error,
    exerciseType: exerciseData?.exercise_type,
    timestamp: new Date().toISOString()
  });

  const handleExerciseComplete = async () => {
    await completeTask(courseId);
  };

  // Loading state
  if (isLoading) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading listening exercise...</p>
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Error state
  const renderErrorText = (e: any) => (typeof e === 'string' ? e : (e?.message || ''));
  if (error || !exerciseData) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-red-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Exercise Not Found
            </h3>
            <p className="text-red-700">
              {error ? renderErrorText(error) : 'The requested listening exercise could not be found.'}
            </p>
          </Card>
        </div>
      </ExerciseLayout>
    );
  }

  // Verify type only for non-assignment path
  // No type guard needed; component fetches by taskId when not an assignment

  // Authentication check
  if (!user) {
    return null; // Middleware will handle redirect
  }

  return (
    <ExerciseLayout taskId={taskId}>
      <div className="h-full overflow-auto relative">
        <ListeningExerciseComponent
          taskId={taskId}
          userId={user.id}
          onComplete={handleExerciseComplete}
          initialData={{
            audio_url: exerciseData?.audio_url,
            transcript: exerciseData?.transcript || exerciseData?.full_transcript,
            audio_title: exerciseData?.title,
            questions: exerciseData?.questionsData || [],
            total_points: exerciseData?.total_points
          }}
        />
      </div>
    </ExerciseLayout>
  );
}
