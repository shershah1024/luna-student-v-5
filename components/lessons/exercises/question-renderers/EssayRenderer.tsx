"use client"

import { useState, useEffect } from 'react';
import { PenTool, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionRendererProps } from './QuestionRenderer';

interface CategoryEvaluation {
  score: number;
  max_score: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
}

interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  parameter_evaluations?: {
    task_completion: CategoryEvaluation;
    grammar_vocabulary: CategoryEvaluation;
    organization: CategoryEvaluation;
  };
  total_score?: number;
  max_total_score?: number;
}

/**
 * Renders essay questions with a larger text area for extended responses
 * Provides AI-based evaluation with detailed feedback
 */
export default function EssayRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
  onEvaluationComplete,
}: QuestionRendererProps) {

  // Extract data - it might be nested in a data field (from database) or at root level
  const questionData = question.data || question;
  const points = questionData.points || question.points || 8; // Default to 8 for essays
  const minWords = questionData.min_words || 100;
  const maxWords = questionData.max_words || 300;
  const sampleAnswer = questionData.sample_answer || question.sample_answer || '';
  const gradingCriteria = questionData.grading_criteria || [];

  const [wordCount, setWordCount] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Count words in the answer
  useEffect(() => {
    if (selectedAnswer) {
      const count = selectedAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(count);
    } else {
      setWordCount(0);
    }
  }, [selectedAnswer]);

  // Trigger evaluation when results are shown and we have an answer
  useEffect(() => {
    if (showResults && selectedAnswer && !evaluation && !evaluating) {
      evaluateAnswer();
    }
  }, [showResults, selectedAnswer]);

  const evaluateAnswer = async () => {
    if (!selectedAnswer || evaluating || evaluation) return;

    setEvaluating(true);
    setEvaluationError(null);

    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_type: 'essay',
          question: questionData.question || question.question,
          user_answer: selectedAnswer,
          sample_answer: sampleAnswer,
          grading_criteria: gradingCriteria,
          max_points: points,
          min_words: minWords,
          max_words: maxWords,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer');
      }

      const result = await response.json();
      setEvaluation(result);
      // Notify parent component that evaluation is complete with score
      if (onEvaluationComplete) {
        const score = result.total_score || result.score || 0;
        const maxScore = result.max_total_score || points;
        onEvaluationComplete(question.id, score, maxScore);
      }
    } catch (error) {
      console.error('Error evaluating essay:', error);
      setEvaluationError('Failed to evaluate your answer. Please try again.');
      // Still notify parent even on error (with 0 score)
      if (onEvaluationComplete) {
        onEvaluationComplete(question.id, 0, points);
      }
    } finally {
      setEvaluating(false);
    }
  };

  const handleTextChange = (value: string) => {
    if (!showResults) {
      onAnswerChange(question.id, value);
    }
  };

  // Word count color based on requirements
  const getWordCountColor = () => {
    if (wordCount < minWords) return 'text-red-600';
    if (wordCount > maxWords) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <PenTool className="h-5 w-5 text-indigo-600" />
        <span className="font-medium text-gray-700">Essay Question</span>
      </div>

      {/* Question prompt */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-gray-800 font-medium">{questionData.question || question.question}</p>
        <p className="text-sm text-gray-600 mt-2">
          Write a comprehensive answer ({minWords}-{maxWords} words)
        </p>
      </div>

      {/* Text area for essay input */}
      <div className="relative">
        <textarea
          value={selectedAnswer || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={showResults}
          placeholder="Type your essay here..."
          className={cn(
            "w-full min-h-[200px] p-4 rounded-lg border transition-all",
            showResults
              ? "bg-gray-50 border-gray-300 cursor-not-allowed"
              : "bg-white border-gray-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          )}
          rows={10}
        />

        {/* Word count indicator */}
        <div className={cn(
          "absolute bottom-2 right-2 text-sm font-medium",
          getWordCountColor()
        )}>
          {wordCount} / {minWords}-{maxWords} words
        </div>
      </div>

      {/* Evaluation results */}
      {showResults && (
        <div className="space-y-4">
          {evaluating && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Evaluating your essay...</span>
            </div>
          )}

          {evaluationError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{evaluationError}</span>
            </div>
          )}

          {evaluation && (
            <div className="space-y-3">
              {/* Score */}
              <div className={cn(
                "p-4 rounded-lg border",
                evaluation.score >= points * 0.8
                  ? "bg-green-50 border-green-200"
                  : evaluation.score >= points * 0.5
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className={cn(
                    "h-5 w-5",
                    evaluation.score >= points * 0.8
                      ? "text-green-600"
                      : evaluation.score >= points * 0.5
                        ? "text-yellow-600"
                        : "text-red-600"
                  )} />
                  <span className="font-semibold text-lg">
                    Score: {evaluation.total_score || evaluation.score} / {evaluation.max_total_score || points} points
                  </span>
                </div>
                <p className="text-gray-700">{evaluation.feedback}</p>
              </div>

              {/* Detailed category evaluations if available */}
              {evaluation.parameter_evaluations && (
                <div className="space-y-2">
                  {/* Task Completion */}
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-indigo-800">Task Completion</h4>
                      <span className="text-sm font-medium text-indigo-700">
                        {evaluation.parameter_evaluations.task_completion.score} / {evaluation.parameter_evaluations.task_completion.max_score}
                      </span>
                    </div>
                    <p className="text-sm text-indigo-700 mb-2">
                      {evaluation.parameter_evaluations.task_completion.feedback}
                    </p>
                    {evaluation.parameter_evaluations.task_completion.strengths && evaluation.parameter_evaluations.task_completion.strengths.length > 0 && (
                      <div className="text-xs text-indigo-600">
                        <strong>Strengths:</strong> {evaluation.parameter_evaluations.task_completion.strengths.join(', ')}
                      </div>
                    )}
                    {evaluation.parameter_evaluations.task_completion.improvements && evaluation.parameter_evaluations.task_completion.improvements.length > 0 && (
                      <div className="text-xs text-indigo-600 mt-1">
                        <strong>Improvements:</strong> {evaluation.parameter_evaluations.task_completion.improvements.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Grammar & Vocabulary */}
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-purple-800">Grammar & Vocabulary</h4>
                      <span className="text-sm font-medium text-purple-700">
                        {evaluation.parameter_evaluations.grammar_vocabulary.score} / {evaluation.parameter_evaluations.grammar_vocabulary.max_score}
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mb-2">
                      {evaluation.parameter_evaluations.grammar_vocabulary.feedback}
                    </p>
                    {evaluation.parameter_evaluations.grammar_vocabulary.strengths && evaluation.parameter_evaluations.grammar_vocabulary.strengths.length > 0 && (
                      <div className="text-xs text-purple-600">
                        <strong>Strengths:</strong> {evaluation.parameter_evaluations.grammar_vocabulary.strengths.join(', ')}
                      </div>
                    )}
                    {evaluation.parameter_evaluations.grammar_vocabulary.improvements && evaluation.parameter_evaluations.grammar_vocabulary.improvements.length > 0 && (
                      <div className="text-xs text-purple-600 mt-1">
                        <strong>Improvements:</strong> {evaluation.parameter_evaluations.grammar_vocabulary.improvements.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Organization */}
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-teal-800">Organization</h4>
                      <span className="text-sm font-medium text-teal-700">
                        {evaluation.parameter_evaluations.organization.score} / {evaluation.parameter_evaluations.organization.max_score}
                      </span>
                    </div>
                    <p className="text-sm text-teal-700 mb-2">
                      {evaluation.parameter_evaluations.organization.feedback}
                    </p>
                    {evaluation.parameter_evaluations.organization.strengths && evaluation.parameter_evaluations.organization.strengths.length > 0 && (
                      <div className="text-xs text-teal-600">
                        <strong>Strengths:</strong> {evaluation.parameter_evaluations.organization.strengths.join(', ')}
                      </div>
                    )}
                    {evaluation.parameter_evaluations.organization.improvements && evaluation.parameter_evaluations.organization.improvements.length > 0 && (
                      <div className="text-xs text-teal-600 mt-1">
                        <strong>Improvements:</strong> {evaluation.parameter_evaluations.organization.improvements.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Overall Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Overall Strengths:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {evaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Overall Areas for improvement */}
              {evaluation.improvements && evaluation.improvements.length > 0 && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2">Overall Areas for Improvement:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {evaluation.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-orange-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample answer */}
              {sampleAnswer && (
                <details className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <summary className="font-medium text-blue-800 cursor-pointer">
                    View Sample Answer
                  </summary>
                  <div className="mt-3 text-sm text-blue-700 whitespace-pre-wrap">
                    {sampleAnswer}
                  </div>
                  {gradingCriteria.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-1">Key Points:</h5>
                      <ul className="list-disc list-inside space-y-0.5">
                        {gradingCriteria.map((criteria, idx) => (
                          <li key={idx} className="text-xs text-blue-600">{criteria}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </details>
              )}
            </div>
          )}

          {/* Show sample answer even without evaluation */}
          {!evaluation && !evaluating && sampleAnswer && (
            <details className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <summary className="font-medium text-blue-800 cursor-pointer">
                View Sample Answer
              </summary>
              <div className="mt-3 text-sm text-blue-700 whitespace-pre-wrap">
                {sampleAnswer}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}