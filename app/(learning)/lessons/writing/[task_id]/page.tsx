'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useTeacherAssignment } from '@/hooks/useTeacherAssignment';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import LessonWriting from '@/components/lessons/LessonWriting';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated page for writing exercises
 * Handles its own data fetching and state management
 * Route: /lessons/writing/[task_id]
 */
export default function WritingTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  
  // Fetch writing assignment data from teacher_assignments table
  const { data: writingData, isLoading, error } = useTeacherAssignment(taskId);
  // For backward compatibility, map writingData to exerciseData structure
  const exerciseData = writingData;
  
  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);

  console.log('[WritingTaskPage] Component state:', {
    taskId,
    hasExerciseData: !!exerciseData,
    hasWritingData: !!writingData,
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
            <p className="text-gray-600">Loading writing exercise...</p>
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
            <p className="text-red-700 mb-6">
              {error ? renderErrorText(error) : 'The requested writing exercise could not be found.'}
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

  // Verify this is actually a writing exercise
  if (exerciseData.exercise_type !== 'writing_task') {
    console.warn('[WritingTaskPage] Exercise type mismatch:', {
      expected: 'writing_task',
      actual: exerciseData.exercise_type,
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
              This exercise is not a writing task. Exercise type: {exerciseData.exercise_type}
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

  return (
    <ExerciseLayout taskId={taskId}>
      <div className="h-full overflow-auto relative">
        <LessonWriting
          taskId={taskId}
          userId={user.id}
          exerciseData={exerciseData}
          writingData={writingData}
          onComplete={handleExerciseComplete}
        />
      </div>
    </ExerciseLayout>
  );
}
