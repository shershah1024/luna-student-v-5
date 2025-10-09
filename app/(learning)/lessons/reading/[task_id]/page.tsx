'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useTaskProgress } from '@/hooks/useProgress';
import ExerciseLayout from '@/components/lessons/shared/ExerciseLayout';
import LessonReadingTaskSinglePage from '@/components/lessons/exercises/LessonReadingTaskSinglePage';
import QuestionRenderer from '@/components/lessons/exercises/question-renderers/QuestionRenderer';
import ClickableText from '@/components/ui/ClickableText';
import { Loader2, AlertCircle, BookOpen, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Dedicated page for reading exercises
 * Handles its own data fetching and state management
 * Route: /lessons/reading/[task_id]
 */
export default function ReadingTaskPage() {
  const params = useParams();
  const { user } = useUser();
  const taskId = params.task_id as string;
  const courseId = 'goethe-a1'; // Hardcoded for now
  
  // Navigation completion state
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(false);
  
  // State for QuestionRenderer approach
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showQuestionResults, setShowQuestionResults] = useState(false);
  const [pendingEvaluations, setPendingEvaluations] = useState<Set<string>>(new Set());
  const [evaluationsComplete, setEvaluationsComplete] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<Record<string, { score: number; maxScore: number }>>({});
  
  // Fetch reading exercise data using dedicated API (matching listening page pattern)
  const fetchReadingExercise = async (taskId: string) => {
    const response = await fetch(`/api/reading-exercise?task_id=${taskId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch reading exercise: ${response.status} ${errorText}`);
    }
    return response.json();
  };

  const { data: readingData, isLoading, error } = useQuery({
    queryKey: ['reading-exercise', taskId],
    queryFn: () => fetchReadingExercise(taskId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!taskId,
  });
  
  // Progress tracking
  const { taskProgress, completeTask } = useTaskProgress(taskId);

  // Transform the questions to match QuestionRenderer format (memoized for performance)
  // Must be called before any early returns to avoid hooks violation
  const transformedQuestions = useMemo(() => {
    if (!readingData?.questions) return [];
    
    const questions = typeof readingData.questions === 'string' 
      ? JSON.parse(readingData.questions) 
      : readingData.questions;
    
    if (!Array.isArray(questions)) return [];
    
    return questions.map((q: any, index: number) => {
      // Generate a unique ID based on question number or index
      const questionId = q.question_number?.toString() || q.id?.toString() || `q-${index + 1}`;

      // If the question already has all its data at the root level, just add an ID
      // This preserves the exact structure from the database
      if (q.left || q.right || q.prompt || q.pairs || q.sentences || q.blanks) {
        return {
          ...q,
          id: questionId,
          points: q.points || 1,
        };
      }

      // Otherwise transform to expected format
      return {
        id: questionId,
        type: q.type,
        question: q.question,
        options: q.options || [],
        correct_answer: q.correct_answer,
        correct_index: q.correct_index,
        sample_answer: q.sample_answer || q.explanation || '',
        points: q.points || 1,
        // Additional fields for complex question types
        pairs: q.pairs,
        sentences: q.sentences,
        blanks: q.blanks,
        explanation: q.explanation,
        // Matching question specific fields
        left: q.left,
        right: q.right,
        prompt: q.prompt,
        // Include the whole data object as fallback
        data: q
      };
    }).filter(Boolean); // Remove null entries
  }, [readingData?.questions]); // Only recompute when questions change
  
  // For compatibility with LessonReadingTaskSinglePage, also create the old format
  const transformedExercises = useMemo(() => {
    return transformedQuestions.map((q: any) => {
      // Map to the format expected by LessonReadingTaskSinglePage
      if (q.type === 'multiple_choice') {
        const correctIndex = q.correct_index !== undefined ? q.correct_index : 
                           (q.options ? q.options.indexOf(q.correct_answer) : 0);
        return {
          id: q.id,
          type: 'multiple_choice',
          content: {
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correct_answer,
            correctIndex: correctIndex >= 0 ? correctIndex : 0
          },
          points: q.points || 1,
          explanation: q.explanation
        };
      } else if (q.type === 'true_false') {
        return {
          id: q.id,
          type: 'true_false',
          content: {
            statement: q.question,
            correctAnswer: q.correct_answer === 'true' || q.correct_answer === true
          },
          points: q.points || 1,
          explanation: q.explanation
        };
      } else if (q.type === 'fill_in_the_blanks') {
        return {
          id: q.id,
          type: 'fill_in_blank',
          content: {
            text: q.question,
            answers: q.blanks ? q.blanks.map((b: any) => b.text || b) : [q.correct_answer || '']
          },
          points: q.points || 1,
          explanation: q.explanation
        };
      } else {
        // For unsupported types in LessonReadingTaskSinglePage, return null
        // These will be handled by QuestionRenderer instead
        return null;
      }
    }).filter(Boolean);
  }, [transformedQuestions]);

  console.log('[ReadingTaskPage] Component state:', {
    taskId,
    hasReadingData: !!readingData,
    isLoading,
    error,
    transformedQuestionsCount: transformedQuestions.length,
    transformedExercisesCount: transformedExercises.length,
    questionTypes: transformedQuestions.map(q => q.type),
    readingDataStructure: readingData ? {
      hasQuestions: !!readingData.questions,
      questionsType: typeof readingData.questions,
      questionsIsArray: Array.isArray(readingData.questions),
      questionsLength: readingData.questions?.length,
      readingDataKeys: Object.keys(readingData)
    } : null,
    timestamp: new Date().toISOString()
  });

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
            <p className="text-gray-600">Loading reading exercise...</p>
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Error state
  const renderErrorText = (e: any) => (typeof e === 'string' ? e : (e?.message || ''));
  if (error || !readingData) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full flex items-center justify-center p-8">
          <Card className="border-red-200 p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Exercise Not Found
            </h3>
            <p className="text-red-700">
              {error ? renderErrorText(error) : 'The requested reading exercise could not be found.'}
            </p>
          </Card>
        </div>
      </ExerciseLayout>
    );
  }


  // Check if reading data is available
  // Special handling for reading passages without exercises
  if (transformedExercises.length === 0 && readingData) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full overflow-auto relative">
          {/* Simple reading passage display */}
          <div className="max-w-4xl mx-auto p-6">
            <Card className="bg-blue-50 border border-blue-200 shadow-lg">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {readingData.text_title}
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">Reading Passage</p>
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="text-lg leading-relaxed whitespace-pre-wrap text-gray-700"
                    dangerouslySetInnerHTML={{ 
                      __html: readingData.reading_text.replace(/\n/g, '<br>') 
                    }} 
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Authentication check
  if (!user) {
    return null; // Middleware will handle redirect
  }


  console.log('[ReadingTaskPage] Transformed exercises:', {
    originalQuestions: readingData?.questions,
    transformedCount: transformedExercises.length,
    transformedExercises: transformedExercises.slice(0, 2) // Log first 2 for debugging
  });

  // Handler for answer changes in QuestionRenderer
  const handleAnswerChange = (questionId: string, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Helper function to calculate score for a question
  const calculateQuestionScore = (question: any, userAnswer: any) => {
    // Check for async evaluation results first (essay, fill-in-blanks)
    if (evaluationResults[question.id]) {
      return {
        earned: evaluationResults[question.id].score,
        total: evaluationResults[question.id].maxScore
      };
    }

    const points = question.points || 1;
    let earned = 0;

    switch (question.type) {
      case 'multiple_choice':
        const isCorrectMC = userAnswer === question.correct_answer ||
          (question.correct_index !== undefined && userAnswer === question.options[question.correct_index]);
        if (isCorrectMC) earned = points;
        break;

      case 'checkbox':
        if (question.correct_answers && userAnswer) {
          try {
            const selectedOptions = JSON.parse(userAnswer);
            const correct = selectedOptions.filter((opt: string) => question.correct_answers.includes(opt)).length;
            const incorrect = selectedOptions.filter((opt: string) => !question.correct_answers.includes(opt)).length;
            if (incorrect === 0 && correct > 0) {
              earned = Math.floor(points * correct / question.correct_answers.length);
            }
          } catch {
            earned = 0;
          }
        }
        break;

      case 'true_false':
        if (userAnswer?.toString() === question.correct_answer?.toString()) {
          earned = points;
        }
        break;

      case 'fill_in_the_blanks':
        // For fill-in-blanks without evaluation result, do simple check
        if (question.blanks && Array.isArray(userAnswer)) {
          const isCorrect = question.blanks.every((blank: any, index: number) =>
            blank.text?.toLowerCase() === userAnswer[index]?.toLowerCase()
          );
          if (isCorrect) earned = points;
        } else if (typeof userAnswer === 'string' && question.correct_answer) {
          // Single blank check
          if (userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()) {
            earned = points;
          }
        }
        break;

      case 'matching':
        if (question.correct_answer && userAnswer) {
          try {
            const correctMatches = JSON.parse(question.correct_answer);
            const userMatches = JSON.parse(userAnswer);
            const pairsCount = Object.keys(correctMatches).length;
            let correctCount = 0;
            Object.keys(correctMatches).forEach(key => {
              if (correctMatches[key] === userMatches[key]) correctCount++;
            });
            earned = correctCount;
            return { earned: correctCount, total: pairsCount };
          } catch {
            earned = 0;
          }
        }
        break;

      case 'sentence_ordering':
        if (question.correct_answer && userAnswer) {
          try {
            const correctOrder = JSON.parse(question.correct_answer);
            const userOrder = JSON.parse(userAnswer);
            if (JSON.stringify(correctOrder) === JSON.stringify(userOrder)) {
              earned = points;
            }
          } catch {
            earned = 0;
          }
        }
        break;

      case 'short_answer':
        if (userAnswer) earned = points; // Assuming any answer gets points for short answer
        break;

      case 'essay':
        // Essay scores only come from evaluation
        earned = 0;
        break;
    }

    return { earned, total: points };
  };

  // Handler for when an async evaluation completes
  const handleEvaluationComplete = (questionId: string | number, score?: number, maxScore?: number) => {
    // Store evaluation result if score is provided
    if (score !== undefined && maxScore !== undefined) {
      setEvaluationResults(prev => ({
        ...prev,
        [questionId.toString()]: { score, maxScore }
      }));
    }

    setPendingEvaluations(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId.toString());

      // If all evaluations are complete, mark as done
      if (newSet.size === 0) {
        setEvaluationsComplete(true);
      }

      return newSet;
    });
  };

  // Handler for submit button in QuestionRenderer approach
  const handleSubmitQuestions = async () => {
    setShowQuestionResults(true);

    // Track questions that need async evaluation
    const questionsNeedingEval = new Set<string>();
    transformedQuestions.forEach(question => {
      if (question.type === 'essay' || question.type === 'fill_in_the_blanks') {
        questionsNeedingEval.add(question.id.toString());
      }
    });

    setPendingEvaluations(questionsNeedingEval);

    // If there are no questions needing async evaluation, mark as complete immediately
    if (questionsNeedingEval.size === 0) {
      setEvaluationsComplete(true);
    }

    // Calculate initial score for immediate questions (non-async)
    // Async evaluations will update the scores later
    let totalPoints = 0;
    let earnedPoints = 0;

    transformedQuestions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      // Skip essay and fill-in-blanks as they'll be evaluated async
      if (question.type !== 'essay' && question.type !== 'fill_in_the_blanks') {
        const result = calculateQuestionScore(question, userAnswer);
        earnedPoints += result.earned;
        totalPoints += result.total;
      } else {
        // Just add the max points for now
        totalPoints += question.points || 1;
      }
    });

    // Call the completion handler with initial scores
    await handleExerciseComplete({
      totalScore: earnedPoints,
      maxScore: totalPoints,
      exerciseResults: transformedQuestions.map(q => ({
        questionId: q.id,
        userAnswer: userAnswers[q.id],
        isCorrect: false, // Will be calculated properly in display
        points: q.points || 1
      }))
    });
  };

  // Check if we should use QuestionRenderer for all question types
  const hasComplexQuestionTypes = transformedQuestions.some(q => 
    ['matching', 'sentence_ordering', 'short_answer'].includes(q.type)
  );

  // If we have complex question types OR if we want to show points, use QuestionRenderer
  if (hasComplexQuestionTypes || transformedQuestions.length > 0) {
    return (
      <ExerciseLayout taskId={taskId}>
        <div className="h-full overflow-auto relative">
          <div className="max-w-4xl mx-auto p-6">
            {/* Reading Text Display */}
            <Card className="bg-blue-50 border border-blue-200 shadow-lg mb-8">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {readingData.text_title}
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none">
                  <div className="text-lg leading-relaxed whitespace-pre-wrap text-gray-700">
                    <ClickableText
                      text={readingData.reading_text}
                      testId={taskId}
                      userId={user?.id}
                      language={readingData.language || 'de'}
                      textSizeClass="text-lg"
                    />
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Questions using QuestionRenderer */}
            <div className="space-y-6">
              {transformedQuestions.map((question, index) => (
                <Card key={question.id} className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Question {index + 1}
                    </h3>
                    {/* Only show question text if it's not fill_in_the_blanks 
                        (fill_in_the_blanks renderer handles its own question display) */}
                    {question.type !== 'fill_in_the_blanks' && (
                      <p className="text-gray-700 mt-2">{question.question}</p>
                    )}
                  </div>
                  <QuestionRenderer
                    question={question}
                    selectedAnswer={userAnswers[question.id]}
                    onAnswerChange={handleAnswerChange}
                    showResults={showQuestionResults}
                    taskId={taskId}
                    userId={user?.id || ''}
                    onEvaluationComplete={handleEvaluationComplete}
                  />
                </Card>
              ))}
            </div>
            
            {/* Submit Button */}
            {!showQuestionResults && transformedQuestions.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSubmitQuestions}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Answers
                </button>
              </div>
            )}
            
            {/* Loading indicator while evaluations are pending */}
            {showQuestionResults && !evaluationsComplete && pendingEvaluations.size > 0 && (
              <Card className="mt-8 p-8 bg-gray-50 border-2 border-gray-200">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Evaluating your answers... ({pendingEvaluations.size} remaining)</p>
                </div>
              </Card>
            )}

            {/* Comprehensive Results Summary - only show when all evaluations are complete */}
            {showQuestionResults && evaluationsComplete && (
              <Card className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                {/* Header with Trophy Icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Quiz Results</h3>
                </div>
                
                {/* Overall Score Display */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Score</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {(() => {
                          let earned = 0;
                          let total = 0;
                          transformedQuestions.forEach(q => {
                            const userAnswer = userAnswers[q.id];
                            const result = calculateQuestionScore(q, userAnswer);
                            earned += result.earned;
                            total += result.total;
                          });
                          return `${earned} / ${total}`;
                        })()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Percentage</p>
                      <p className="text-2xl font-bold">
                        {(() => {
                          let earned = 0;
                          let total = 0;
                          transformedQuestions.forEach(q => {
                            const userAnswer = userAnswers[q.id];
                            const result = calculateQuestionScore(q, userAnswer);
                            earned += result.earned;
                            total += result.total;
                          });
                          const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
                          const color = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
                          return <span className={color}>{percentage}%</span>;
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${(() => {
                          let earned = 0;
                          let total = 0;
                          transformedQuestions.forEach(q => {
                            const userAnswer = userAnswers[q.id];
                            if (q.type === 'matching' && q.correct_answer) {
                              const correctMatches = JSON.parse(q.correct_answer);
                              const userMatches = userAnswer ? JSON.parse(userAnswer) : {};
                              const pairsCount = Object.keys(correctMatches).length;
                              total += pairsCount;
                              Object.keys(correctMatches).forEach(key => {
                                if (correctMatches[key] === userMatches[key]) earned++;
                              });
                            } else {
                              const points = q.points || 1;
                              total += points;
                              let isCorrect = false;
                              switch (q.type) {
                                case 'multiple_choice':
                                  isCorrect = userAnswer === q.correct_answer ||
                                    (q.correct_index !== undefined && userAnswer === q.options[q.correct_index]);
                                  break;
                                case 'true_false':
                                  isCorrect = userAnswer?.toString() === q.correct_answer?.toString();
                                  break;
                                case 'fill_in_the_blanks':
                                  if (q.blanks && Array.isArray(userAnswer)) {
                                    isCorrect = q.blanks.every((blank: any, index: number) => 
                                      blank.text?.toLowerCase() === userAnswer[index]?.toLowerCase()
                                    );
                                  }
                                  break;
                                case 'sentence_ordering':
                                  if (q.correct_answer) {
                                    const correctOrder = JSON.parse(q.correct_answer);
                                    const userOrder = userAnswer ? JSON.parse(userAnswer) : [];
                                    isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
                                  }
                                  break;
                                case 'short_answer':
                                  isCorrect = !!userAnswer;
                                  break;
                              }
                              if (isCorrect) earned += points;
                            }
                          });
                          return total > 0 ? (earned / total) * 100 : 0;
                        })()}%`
                      }}
                    />
                  </div>
                </div>
                
                {/* Question-by-Question Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Question Breakdown</h4>
                  <div className="space-y-3">
                    {transformedQuestions.map((question, index) => {
                      const userAnswer = userAnswers[question.id];
                      const result = calculateQuestionScore(question, userAnswer);
                      const earned = result.earned;
                      const maxPoints = result.total;
                      const isCorrect = earned === maxPoints;

                      const statusColor = isCorrect ? 'bg-green-100 border-green-300' :
                                         earned > 0 ? 'bg-yellow-100 border-yellow-300' :
                                         'bg-red-100 border-red-300';
                      const statusIcon = isCorrect ? '✓' : earned > 0 ? '◐' : '✗';
                      const statusIconColor = isCorrect ? 'text-green-600' : 
                                             earned > 0 ? 'text-yellow-600' : 
                                             'text-red-600';
                      
                      return (
                        <div key={question.id} className={`flex items-center justify-between p-3 rounded-lg border ${statusColor}`}>
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-bold ${statusIconColor}`}>
                              {statusIcon}
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">
                                Question {index + 1}
                              </p>
                              <p className="text-sm text-gray-600">
                                {question.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              {earned} / {maxPoints}
                            </p>
                            <p className="text-xs text-gray-600">
                              {maxPoints === 1 ? 'point' : 'points'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Feedback Message */}
                <div className="mt-6 text-center">
                  <p className="text-gray-700">
                    {(() => {
                      let earned = 0;
                      let total = 0;
                      transformedQuestions.forEach(q => {
                        const userAnswer = userAnswers[q.id];
                        if (q.type === 'matching' && q.correct_answer) {
                          const correctMatches = JSON.parse(q.correct_answer);
                          const userMatches = userAnswer ? JSON.parse(userAnswer) : {};
                          const pairsCount = Object.keys(correctMatches).length;
                          total += pairsCount;
                          Object.keys(correctMatches).forEach(key => {
                            if (correctMatches[key] === userMatches[key]) earned++;
                          });
                        } else {
                          const points = q.points || 1;
                          total += points;
                          let isCorrect = false;
                          switch (q.type) {
                            case 'multiple_choice':
                              isCorrect = userAnswer === q.correct_answer ||
                                (q.correct_index !== undefined && userAnswer === q.options[q.correct_index]);
                              break;
                            case 'true_false':
                              isCorrect = userAnswer?.toString() === q.correct_answer?.toString();
                              break;
                            case 'fill_in_the_blanks':
                              if (q.blanks && Array.isArray(userAnswer)) {
                                isCorrect = q.blanks.every((blank: any, index: number) => 
                                  blank.text?.toLowerCase() === userAnswer[index]?.toLowerCase()
                                );
                              }
                              break;
                            case 'sentence_ordering':
                              if (q.correct_answer) {
                                const correctOrder = JSON.parse(q.correct_answer);
                                const userOrder = userAnswer ? JSON.parse(userAnswer) : [];
                                isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
                              }
                              break;
                            case 'short_answer':
                              isCorrect = !!userAnswer;
                              break;
                          }
                          if (isCorrect) earned += points;
                        }
                      });
                      const percentage = total > 0 ? (earned / total) * 100 : 0;
                      if (percentage >= 90) return "🎉 Excellent work! You've mastered this material!";
                      if (percentage >= 75) return "👏 Great job! You have a strong understanding.";
                      if (percentage >= 60) return "💪 Good effort! Review the incorrect answers to improve.";
                      return "📚 Keep practicing! Review the material and try again.";
                    })()}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </ExerciseLayout>
    );
  }

  // Fallback to LessonReadingTaskSinglePage for simple questions
  return (
    <ExerciseLayout taskId={taskId}>
      <div className="h-full overflow-auto relative">
        <LessonReadingTaskSinglePage
          sectionId={readingData.exercise_id || ''}
          lessonId={taskId}
          userId={user.id}
          title={readingData.text_title}
          readingText={readingData.reading_text}
          exercises={transformedExercises}
          enableClickableText={true}
          onComplete={handleExerciseComplete}
        />
      </div>
    </ExerciseLayout>
  );
}
