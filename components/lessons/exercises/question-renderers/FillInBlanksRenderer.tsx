"use client"

import { cn } from '@/lib/utils';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { QuestionRendererProps } from './QuestionRenderer';
import { useState, useEffect } from 'react';

/**
 * Renders fill-in-the-blanks questions with multiple input fields
 * Handles text with multiple blanks that need to be filled
 */
export default function FillInBlanksRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
  onEvaluationComplete,
}: QuestionRendererProps) {

  // Extract data - it might be nested in a data field (from database) or at root level
  const questionData = question.data || question;
  const points = questionData.points || question.points || 1; // Default to 1 point for single blank
  const rawCorrectAnswer = question.correct_answer || questionData.correct_answer;

  // State for AI evaluation
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);

  // Parse blanks from question data or use question text with underscores
  const blanks = questionData.blanks || [];
  const questionText = questionData.question || '';

  // If we have blanks array, use it; otherwise parse from question text
  const useQuestionText = blanks.length === 0 && questionText.includes('___');

  // Count number of blanks
  const blankCount = useQuestionText
    ? (questionText.match(/___+/g) || []).length
    : blanks.length;

  // Parse selected answer (single string for the one blank)
  let userAnswer: string = '';
  try {
    // Handle both old format (array) and new format (single string)
    if (selectedAnswer) {
      const parsed = JSON.parse(selectedAnswer);
      userAnswer = Array.isArray(parsed) ? parsed[0] || '' : parsed;
    }
  } catch {
    userAnswer = selectedAnswer || '';
  }

  // Parse correct answer (single string)
  let correctAnswer: string = '';
  try {
    // Handle both old format (array) and new format (single string)
    if (rawCorrectAnswer) {
      const parsed = JSON.parse(rawCorrectAnswer);
      correctAnswer = Array.isArray(parsed) ? parsed[0] || '' : parsed;
    }
  } catch {
    correctAnswer = rawCorrectAnswer || '';
  }
  
  // Get all available options from all blanks
  const allOptions = blanks.reduce((acc, blank) => {
    if (blank.options) {
      acc.push(...blank.options);
    }
    return acc;
  }, [] as string[]);
  
  // AI evaluation function
  const evaluateWithAI = async () => {
    if (!userAnswer || !correctAnswer) return;
    
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-fill-in-blank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          answer_explanation: question.explanation || '',
          assignmentId: question.id.toString(),
          userEmail: 'user@example.com', // You might want to get this from context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsCorrect(data.is_correct);
        setHasEvaluated(true);
        // Notify parent component that evaluation is complete with score
        if (onEvaluationComplete) {
          const score = data.is_correct ? points : 0;
          onEvaluationComplete(question.id, score, points);
        }
      } else {
        // Fallback to simple comparison if API fails
        const fallbackCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        setIsCorrect(fallbackCorrect);
        setHasEvaluated(true);
        if (onEvaluationComplete) {
          const score = fallbackCorrect ? points : 0;
          onEvaluationComplete(question.id, score, points);
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Fallback to simple comparison
      const fallbackCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      setIsCorrect(fallbackCorrect);
      setHasEvaluated(true);
      // Still notify parent even on error
      if (onEvaluationComplete) {
        const score = fallbackCorrect ? points : 0;
        onEvaluationComplete(question.id, score, points);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  // Trigger evaluation when showResults changes to true
  useEffect(() => {
    if (showResults && userAnswer && !hasEvaluated) {
      evaluateWithAI();
    }
    // Reset evaluation state when showResults becomes false
    if (!showResults) {
      setHasEvaluated(false);
      setIsCorrect(null);
    }
  }, [showResults, userAnswer, hasEvaluated]);

  const handleBlankChange = (value: string) => {
    if (showResults) return;
    // Store as single string value (not array)
    onAnswerChange(question.id, value);
  };
  
  // Check if the blank answer is correct
  const isBlankCorrect = () => {
    if (!showResults) return null;
    if (isEvaluating) return null; // Still evaluating
    return isCorrect;
  };
  
  // Render text with blanks as input fields
  const renderTextWithBlanks = () => {
    // Always use the question text if it contains blanks
    if (questionText && questionText.includes('___')) {
      // Handle question text with ___ placeholders
      const parts = questionText.split(/___+/);
      
      // Split the text and place the input where the blank should be
      const beforeBlank = parts[0];
      const afterBlank = parts[1] || '';
      
      return (
        <div className="text-lg leading-normal text-gray-800 flex flex-wrap items-center gap-1">
          <span>{beforeBlank}</span>
          <span className="inline-flex items-center mx-1">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => handleBlankChange(e.target.value)}
              disabled={showResults}
              placeholder=""
              className={cn(
                "px-3 py-1.5 text-lg font-medium rounded-md transition-all duration-200 min-w-[150px] text-center",
                showResults
                  ? isBlankCorrect()
                    ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
                    : 'bg-red-50 border-2 border-red-400 text-red-700'
                  : 'bg-white border-2 border-indigo-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none'
              )}
              style={{
                borderBottom: !showResults ? '2px solid #818CF8' : undefined
              }}
            />
            {showResults && (
              <span className="ml-2">
                {isEvaluating ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                ) : isBlankCorrect() ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : isBlankCorrect() === false ? (
                  <X className="h-5 w-5 text-red-600" />
                ) : null}
              </span>
            )}
          </span>
          <span>{afterBlank}</span>
        </div>
      );
    } else if (blanks.length > 0) {
      // Only show blanks that have text with ___ placeholders
      // Do NOT show blanks that just contain the answer text
      const blanksWithPlaceholders = blanks.filter(b => b.text && b.text.includes('___'));
      
      if (blanksWithPlaceholders.length > 0) {
        return (
          <div className="space-y-4">
            {blanksWithPlaceholders.map((blank, index) => {
              const isCorrect = isBlankCorrect(index);
              
              return (
                <div key={index} className="space-y-2">
                  <p className="text-lg leading-relaxed">
                    {blank.text.split('___').map((part, partIndex, array) => (
                      <span key={partIndex}>
                        {part}
                        {partIndex < array.length - 1 && (
                          <span className="inline-block mx-2">
                            <div className="relative inline-block">
                              <input
                                type="text"
                                value={answers[index] || ''}
                                onChange={(e) => handleBlankChange(index, e.target.value)}
                                disabled={showResults}
                                placeholder=""
                                className={cn(
                                  "px-3 py-2 border-2 rounded-lg transition-all duration-200 min-w-[120px] text-center",
                                  showResults
                                    ? isCorrect
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                      : 'border-red-400 bg-red-50 text-red-700'
                                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                                )}
                              />
                              {showResults && (
                                <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                                  {isCorrect ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              );
            })}
          </div>
        );
      } else {
        // If no blanks have placeholders, just create input fields based on the number of blanks
        return (
          <div className="space-y-3">
            {blanks.map((_, index) => {
              const isCorrect = isBlankCorrect(index);
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-base text-gray-600">Blank {index + 1}:</span>
                  <div className="relative inline-block">
                    <input
                      type="text"
                      value={answers[index] || ''}
                      onChange={(e) => handleBlankChange(index, e.target.value)}
                      disabled={showResults}
                      placeholder=""
                      className={cn(
                        "px-3 py-2 border-2 rounded-lg transition-all duration-200 min-w-[150px] text-center",
                        showResults
                          ? isCorrect
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
                      )}
                    />
                    {showResults && (
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className="space-y-2">
      
      {/* Render the text with blanks - minimal padding */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        {renderTextWithBlanks()}
      </div>
      
      {/* Options (if provided) */}
      {allOptions.length > 0 && (
        <div className="mt-4">
          <p className="text-base text-gray-600 mb-3">Choose from:</p>
          <div className="flex flex-wrap gap-2">
            {allOptions.map((option, optionIndex) => (
              <button
                key={optionIndex}
                onClick={() => {
                  // Fill the single blank with this option
                  handleBlankChange(option);
                }}
                disabled={showResults}
                className={cn(
                  "px-4 py-2 rounded-lg border text-base font-medium transition-colors",
                  userAnswer === option
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Evaluation status message */}
      {showResults && isEvaluating && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-700">Using AI to evaluate your answer...</p>
        </div>
      )}
      
      {/* Results summary - only show if incorrect */}
      {showResults && !isEvaluating && isBlankCorrect() === false && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 text-lg">💡</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium mb-1">Correct answer:</p>
              <p className="text-lg font-semibold text-amber-900">{correctAnswer}</p>
              {userAnswer && (
                <p className="text-sm text-amber-700 mt-1">
                  You answered: <span className="font-medium">{userAnswer}</span>
                </p>
              )}
              <p className="text-xs text-amber-600 mt-2 italic">
                AI evaluated your answer for meaning and context
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success message when correct */}
      {showResults && !isEvaluating && isBlankCorrect() === true && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <p className="text-sm text-emerald-700">
            Correct! {userAnswer !== correctAnswer && `(You wrote: "${userAnswer}", Expected: "${correctAnswer}")`}
          </p>
        </div>
      )}
    </div>
  );
}