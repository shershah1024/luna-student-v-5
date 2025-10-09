'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import GrammarQuestionRenderer from '@/components/lessons/exercises/question-renderers/GrammarQuestionRenderer';
import { Loader2, AlertCircle, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Dedicated page for grammar exercises
 * Handles data fetching and state management for grammar quizzes
 * Route: /lessons/grammar/[task_id]
 */
export default function GrammarTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now, can be made dynamic later

  // Navigation completion state
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(false);

  // State for QuestionRenderer approach
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showQuestionResults, setShowQuestionResults] = useState(false);

  // Fetch grammar exercise data using dedicated API endpoint
  const fetchGrammarExercise = async (taskId: string) => {
    const response = await fetch(`/api/grammar-exercise?task_id=${taskId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch grammar exercise: ${response.status} ${errorText}`);
    }
    return response.json();
  };

  const { data: grammarData, isLoading, error } = useQuery({
    queryKey: ['grammar-exercise', taskId],
    queryFn: () => fetchGrammarExercise(taskId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!taskId,
  });

  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);

  // Transform the questions to match QuestionRenderer format (memoized for performance)
  const transformedQuestions = useMemo(() => {
    if (!grammarData?.questions) return [];

    const questions = typeof grammarData.questions === 'string'
      ? JSON.parse(grammarData.questions)
      : grammarData.questions;

    if (!Array.isArray(questions)) return [];

    return questions.map((q: any, index: number) => {
      // Generate a unique ID based on question number or index
      const questionId = q.question_number?.toString() || q.id?.toString() || `q-${index + 1}`;

      // Handle grammar-specific question types
      if (q.type === 'error_correction') {
        return {
          id: questionId,
          type: 'error_correction',
          sentence: q.sentence,
          errors_count: q.errors_count,
          error_positions: q.error_positions,
          correct_sentence: q.correct_sentence,
          points: q.points || 2,
          grammar_rule: q.grammar_rule,
          explanation: q.explanation,
        };
      }

      if (q.type === 'sentence_transformation') {
        return {
          id: questionId,
          type: 'sentence_transformation',
          original_sentence: q.original_sentence,
          instruction: q.instruction,
          correct_answer: q.correct_answer,
          acceptable_variations: q.acceptable_variations,
          points: q.points || 2,
          grammar_rule: q.grammar_rule,
          explanation: q.explanation,
        };
      }

      if (q.type === 'verb_conjugation') {
        return {
          id: questionId,
          type: 'verb_conjugation',
          verb: q.verb,
          tense: q.tense,
          subject: q.subject,
          sentence_context: q.sentence_context,
          correct_answer: q.correct_answer,
          points: q.points || 1,
          grammar_rule: q.grammar_rule,
          explanation: q.explanation,
        };
      }

      if (q.type === 'word_order') {
        return {
          id: questionId,
          type: 'word_order',
          scrambled_words: q.scrambled_words,
          correct_sentence: q.correct_sentence,
          correct_order: q.correct_order,
          points: q.points || 2,
          grammar_rule: q.grammar_rule,
          explanation: q.explanation,
        };
      }

      // Handle checkbox questions with multiple correct answers
      if (q.type === 'checkbox') {
        return {
          id: questionId,
          type: 'checkbox',
          question: q.question,
          options: q.options || [],
          correct_indices: q.correct_indices || [],
          correct_answers: q.correct_answers || [],
          points: q.points || 2,
          grammar_rule: q.grammar_rule,
          explanation: q.explanation,
        };
      }

      // Standard question types (same as reading)
      return {
        id: questionId,
        type: q.type,
        question: q.question || q.statement,
        sentence_context: q.sentence_context,
        options: q.options || [],
        correct_answer: q.correct_answer,
        correct_index: q.correct_index,
        sample_answer: q.sample_answer || q.explanation || '',
        points: q.points || 1,
        grammar_rule: q.grammar_rule,
        explanation: q.explanation,
        // Include the whole data object as fallback
        data: q
      };
    }).filter(Boolean);
  }, [grammarData?.questions]);

  console.log('[GrammarTaskPage] Component state:', {
    taskId,
    hasGrammarData: !!grammarData,
    isLoading,
    error,
    transformedQuestionsCount: transformedQuestions.length,
    questionTypes: transformedQuestions.map(q => q.type),
    timestamp: new Date().toISOString()
  });


  const evaluateQuestion = useCallback((question: any, userAnswer: any) => {
    const questionData = question?.data || question;
    const type = questionData?.type;
    const points = questionData?.points || question?.points || 1;
    let isCorrect = false;

    switch (type) {
      case 'multiple_choice':
        isCorrect = userAnswer === questionData?.correct_answer ||
          (questionData?.correct_index !== undefined &&
            questionData?.options?.[questionData.correct_index] === userAnswer);
        break;

      case 'true_false':
        isCorrect = userAnswer?.toString() === questionData?.correct_answer?.toString();
        break;

      case 'fill_in_the_blanks':
        if (Array.isArray(userAnswer) && questionData?.blanks) {
          isCorrect = questionData.blanks.every((blank: any, index: number) =>
            blank?.text?.toLowerCase() === userAnswer[index]?.toLowerCase()
          );
        } else if (typeof userAnswer === 'string' && questionData?.correct_answer) {
          isCorrect = userAnswer.trim().toLowerCase() === questionData.correct_answer.trim().toLowerCase();
        }
        break;

      case 'checkbox': {
        if (userAnswer) {
          let selectedOptions: string[] = [];
          if (Array.isArray(userAnswer)) {
            selectedOptions = userAnswer;
          } else if (typeof userAnswer === 'string') {
            try {
              const parsed = JSON.parse(userAnswer);
              if (Array.isArray(parsed)) selectedOptions = parsed;
            } catch {
              selectedOptions = [];
            }
          }
          const correctAnswers = new Set(questionData?.correct_answers || []);
          isCorrect = selectedOptions.length === correctAnswers.size &&
            selectedOptions.every(answer => correctAnswers.has(answer));
        }
        break;
      }

      case 'error_correction':
        isCorrect = userAnswer?.trim()?.toLowerCase() === questionData?.correct_sentence?.toLowerCase();
        break;

      case 'sentence_transformation': {
        const normalizedAnswer = userAnswer?.trim()?.toLowerCase();
        const normalizedCorrect = questionData?.correct_answer?.toLowerCase();
        const variations = questionData?.acceptable_variations || [];
        isCorrect = normalizedAnswer === normalizedCorrect ||
          variations.some((variation: string) => variation.toLowerCase() === normalizedAnswer);
        break;
      }

      case 'verb_conjugation':
        isCorrect = userAnswer?.trim()?.toLowerCase() === questionData?.correct_answer?.toLowerCase();
        break;

      case 'word_order':
        if (userAnswer) {
          try {
            const indices = Array.isArray(userAnswer) ? userAnswer : JSON.parse(userAnswer);
            if (Array.isArray(indices) && questionData?.scrambled_words) {
              const reconstructed = indices.map((idx: number) => questionData.scrambled_words[idx]).join(' ');
              if (questionData?.correct_sentence) {
                isCorrect = reconstructed === questionData.correct_sentence;
              } else if (questionData?.correct_order) {
                isCorrect = JSON.stringify(indices) === JSON.stringify(questionData.correct_order);
              }
            }
          } catch {
            isCorrect = false;
          }
        }
        break;

      case 'short_answer':
        isCorrect = Boolean(userAnswer);
        break;
    }

    return {
      isCorrect,
      earnedPoints: isCorrect ? points : 0,
      totalPoints: points
    };
  }, []);

  const scoreSummary = useMemo(() => {
    let totalPoints = 0;
    let earnedPoints = 0;

    transformedQuestions.forEach(question => {
      const answer = userAnswers[question.id];
      const { earnedPoints: earned, totalPoints: total } = evaluateQuestion(question, answer);
      totalPoints += total;
      earnedPoints += earned;
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return {
      totalPoints,
      earnedPoints,
      percentage
    };
  }, [transformedQuestions, userAnswers, evaluateQuestion]);

  const percentageColor = useMemo(() => {
    if (scoreSummary.percentage >= 80) return 'text-green-600';
    if (scoreSummary.percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, [scoreSummary.percentage]);

  const feedbackMessage = useMemo(() => {
    if (scoreSummary.percentage >= 90) {
      return "🎉 Excellent work! You've mastered these grammar concepts!";
    }
    if (scoreSummary.percentage >= 75) {
      return '👏 Great job! You have a strong understanding of the grammar rules.';
    }
    if (scoreSummary.percentage >= 60) {
      return '💪 Good effort! Review the incorrect answers to improve.';
    }
    return '📚 Keep practicing! Review the grammar rules and try again.';
  }, [scoreSummary.percentage]);
  const handleExerciseComplete = async (data: {
    totalScore: number;
    maxScore: number;
    exerciseResults: any[];
  }) => {
    await completeTask(courseId);
    setIsExerciseCompleted(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading grammar exercise...</p>
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Error state
  const renderErrorText = (e: any) => (typeof e === 'string' ? e : (e?.message || ''));
  if (error || !grammarData) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-red-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Exercise Not Found
            </h3>
            <p className="text-red-700">
              {error ? renderErrorText(error) : 'The requested grammar exercise could not be found.'}
            </p>
          </Card>
        </div>
      </ExerciseLayout>
    );
  }

  // Authentication check
  if (!user) {
    return null; // Middleware will handle redirect
  }

  // Handler for answer changes in QuestionRenderer
  const handleAnswerChange = (questionId: string, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handler for submit button
  const handleSubmitQuestions = async () => {
    setShowQuestionResults(true);

    let totalPoints = 0;
    let earnedPoints = 0;

    const exerciseResults = transformedQuestions.map(question => {
      const answer = userAnswers[question.id];
      const { isCorrect, earnedPoints: earned, totalPoints: total } = evaluateQuestion(question, answer);
      totalPoints += total;
      earnedPoints += earned;

      return {
        questionId: question.id,
        userAnswer: answer,
        isCorrect,
        points: total
      };
    });

    await handleExerciseComplete({
      totalScore: earnedPoints,
      maxScore: totalPoints,
      exerciseResults
    });
  };

  return (
    <ExerciseLayout taskId={taskId}>
      <div className="h-full overflow-auto relative">
        <div className="max-w-4xl mx-auto p-6">
          {/* Grammar Quiz Header - Simplified */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {grammarData.title || 'Grammar Exercise'}
            </h1>
          </div>

          <div className="space-y-6">
            {transformedQuestions.map((question, index) => (
              <GrammarQuestionRenderer
                key={question.id}
                question={question}
                index={index}
                selectedAnswer={userAnswers[question.id]}
                onAnswerChange={handleAnswerChange}
                showResults={showQuestionResults}
                taskId={taskId}
                userId={user.id}
              />
            ))}
          </div>

          {/* Submit Button */}
          {!showQuestionResults && transformedQuestions.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSubmitQuestions}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Submit Answers
              </button>
            </div>
          )}

          {/* Results Summary - matching the reading page structure */}
          {showQuestionResults && (
            <Card className="mt-8 p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
              {/* Header with Trophy Icon */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Grammar Quiz Results</h3>
              </div>

              {/* Overall Score Display */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Score</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {`${scoreSummary.earnedPoints} / ${scoreSummary.totalPoints}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Percentage</p>
                    <p className="text-2xl font-bold">
                      <span className={percentageColor}>{scoreSummary.percentage}%</span>
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${scoreSummary.totalPoints > 0 ? (scoreSummary.earnedPoints / scoreSummary.totalPoints) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>


              {/* Feedback Message */}
              <div className="mt-6 text-center">
                <p className="text-gray-700">{feedbackMessage}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ExerciseLayout>
  );
}