"use client"

import { useState, useEffect } from 'react';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionRendererProps } from './QuestionRenderer';

interface EvaluationResult {
  is_correct: boolean;
  feedback: string;
  score: number;
}

/**
 * Renders short answer questions with text input field
 * Provides intelligent AI-based evaluation and feedback after submission
 */
export default function ShortAnswerRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
}: QuestionRendererProps) {

  // Extract data - it might be nested in a data field (from database) or at root level
  const questionData = question.data || question;
  const points = questionData.points || question.points || 2; // Default to 2 for short answer
  const correctAnswer = question.correct_answer || questionData.correct_answer;

  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  
  // Trigger evaluation when results are shown and we have an answer
  useEffect(() => {
    if (showResults && selectedAnswer && !evaluation && !evaluating) {
      evaluateAnswer();
    }
  }, [showResults, selectedAnswer]);
  
  const evaluateAnswer = async () => {
    if (!selectedAnswer) return;
    
    setEvaluating(true);
    setEvaluationError(null);
    
    try {
      const response = await fetch('/api/evaluate-short-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_answer: selectedAnswer,
          correct_answer: correctAnswer,
          question: question.question,
          context: question.sample_answer,
          assignmentId: 'listening-exercise', // Could be passed as prop
          userEmail: 'student@example.com' // Could be passed as prop
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to evaluate answer');
      }
      
      const result = await response.json();
      setEvaluation(result);
    } catch (error) {
      console.error('Error evaluating short answer:', error);
      setEvaluationError('Unable to evaluate answer. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };
  
  return (
    <div className="space-y-3">
      
      {/* Text input field */}
      <div className="relative">
        <input
          type="text"
          value={selectedAnswer || ''}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
          disabled={showResults}
          placeholder="Type your answer here..."
          className={cn(
            "w-full p-4 rounded-xl border-2 transition-all duration-300",
            showResults
              ? evaluation?.is_correct
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : evaluation
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-gray-50 border-gray-300 text-gray-700'
              : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
          )}
        />
        
        {/* Evaluation indicator */}
        {showResults && selectedAnswer && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {evaluating ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : evaluation ? (
              evaluation.is_correct ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <X className="h-5 w-5 text-red-600" />
              )
            ) : null}
          </div>
        )}
      </div>
      
      {/* AI Evaluation Results */}
      {showResults && selectedAnswer && (
        <div className="space-y-3">
          {/* Evaluation Status */}
          {evaluating && (
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating your answer...</span>
              </div>
            </div>
          )}
          
          {/* Evaluation Error */}
          {evaluationError && (
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
              <div className="text-sm text-red-700">
                <strong>Evaluation Error:</strong> {evaluationError}
              </div>
              <button
                onClick={evaluateAnswer}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}
          
          {/* Evaluation Results */}
          {evaluation && (
            <div className={cn(
              "p-4 rounded-xl border-2",
              evaluation.is_correct
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            )}>
              <div className="space-y-2">
                {/* Score and Status */}
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "text-sm font-medium",
                    evaluation.is_correct ? "text-emerald-700" : "text-red-700"
                  )}>
                    {evaluation.is_correct ? "Correct!" : "Needs Improvement"}
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    evaluation.score >= 0.8
                      ? "bg-emerald-100 text-emerald-700"
                      : evaluation.score >= 0.5
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  )}>
                    Score: {Math.round(evaluation.score * 100)}%
                  </div>
                </div>
                
                {/* AI Feedback */}
                <div className={cn(
                  "text-sm",
                  evaluation.is_correct ? "text-emerald-600" : "text-red-600"
                )}>
                  <strong>Feedback:</strong> {evaluation.feedback}
                </div>
                
                {/* Sample Answer */}
                <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                  <strong>Expected Answer:</strong> {correctAnswer}
                </div>
              </div>
            </div>
          )}
          
          {/* Fallback: Basic Sample Answer (if evaluation fails) */}
          {!evaluation && !evaluating && !evaluationError && (
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <div className="text-sm text-blue-700">
                <strong>Sample Answer:</strong> {correctAnswer}
              </div>
              {questionData.sample_answer && questionData.sample_answer !== correctAnswer && (
                <div className="text-sm text-blue-600 mt-2">
                  <strong>Additional Info:</strong> {question.sample_answer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}