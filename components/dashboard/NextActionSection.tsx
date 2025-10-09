'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen,
  Headphones,
  PenTool,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface NextLessonData {
  lessonId: string;
  taskId?: string;
  chapterId: string;
  chapterTitle: string;
  exerciseId: string;
  exerciseTitle: string;
  exerciseType: string;
  progressInLesson: number;
  totalInLesson: number;
}


interface NextActionSectionProps {
  courseId: string;
  nextLesson?: NextLessonData | null;
  isNewUser?: boolean;
}

const getExerciseIcon = (type: string) => {
  switch (type) {
    case 'vocabulary_learning':
      return BookOpen;
    case 'listening_task':
      return Headphones;
    case 'writing_task':
      return PenTool;
    case 'speaking_task':
    case 'chatbot_roleplay':
      return MessageSquare;
    default:
      return GraduationCap;
  }
};


const NextActionSection: React.FC<NextActionSectionProps> = ({ 
  courseId, 
  nextLesson, 
  isNewUser = false
}) => {
  const router = useRouter();

  const handleStartLesson = () => {
    if (nextLesson) {
      // Use task_id if available, otherwise fall back to lessonId
      const lessonIdentifier = nextLesson.taskId || nextLesson.lessonId;
      router.push(`/lessons/${lessonIdentifier}`);
    }
  };


  if (!nextLesson) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-yellow-400" />
        <h3 className="text-sm font-medium text-gray-300">Recommended for You</h3>
      </div>
      
      {/* Next Lesson Card - Much Better Design */}
      {nextLesson && (
        <div className="relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all duration-200 group">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  {React.createElement(getExerciseIcon(nextLesson.exerciseType), {
                    className: "h-5 w-5 text-white"
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Next Lesson
                    </div>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 bg-gray-800 text-gray-300">
                      {nextLesson.exerciseType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {nextLesson.chapterTitle}
                  </h3>
                </div>
              </div>
              
              <Button 
                onClick={handleStartLesson}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-8 text-sm font-medium rounded-lg group shrink-0"
              >
                {nextLesson.progressInLesson > 0 ? 'Continue' : 'Start'}
                <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NextActionSection;