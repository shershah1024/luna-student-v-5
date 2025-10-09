"use client"

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionRendererProps } from './QuestionRenderer';

/**
 * Renders checkbox questions where users can select multiple correct answers
 * Shows all options with checkboxes and validates partial/full correctness
 */
export default function CheckboxRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
  taskId,
  userId
}: QuestionRendererProps) {

  // Extract data - it might be nested in a data field (from database) or at root level
  const questionData = question.data || question;

  // Parse options and correct answers
  const options = questionData.options || [];
  const correctIndices = questionData.correct_indices || [];
  const correctAnswers = questionData.correct_answers || [];
  const points = questionData.points || question.points || 2; // Default to 2 for checkbox

  // Parse selected answers (should be an array of selected options)
  const selectedOptions = useMemo(() => {
    if (!selectedAnswer) return [];
    try {
      const parsed = JSON.parse(selectedAnswer);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [selectedAnswer]);

  // Toggle selection of an option
  const toggleOption = (option: string) => {
    if (showResults) return;

    const newSelected = selectedOptions.includes(option)
      ? selectedOptions.filter(opt => opt !== option)
      : [...selectedOptions, option];

    onAnswerChange(question.id, JSON.stringify(newSelected));
  };

  // Calculate score based on correct selections
  const calculateScore = () => {
    if (!showResults) return { correct: 0, incorrect: 0, missed: 0 };

    const correct = selectedOptions.filter(opt => correctAnswers.includes(opt)).length;
    const incorrect = selectedOptions.filter(opt => !correctAnswers.includes(opt)).length;
    const missed = correctAnswers.filter(opt => !selectedOptions.includes(opt)).length;

    return { correct, incorrect, missed };
  };

  const score = calculateScore();
  const isFullyCorrect = score.correct === correctAnswers.length && score.incorrect === 0;
  const isPartiallyCorrect = score.correct > 0 && score.incorrect === 0;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
      {/* Instructions */}
      <div className="text-sm text-purple-600 font-medium mb-2">
        Select all correct answers
      </div>

      {/* Options with checkboxes */}
      {options.map((option, optionIndex) => {
        const isSelected = selectedOptions.includes(option);
        const isCorrect = correctAnswers.includes(option);
        const showCorrectAnswer = showResults && isCorrect;
        const showIncorrectAnswer = showResults && isSelected && !isCorrect;
        const showMissedAnswer = showResults && !isSelected && isCorrect;

        return (
          <motion.button
            key={optionIndex}
            onClick={() => toggleOption(option)}
            disabled={showResults}
            className={cn(
              "w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-start gap-3",
              showCorrectAnswer && isSelected
                ? 'bg-green-100 border-green-400 text-green-800'
                : showIncorrectAnswer
                  ? 'bg-red-100 border-red-400 text-red-800'
                  : showMissedAnswer
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                    : isSelected
                      ? 'bg-purple-100 border-purple-400'
                      : 'bg-white border-gray-300 hover:border-purple-400',
              !showResults && 'cursor-pointer'
            )}
            whileHover={!showResults ? { scale: 1.01 } : {}}
            whileTap={!showResults ? { scale: 0.99 } : {}}
          >
            {/* Checkbox icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isSelected ? (
                <CheckSquare className={cn(
                  "h-5 w-5",
                  showCorrectAnswer ? "text-green-600" :
                  showIncorrectAnswer ? "text-red-600" :
                  "text-purple-600"
                )} />
              ) : (
                <Square className={cn(
                  "h-5 w-5",
                  showMissedAnswer ? "text-yellow-600" : "text-gray-400"
                )} />
              )}
            </div>

            {/* Option text */}
            <div className="flex-1">
              <span>{option}</span>
            </div>

            {/* Result icon */}
            {showResults && (
              <div className="flex-shrink-0">
                {isCorrect && isSelected && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {!isCorrect && isSelected && (
                  <X className="h-5 w-5 text-red-600" />
                )}
                {isCorrect && !isSelected && (
                  <span className="text-xs font-medium text-yellow-600">Missed</span>
                )}
              </div>
            )}
          </motion.button>
        );
      })}

      {/* Results summary */}
      {showResults && (
        <div className={cn(
          "mt-3 p-3 rounded-lg border",
          isFullyCorrect
            ? "bg-green-50 border-green-200 text-green-700"
            : isPartiallyCorrect
              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
              : "bg-red-50 border-red-200 text-red-700"
        )}>
          <div className="font-medium mb-1">
            {isFullyCorrect
              ? `✓ Correct! (${points} points)`
              : isPartiallyCorrect
                ? `Partially correct (${Math.floor(points * score.correct / correctAnswers.length)} of ${points} points)`
                : `Incorrect (0 points)`}
          </div>
          <div className="text-sm">
            {score.correct > 0 && `${score.correct} correct, `}
            {score.incorrect > 0 && `${score.incorrect} incorrect, `}
            {score.missed > 0 && `${score.missed} missed`}
          </div>
          {!isFullyCorrect && (
            <div className="text-sm mt-2">
              <strong>Correct answers:</strong> {correctAnswers.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}