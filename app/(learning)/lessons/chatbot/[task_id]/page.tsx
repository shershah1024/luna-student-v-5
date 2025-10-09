'use client';

import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useChatbotLesson } from '@/hooks/useChatbotLesson';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import { RoleplayChat } from '@/components/RoleplayChat';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dedicated page for chatbot roleplay exercises
 * Uses RoleplayChat component for German conversation practice
 * Handles its own data fetching and state management
 * Route: /lessons/chatbot/[task_id]
 */
export default function ChatbotRoleplayTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  
  // Fetch chatbot lesson data using dedicated hook
  const { lessonData, isLoading, error } = useChatbotLesson(taskId);

  console.log('[ChatbotRoleplayTaskPage] Component state:', {
    taskId,
    hasLessonData: !!lessonData,
    isLoading,
    error,
    exerciseType: lessonData?.exercise_type,
    timestamp: new Date().toISOString()
  });


  // Loading state
  if (isLoading) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading roleplay lesson...</p>
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Error state
  if (error || !lessonData) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-red-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Lesson Not Found
            </h3>
            <p className="text-red-700 mb-6">
              {error?.message || error?.toString() || 'The requested roleplay lesson could not be found.'}
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


  // Authentication check
  if (!user) {
    return null; // Middleware will handle redirect
  }


  return (
    <ExerciseLayout taskId={taskId}>
      <div className="h-full overflow-auto relative">
        <RoleplayChat
          taskId={taskId}
          userId={user.id}
          exerciseData={lessonData}
        />
      </div>
    </ExerciseLayout>
  );
}
