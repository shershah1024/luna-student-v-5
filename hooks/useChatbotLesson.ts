import { useQuery } from '@tanstack/react-query';

/**
 * Custom hook for fetching chatbot lesson data
 * Uses the dedicated /api/lessons/chatbot/[task_id] endpoint
 */

interface ChatbotLessonData {
  task_id: string;
  exercise_type: string;
  course_name: string;
  chapter_id: string;
  chapter_title: string;
  chapter_theme: string;
  lesson_name: string;
  exercise_objective: string;
  chatbot_instructions?: string | null;
  topic?: string;
  language: string;
  difficulty_level: string;
  assignment_type?: string;
  status: string;
  created_at?: string;
  source: 'teacher_assignment' | 'course_data' | 'legacy_chatbots';
  next_lesson_task_id?: string;
  previous_lesson_task_id?: string;
}

// Fetch chatbot lesson data from dedicated endpoint
const fetchChatbotLesson = async (taskId: string): Promise<ChatbotLessonData> => {
  const response = await fetch(`/api/lessons/chatbot/${taskId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to fetch chatbot lesson data');
  }
  
  return response.json();
};

export function useChatbotLesson(taskId: string) {
  const query = useQuery({
    queryKey: ['chatbot-lesson', taskId],
    queryFn: () => fetchChatbotLesson(taskId),
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    enabled: !!taskId, // Only fetch if taskId is provided
    retry: 2, // Retry failed requests twice
  });

  return {
    lessonData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}