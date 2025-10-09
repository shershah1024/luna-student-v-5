'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import { VocabularyTutor } from '@/components/VocabularyTutor';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated page for vocabulary exercises
 * Handles its own data fetching and state management
 * Route: /lessons/vocabulary/[task_id]
 */
export default function VocabularyTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  
  // Optional metadata not required; the tutor initializes vocabulary by taskId
  const exerciseData = undefined as any;
  const isLoading = false;
  const error = undefined as any;
  
  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);


  const handleExerciseComplete = async () => {
    await completeTask(courseId);
  };

  // Loading state
  if (isLoading) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading vocabulary exercise...</p>
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
              {error ? renderErrorText(error) : 'The requested vocabulary exercise could not be found.'}
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

  // Verify this is actually a vocabulary exercise
  const validVocabularyTypes = ['vocabulary_learning', 'vocabulary'];
  if (!validVocabularyTypes.some(type => exerciseData.exercise_type.includes(type))) {
    
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-yellow-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">
              Wrong Exercise Type
            </h3>
            <p className="text-yellow-700 mb-6">
              This exercise is not a vocabulary task. Exercise type: {exerciseData.exercise_type}
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
        <VocabularyTutor 
          taskId={taskId} 
          userId={user.id}
          exerciseData={exerciseData}
          onLessonComplete={handleExerciseComplete}
        />
      </div>
    </ExerciseLayout>
  );
}
