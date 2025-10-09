'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationData {
  current: {
    lesson_title?: string;
    exercise_type: string;
    chapter_id: string;
    chapter_title: string;
  };
  previous: {
    task_id: string;
    lesson_title?: string;
    exercise_type: string;
  } | null;
  next: {
    task_id: string;
    lesson_title?: string;
    exercise_type: string;
  } | null;
  progress: {
    positionInChapter: number;
    totalInChapter: number;
    isFirstInChapter: boolean;
    isLastInChapter: boolean;
  };
}

interface SimpleLessonNavigationProps {
  courseId: string;
  taskId: string;
  isCompleted?: boolean;
  onUnitComplete?: () => void;
  variant?: 'bottom' | 'side';
}

interface CompletionData {
  [taskId: string]: {
    isCompleted: boolean;
    completedAt?: string;
    timeSpent?: number;
    score?: number;
  };
}

export default function SimpleLessonNavigation({
  courseId,
  taskId,
  isCompleted = false,
  onUnitComplete,
  variant = 'bottom'
}: SimpleLessonNavigationProps) {
  const router = useRouter();
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<CompletionData>({});
  const [navigating, setNavigating] = useState<'previous' | 'next' | null>(null);
  const lastFetchedRef = useRef<string>('');

  useEffect(() => {
    const fetchKey = `${taskId}-${courseId}`;
    
    // Only fetch if we haven't already fetched for this combination
    if (lastFetchedRef.current !== fetchKey) {
      console.log(`[SimpleLessonNavigation] New fetch needed for: ${fetchKey} (previous: ${lastFetchedRef.current})`);
      lastFetchedRef.current = fetchKey;
      fetchNavigationData();
    } else {
      console.log(`[SimpleLessonNavigation] Skipping duplicate fetch for: ${fetchKey}`);
    }
  }, [taskId, courseId]); // Add courseId to dependencies

  const fetchNavigationData = async () => {
    try {
      setLoading(true);
      console.log(`[SimpleLessonNavigation] Fetching navigation for taskId: ${taskId}, courseId: ${courseId}`);
      
      const response = await fetch(`/api/next-lesson?task_id=${taskId}&course_id=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setNavigationData(data);
        
        // Fetch completion status for prev/next lessons
        const taskIds = [];
        if (data.previous?.task_id) taskIds.push(data.previous.task_id);
        if (data.next?.task_id) taskIds.push(data.next.task_id);
        taskIds.push(taskId); // Include current task
        
        if (taskIds.length > 0) {
          // Use POST for task ID lists to avoid long URLs
          const completionsResponse = await fetch('/api/task-completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ task_ids: taskIds })
          });
          if (completionsResponse.ok) {
            const completionsData = await completionsResponse.json();
            setCompletions(completionsData);
          }
        }
      } else {
        console.error('Navigation API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch navigation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToExercise = (targetTaskId: string, exerciseType: string) => {
    // Map exercise types to lesson page URLs
    const typeMapping: { [key: string]: string } = {
      'vocabulary_learning': 'vocabulary',
      'grammar_main': 'grammar',
      'grammar_minor': 'grammar',
      'reading_basic': 'reading',
      'reading_intermediate': 'reading',
      'listening_task': 'listening',
      'writing_task': 'writing',
      'pronunciation_practice': 'pronunciation',
      'speaking_task': 'speaking',
      'chatbot_roleplay': 'chatbot',
      'unit_review': 'review'
    };

    const lessonType = typeMapping[exerciseType] || 'vocabulary';
    const newUrl = `/lessons/${lessonType}/${targetTaskId}`;
    router.push(newUrl);
  };

  const handleNext = async () => {
    if (navigating) return; // Prevent double clicks
    
    setNavigating('next');
    
    try {
      if (navigationData?.next) {
        goToExercise(navigationData.next.task_id, navigationData.next.exercise_type);
      } else if (navigationData?.progress.isLastInChapter) {
        // Last exercise in unit - mark unit as complete
        if (onUnitComplete) {
          onUnitComplete();
        }
        // Go back to lessons page
        router.push('/lessons');
      }
    } finally {
      // Reset navigation state after a delay to show loading
      setTimeout(() => setNavigating(null), 1000);
    }
  };

  const handlePrevious = async () => {
    if (navigating) return; // Prevent double clicks
    
    setNavigating('previous');
    
    try {
      if (navigationData?.previous) {
        goToExercise(navigationData.previous.task_id, navigationData.previous.exercise_type);
      }
    } finally {
      // Reset navigation state after a delay to show loading
      setTimeout(() => setNavigating(null), 1000);
    }
  };

  if (loading || !navigationData) {
    return null;
  }

  const currentCompleted = completions[taskId]?.isCompleted || isCompleted;
  const prevCompleted = navigationData?.previous ? completions[navigationData.previous.task_id]?.isCompleted : false;
  const nextCompleted = navigationData?.next ? completions[navigationData.next.task_id]?.isCompleted : false;

  if (variant === 'side') {
    return (
      <>
        {/* Left Arrow - Previous */}
        {navigationData.previous && (
          <button
            onClick={handlePrevious}
            disabled={navigating === 'previous'}
            className="fixed left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-3 lg:p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-2xl disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed backdrop-blur-sm"
            title="Previous lesson"
          >
            {navigating === 'previous' ? (
              <Loader2 className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600 animate-spin" />
            ) : (
              <ChevronLeft className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600" />
            )}
          </button>
        )}

        {/* Right Arrow - Next */}
        {(navigationData.next || navigationData.progress.isLastInChapter) && (
          <button
            onClick={handleNext}
            disabled={navigating === 'next'}
            className={`fixed right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-50 p-3 sm:p-3 lg:p-4 border-2 rounded-full shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-2xl disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed backdrop-blur-sm ${
              navigationData.progress.isLastInChapter
                ? 'bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'
            }`}
            title={navigationData.progress.isLastInChapter ? "Complete chapter" : "Next lesson"}
          >
            {navigating === 'next' ? (
              <Loader2 className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" />
            ) : navigationData.progress.isLastInChapter ? (
              <CheckCircle className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            ) : (
              <ChevronRight className="h-5 w-5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            )}
          </button>
        )}
      </>
    );
  }

  // Original bottom navigation
  return (
    <div className="flex items-center justify-between px-1 sm:px-2 py-1">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={!navigationData.previous || navigating === 'previous'}
        className="flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 p-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 font-medium text-sm active:scale-95"
      >
        {navigating === 'previous' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">Previous</span>
      </button>
      
      {/* Progress Indicator */}
      {navigationData && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium">
          <span>{navigationData.progress.positionInChapter} / {navigationData.progress.totalInChapter}</span>
        </div>
      )}

      {/* Next/Complete Button */}
      {navigationData.progress.isLastInChapter ? (
        <button
          onClick={handleNext}
          disabled={navigating === 'next'}
          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-100 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 p-2 px-3 rounded-lg bg-green-50 font-medium text-sm active:scale-95"
        >
          <span className="hidden sm:inline">Complete</span>
          {navigating === 'next' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
        </button>
      ) : (
        <button
          onClick={handleNext}
          disabled={(!navigationData.next && !navigationData.progress.isLastInChapter) || navigating === 'next'}
          className="flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 p-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 font-medium text-sm active:scale-95"
        >
          <span className="hidden sm:inline">Next</span>
          {navigating === 'next' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}