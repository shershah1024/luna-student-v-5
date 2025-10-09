'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TrueFalseQuestionProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  statement: string;
  correctAnswer: boolean;
  points?: number;
  explanation?: string;
  referenceText?: string;
  onComplete?: (data: {
    isCorrect: boolean;
    timeTaken: number;
    pointsEarned: number;
  }) => void;
}

export default function TrueFalseQuestion({
  exerciseId,
  sectionId,
  lessonId,
  userId,
  statement,
  correctAnswer,
  points = 1,
  explanation,
  referenceText,
  onComplete,
}: TrueFalseQuestionProps) {
  const [startTime] = useState(Date.now());
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = async (answer: boolean) => {
    if (submitted) return;
    
    setSelectedAnswer(answer);
    setSubmitted(true);
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const isCorrect = answer === correctAnswer;
    const pointsEarned = isCorrect ? points : 0;

    // Save response to database
    try {
      const { error } = await supabase
        .from('lesson_exercise_responses')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          response: { 
            selected_answer: answer,
            correct_answer: correctAnswer,
            statement: statement
          },
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          hint_used: false,
        });

      if (error) {
        console.error('Error saving response:', error);
      }

      // Show explanation
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

  const getButtonClass = (answer: boolean) => {
    if (!submitted) {
      return 'bg-white hover:bg-gray-50 border-gray-300';
    }
    
    if (selectedAnswer === answer) {
      const isCorrect = answer === correctAnswer;
      return isCorrect 
        ? 'bg-green-100 border-green-500 text-green-800'
        : 'bg-red-100 border-red-500 text-red-800';
    }
    
    if (answer === correctAnswer) {
      return 'bg-green-100 border-green-500 text-green-800';
    }
    
    return 'bg-gray-100 border-gray-300 text-gray-500';
  };

  return (
    <div className="space-y-4">
      {referenceText && (
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-700">{referenceText}</p>
        </div>
      )}

      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium mb-4">{statement}</h3>
        
        <div className="flex gap-4">
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitted}
            className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-colors ${getButtonClass(true)}`}
          >
            True
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitted}
            className={`flex-1 py-3 px-6 rounded-lg border-2 font-medium transition-colors ${getButtonClass(false)}`}
          >
            False
          </button>
        </div>

        {submitted && (
          <div className="mt-4 text-center">
            {selectedAnswer === correctAnswer ? (
              <p className="text-green-600 font-medium">✓ Correct!</p>
            ) : (
              <p className="text-red-600 font-medium">✗ Incorrect</p>
            )}
          </div>
        )}
      </div>

      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
          <p className="text-blue-800">{explanation}</p>
        </div>
      )}
    </div>
  );
}