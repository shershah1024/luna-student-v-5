'use client';

import { useState } from 'react';
import { FillInBlanks } from '../../FillInBlanks';
import { supabase } from '@/lib/supabase';
import { Award, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

interface LessonFillInBlanksProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  text: string;
  answers: string[];
  hints?: string[];
  points?: number;
  explanation?: string;
  onComplete?: (data: {
    isCorrect: boolean;
    correctCount: number;
    totalBlanks: number;
    timeTaken: number;
    pointsEarned: number;
  }) => void;
}

export default function LessonFillInBlanks({
  exerciseId,
  sectionId,
  lessonId,
  userId,
  text,
  answers,
  hints = [],
  points = 1,
  explanation,
  onComplete,
}: LessonFillInBlanksProps) {
  const [startTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = async (userAnswers: string[], isAllCorrect: boolean) => {
    if (completed) return;
    
    setCompleted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Calculate correct answers
    const correctCount = userAnswers.filter((answer, index) => 
      answer.toLowerCase().trim() === answers[index].toLowerCase().trim()
    ).length;
    
    const totalBlanks = answers.length;
    const pointsEarned = (correctCount / totalBlanks) * points;

    // Save response to database
    try {
      const { error } = await supabase
        .from('lesson_exercise_responses')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          response: { 
            user_answers: userAnswers,
            correct_answers: answers,
            correct_count: correctCount,
            total_blanks: totalBlanks
          },
          is_correct: isAllCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          hint_used: false, // TODO: Track if hints were used
        });

      if (error) {
        console.error('Error saving response:', error);
      }

      // Show explanation if available
      if (explanation) {
        setShowExplanation(true);
      }

      // Notify parent component
      if (onComplete) {
        onComplete({
          isCorrect: isAllCorrect,
          correctCount,
          totalBlanks,
          timeTaken,
          pointsEarned,
        });
      }
    } catch (error) {
      console.error('Error saving exercise response:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Points & Instructions Header */}
      <div className={cn(
        utilityClasses.premiumCard,
        "p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/50 flex items-center justify-between"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Award className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium text-blue-800">
            {points} {points === 1 ? 'point' : 'points'} available
          </span>
        </div>
        {!completed && (
          <span className="text-blue-600 text-sm font-medium">
            Fill in all blanks to complete
          </span>
        )}
      </div>

      {/* Main Fill in Blanks Component */}
      <FillInBlanks
        text={text}
        answers={answers}
        hints={hints}
        id={exerciseId}
        onComplete={handleComplete}
      />

      {/* Premium Explanation Section */}
      {showExplanation && explanation && (
        <div className={cn(
          utilityClasses.premiumCard,
          "p-6 bg-gradient-to-br from-emerald-50/50 to-green-50/30 border border-emerald-200/50"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-emerald-800">Explanation</h4>
          </div>
          <p className="text-emerald-700 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}