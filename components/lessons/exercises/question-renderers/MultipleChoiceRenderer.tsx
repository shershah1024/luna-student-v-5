"use client"

import { motion } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionRendererProps } from './QuestionRenderer';

/**
 * Renders multiple choice questions with options a, b, c, d...
 * Handles selection, feedback, and visual states
 */
export default function MultipleChoiceRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
  taskId,
  userId
}: QuestionRendererProps) {

  // Extract data - it might be nested in a data field (from database) or at root level
  const questionData = question.data || question;

  // Parse options and correct answer
  const options = questionData.options || [];
  const correctAnswer = question.correct_answer || questionData.correct_answer;
  const points = 1; // Multiple choice is always 1 point (enforced by API)
  
  return (
    <div className="space-y-3">
      {options.map((option, optionIndex) => {
        const optionLetter = String.fromCharCode(97 + optionIndex); // a, b, c, d
        const isSelected = selectedAnswer === option;
        const isCorrect = correctAnswer === option;
        const showCorrectAnswer = showResults && isCorrect;
        const showIncorrectAnswer = showResults && isSelected && !isCorrect;
        
        return (
          <motion.button
            key={optionIndex}
            onClick={() => onAnswerChange(question.id, option)}
            disabled={showResults}
            className={cn(
              "w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center gap-3",
              showCorrectAnswer
                ? 'bg-green-100 border-green-400 text-green-800'
                : showIncorrectAnswer
                ? 'bg-red-100 border-red-400 text-red-800'
                : isSelected
                ? 'bg-blue-100 border-blue-400 text-blue-800'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
            )}
            whileHover={!showResults ? { scale: 1.02 } : {}}
            whileTap={!showResults ? { scale: 0.98 } : {}}
          >
            {/* Option letter indicator */}
            <div className={cn(
              "w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-base",
              showCorrectAnswer
                ? 'bg-green-100 border-green-400 text-green-600'
                : showIncorrectAnswer
                ? 'bg-red-100 border-red-400 text-red-600'
                : isSelected
                ? 'bg-blue-100 border-blue-400 text-blue-600'
                : 'bg-gray-100 border-gray-300 text-gray-600'
            )}>
              {optionLetter}
            </div>
            
            {/* Option text */}
            <div className="flex-1 text-base">
              {option}
            </div>
            
            {/* Result indicators */}
            {showResults && isCorrect && (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}
            {showResults && isSelected && !isCorrect && (
              <X className="h-5 w-5 text-red-600" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}