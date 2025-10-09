'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { usePronunciationAssignment } from '@/hooks/useTeacherAssignment';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import PronunciationFlashcard from '@/components/lessons/chatbots/PronunciationFlashcard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated page for pronunciation practice exercises
 * Handles its own data fetching and state management
 * Route: /lessons/pronunciation/[task_id]
 * 
 * Uses FastPronunciationExercise component for optimized pronunciation assessment
 * with fast processing times and modern UI/UX
 */
export default function PronunciationTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  
  // Fetch pronunciation assignment data from teacher_assignments table
  const { data: pronunciationData, isLoading, error } = usePronunciationAssignment(taskId);
  
  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);

  console.log('[PronunciationTaskPage] Component state:', {
    taskId,
    hasPronunciationData: !!pronunciationData,
    isLoading,
    error,
    exerciseType: pronunciationData?.exercise_type,
    wordsCount: pronunciationData?.words?.length || 0,
    timestamp: new Date().toISOString()
  });

  const handleExerciseComplete = async (score: number, isGood: boolean) => {
    await completeTask(courseId);
    
    console.log('[PronunciationTaskPage] Exercise completed:', {
      score,
      isGood,
      taskId
    });
  };


  // Loading state
  if (isLoading) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading pronunciation exercise...</p>
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Error state
  const renderErrorText = (e: any) => (typeof e === 'string' ? e : (e?.message || ''));
  if (error || !pronunciationData) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-red-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Exercise Not Found
            </h3>
            <p className="text-red-700 mb-6">
              {error ? renderErrorText(error) : 'The requested pronunciation exercise could not be found.'}
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="bg-red-600 hover:bg-red-700"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </ExerciseLayout>
    );
  }

  // Verify this is actually a pronunciation exercise
  if (pronunciationData.exercise_type !== 'pronunciation_practice') {
    console.warn('[PronunciationTaskPage] Exercise type mismatch:', {
      expected: 'pronunciation_practice',
      actual: pronunciationData.exercise_type,
      taskId
    });
    
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-yellow-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">
              Wrong Exercise Type
            </h3>
            <p className="text-yellow-700 mb-6">
              This exercise is not a pronunciation practice. Exercise type: {pronunciationData.exercise_type}
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Go Back
            </Button>
          </Card>
        </div>
      </ExerciseLayout>
    );
  }

  // Authentication check
  if (!user) {
    return null; // Middleware will handle redirect
  }

  // Extract words from pronunciation_tasks.content structure
  // The API returns: { content: { words: [...], theme: "...", metadata: {...} }, ... }
  const words = pronunciationData.content?.words || pronunciationData.words || [];
  const pronunciationConcept = pronunciationData.content?.theme || pronunciationData.parameters?.theme || '';

  console.log('[PronunciationTaskPage] Rendering with data:', {
    hasContent: !!pronunciationData.content,
    hasWords: !!words.length,
    wordsCount: words.length,
    concept: pronunciationConcept,
    rawData: pronunciationData
  });

  return (
    <ExerciseLayout taskId={taskId}>
      <div className="h-full overflow-auto relative">
        <PronunciationFlashcard
          taskId={taskId}
          userId={user?.id || ''}
          words={words}
          pronunciationConcept={pronunciationConcept}
          onComplete={handleExerciseComplete}
        />
      </div>
    </ExerciseLayout>
  );
}
