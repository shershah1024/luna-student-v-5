'use client';

import { useState } from 'react';
import { MatchingExercise } from '../../MatchingExercise';
import { supabase } from '@/lib/supabase';
import { Award, Lightbulb, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

interface MatchPair {
  leftIndex: number;
  rightIndex: number;
}

interface LessonMatchingExerciseProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  instructions: string;
  leftItems: string[];
  rightItems: string[];
  correctPairs: MatchPair[];
  points?: number;
  explanation?: string;
  onComplete?: (data: {
    isCorrect: boolean;
    correctPairs: number;
    totalPairs: number;
    timeTaken: number;
    pointsEarned: number;
  }) => void;
}

export default function LessonMatchingExercise({
  exerciseId,
  sectionId,
  lessonId,
  userId,
  instructions,
  leftItems,
  rightItems,
  correctPairs,
  points = 1,
  explanation,
  onComplete,
}: LessonMatchingExerciseProps) {
  const [startTime] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleComplete = async (userPairs: MatchPair[]) => {
    if (completed) return;
    
    setCompleted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    // Calculate correct pairs
    const correctCount = userPairs.filter(userPair =>
      correctPairs.some(correctPair =>
        correctPair.leftIndex === userPair.leftIndex &&
        correctPair.rightIndex === userPair.rightIndex
      )
    ).length;
    
    const totalPairs = correctPairs.length;
    const isAllCorrect = correctCount === totalPairs;
    const pointsEarned = (correctCount / totalPairs) * points;

    // Save response to database
    try {
      const { error } = await supabase
        .from('lesson_exercise_responses')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          response: { 
            user_pairs: userPairs,
            correct_pairs: correctPairs,
            correct_count: correctCount,
            total_pairs: totalPairs
          },
          is_correct: isAllCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          hint_used: false,
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
          correctPairs: correctCount,
          totalPairs,
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
        "p-4 bg-gradient-to-br from-purple-50/50 to-violet-50/30 border border-purple-200/50 flex items-center justify-between"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium text-purple-800">
            {points} {points === 1 ? 'point' : 'points'} available
          </span>
        </div>
        {!completed && (
          <span className="text-purple-600 text-sm font-medium">
            Match all pairs correctly
          </span>
        )}
      </div>

      {/* Main Matching Exercise Component */}
      <MatchingExercise
        instructions={instructions}
        leftItems={leftItems}
        rightItems={rightItems}
        correctPairs={correctPairs}
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