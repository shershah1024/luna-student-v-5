'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useTeacherAssignment } from '@/hooks/useTeacherAssignment';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import { RoleplayChat } from '@/components/RoleplayChat';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated page for storytelling assignments
 * Uses RoleplayChat component for AI storytelling partner functionality
 * Handles its own data fetching and state management
 * Route: /lessons/storytelling/[task_id]
 */
export default function StorytellingTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  
  // Fetch storytelling assignment data from teacher_assignments table
  const { data: exerciseData, isLoading, error } = useTeacherAssignment(taskId);
  
  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);

  console.log('[StorytellingTaskPage] Component state:', {
    taskId,
    hasExerciseData: !!exerciseData,
    isLoading,
    error,
    exerciseType: exerciseData?.exercise_type,
    storyTheme: exerciseData?.story_theme,
    timestamp: new Date().toISOString()
  });

  const handleLessonComplete = async () => {
    await completeTask(courseId);
  };


  // Loading state
  if (isLoading) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading storytelling assignment...</p>
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
              Storytelling Assignment Not Found
            </h3>
            <p className="text-red-700 mb-6">
              {error ? renderErrorText(error) : 'The requested storytelling assignment could not be found.'}
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

  // Verify this is actually a storytelling assignment
  if (exerciseData.assignment_type !== 'storytelling') {
    console.warn('[StorytellingTaskPage] Assignment type mismatch:', {
      expected: 'storytelling',
      actual: exerciseData.assignment_type,
      taskId
    });
    
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-yellow-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">
              Wrong Assignment Type
            </h3>
            <p className="text-yellow-700 mb-6">
              This assignment is not for storytelling. Assignment type: {exerciseData.assignment_type}
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
        {/* Storytelling Instructions Panel */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <Card className="p-4 bg-white/95 backdrop-blur-sm border-purple-200">
            <div className="text-sm space-y-1">
              {exerciseData.story_theme && (
                <div><span className="font-semibold">Theme:</span> {exerciseData.story_theme}</div>
              )}
              {exerciseData.genre && (
                <div><span className="font-semibold">Genre:</span> {exerciseData.genre}</div>
              )}
              <div><span className="font-semibold">Language Focus:</span> {exerciseData.language_focus}</div>
              <div><span className="font-semibold">Level:</span> {exerciseData.difficulty_level}</div>
            </div>
          </Card>
        </div>

        <RoleplayChat
          taskId={taskId}
          userId={user.id}
          exerciseData={exerciseData}
          onLessonComplete={handleLessonComplete}
          className="h-full pt-24" // Add padding for instructions panel
        />
      </div>
    </ExerciseLayout>
  );
}
