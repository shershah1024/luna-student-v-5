'use client';

import { useState, useEffect } from 'react';
import { MultipleChoice } from '../../MultipleChoice';
import { supabase } from '@/lib/supabase';
import { Clock, Lightbulb, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

interface LessonMultipleChoiceProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  points?: number;
  timeLimit?: number;
  hints?: string[];
  explanation?: string;
  onComplete?: (data: {
    isCorrect: boolean;
    timeTaken: number;
    pointsEarned: number;
  }) => void;
}

export default function LessonMultipleChoice({
  exerciseId,
  sectionId,
  lessonId,
  userId,
  question,
  options,
  correctIndex,
  correctAnswer,
  points = 1,
  timeLimit,
  hints,
  explanation,
  onComplete,
}: LessonMultipleChoiceProps) {
  const [startTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleAnswer = async (answer: string, isCorrect: boolean) => {
    if (answered) return;
    
    setAnswered(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const pointsEarned = isCorrect ? points : 0;

    // Save response to database
    try {
      const { error } = await supabase
        .from('lesson_exercise_responses')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          response: { selected_option: answer, selected_index: options.indexOf(answer) },
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          hint_used: false, // TODO: Implement hint tracking
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
          isCorrect,
          timeTaken,
          pointsEarned,
        });
      }
    } catch (error) {
      console.error('Error saving exercise response:', error);
    }
  };

  // Implement time limit if specified
  useEffect(() => {
    if (timeLimit && !answered) {
      const timer = setTimeout(() => {
        handleAnswer('', false); // Time's up, mark as incorrect
      }, timeLimit * 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLimit, answered]);

  return (
    <div className="space-y-6">
      {/* Premium Time Limit Indicator */}
      {timeLimit && !answered && (
        <div className={cn(
          utilityClasses.premiumCard,
          "p-4 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-200/50"
        )}>
          <div className="flex items-center gap-3 justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-amber-800">
              Time limit: {timeLimit} seconds
            </span>
          </div>
        </div>
      )}
      
      {/* Premium Hints Section */}
      {hints && hints.length > 0 && !answered && (
        <details className={cn(
          utilityClasses.premiumCard,
          "p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/50"
        )}>
          <summary className="cursor-pointer text-lg font-medium text-blue-800 hover:text-blue-900 transition-colors duration-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
            Need a hint? Click to reveal
          </summary>
          <div className="mt-6 space-y-3 pt-4 border-t border-blue-200/50">
            {hints.map((hint, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-blue-700 leading-relaxed">
                  {hint}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
      
      {/* Main Multiple Choice Component */}
      <MultipleChoice
        question={question}
        options={options}
        correctIndex={correctIndex}
        correctAnswer={correctAnswer}
        id={exerciseId}
        onAnswer={handleAnswer}
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