'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ClickableText from '../../reading/ClickableText';
import LessonMultipleChoice from './LessonMultipleChoice';
import LessonFillInBlanks from './LessonFillInBlanks';
import LessonMatchingExercise from './LessonMatchingExercise';
import TrueFalseQuestion from './TrueFalseQuestion';
import OrderingExercise from './OrderingExercise';
import { supabase } from '@/lib/supabase';

interface ReadingExercise {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'matching' | 'true_false' | 'ordering';
  content: any;
  points?: number;
  explanation?: string;
}

interface LessonReadingTaskProps {
  sectionId: string;
  lessonId: string;
  userId: string;
  title: string;
  instructions?: string;
  readingText: string;
  exercises: ReadingExercise[];
  enableClickableText?: boolean;
  onComplete?: (data: {
    totalScore: number;
    maxScore: number;
    exerciseResults: any[];
  }) => void;
}

export default function LessonReadingTask({
  sectionId,
  lessonId,
  userId,
  title,
  instructions,
  readingText,
  exercises,
  enableClickableText = true,
  onComplete,
}: LessonReadingTaskProps) {
  const [exerciseResults, setExerciseResults] = useState<any[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);

  // Preload definitions when component mounts
  useEffect(() => {
    if (readingText && userId && lessonId && enableClickableText) {
      // Combine all text content from reading text and exercises
      const allTextParts = [readingText];
      
      // Add text from exercises
      exercises.forEach(exercise => {
        switch (exercise.type) {
          case 'multiple_choice':
            if (exercise.content.question) {
              allTextParts.push(exercise.content.question);
            }
            if (exercise.content.options) {
              allTextParts.push(...exercise.content.options);
            }
            break;
          case 'true_false':
            if (exercise.content.statement) {
              allTextParts.push(exercise.content.statement);
            }
            break;
          case 'fill_in_blank':
            if (exercise.content.text) {
              allTextParts.push(exercise.content.text);
            }
            break;
          case 'matching':
            if (exercise.content.items) {
              exercise.content.items.forEach((item: any) => {
                if (item.left) allTextParts.push(item.left);
                if (item.right) allTextParts.push(item.right);
              });
            }
            break;
          case 'ordering':
            if (exercise.content.items) {
              allTextParts.push(...exercise.content.items);
            }
            break;
        }
        
        // Add explanation text if available
        if (exercise.explanation) {
          allTextParts.push(exercise.explanation);
        }
      });
      
      const allText = allTextParts.join(' ');
      
      // Fire and forget - no await, let it run in background
      fetch('/api/preload-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: allText,
          test_id: lessonId,
          user_id: userId
        })
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
      }).then(data => {
        if (data) {
          console.log('Preloading definitions:', data);
        }
      }).catch(error => {
        console.error('Error preloading definitions:', error);
      });
    }
  }, [readingText, exercises, userId, lessonId, enableClickableText]);
  const [currentExerciseAnswered, setCurrentExerciseAnswered] = useState(false);
  const [currentExerciseResult, setCurrentExerciseResult] = useState<any>(null);

  const handleExerciseComplete = (exerciseId: string, result: any) => {
    setCurrentExerciseResult(result);
    setCurrentExerciseAnswered(true);
  };

  const handleNextExercise = () => {
    if (currentExerciseResult) {
      const newResults = [...exerciseResults, { exerciseId: exercises[currentExerciseIndex].id, ...currentExerciseResult }];
      setExerciseResults(newResults);

      // Reset current exercise state
      setCurrentExerciseAnswered(false);
      setCurrentExerciseResult(null);

      // Move to next exercise or complete task
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      } else {
        completeTask(newResults);
      }
    }
  };

  const completeTask = async (results: any[]) => {
    setTaskCompleted(true);
    
    const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    const maxScore = exercises.reduce((sum, ex) => sum + (ex.points || 1), 0);
    
    // Save section score
    try {
      const { error } = await supabase
        .from('lesson_section_scores')
        .insert({
          user_id: userId,
          section_id: sectionId,
          score: totalScore,
          max_score: maxScore,
          time_spent: results.reduce((sum, r) => sum + r.timeTaken, 0),
          feedback: { exercise_results: results },
        });

      if (error) {
        console.error('Error saving section score:', error);
      }

      // Notify parent component
      if (onComplete) {
        onComplete({
          totalScore,
          maxScore,
          exerciseResults: results,
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const renderExercise = (exercise: ReadingExercise) => {
    const commonProps = {
      exerciseId: exercise.id,
      sectionId,
      lessonId,
      userId,
      points: exercise.points,
      explanation: exercise.explanation,
      onComplete: (result: any) => handleExerciseComplete(exercise.id, result),
    };

    switch (exercise.type) {
      case 'multiple_choice':
        return (
          <LessonMultipleChoice
            {...commonProps}
            question={exercise.content.question}
            options={exercise.content.options}
            correctIndex={exercise.content.correctIndex}
            correctAnswer={exercise.content.correctAnswer}
          />
        );
      
      case 'fill_in_blank':
        return (
          <LessonFillInBlanks
            {...commonProps}
            text={exercise.content.text}
            answers={exercise.content.answers}
            hints={exercise.content.hints}
          />
        );
      
      case 'matching':
        return (
          <LessonMatchingExercise
            {...commonProps}
            instructions={exercise.content.instructions}
            leftItems={exercise.content.leftItems}
            rightItems={exercise.content.rightItems}
            correctPairs={exercise.content.correctPairs}
          />
        );
      
      case 'true_false':
        return (
          <TrueFalseQuestion
            {...commonProps}
            statement={exercise.content.statement}
            correctAnswer={exercise.content.correctAnswer}
            referenceText={exercise.content.referenceText}
          />
        );
      
      case 'ordering':
        return (
          <OrderingExercise
            {...commonProps}
            instructions={exercise.content.instructions}
            items={exercise.content.items}
            correctOrder={exercise.content.correctOrder}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-8 rounded-3xl shadow-xl border border-blue-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10"></div>
        <div className="relative z-10">
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg transform hover:scale-105 transition-transform">
              📖
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent mb-3">{title}</h2>
              {instructions && (
                <p className="text-indigo-700 text-lg leading-relaxed">{instructions}</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200">
              <span className="text-sm font-semibold text-blue-800">
                Question {currentExerciseIndex + 1} of {exercises.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {exercises.map((_, index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-300 transform ${
                    index < currentExerciseIndex
                      ? 'bg-green-500 border-2 border-green-400 scale-110 shadow-lg'
                      : index === currentExerciseIndex
                      ? 'bg-blue-500 border-2 border-blue-400 scale-125 shadow-xl animate-pulse'
                      : 'bg-gray-300 border-2 border-gray-200 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reading Text */}
      <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 rounded-t-3xl"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            📄
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">Reading Text</h3>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
          {enableClickableText ? (
            <ClickableText
              text={readingText}
              testId={lessonId}
              userId={userId}
            />
          ) : (
            <div className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-black prose-em:text-gray-700">
              <div className="whitespace-pre-wrap leading-relaxed text-lg">
                {readingText.split('\\n\\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-800">
                    {paragraph.replace(/\\n/g, ' ')}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Exercise */}
      {!taskCompleted && (
        <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 rounded-t-3xl"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              ❓
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent">
              Question {currentExerciseIndex + 1}
            </h3>
          </div>
          {renderExercise(exercises[currentExerciseIndex])}
          
          {/* Answer Review and Next Button */}
          {currentExerciseAnswered && currentExerciseResult && (
            <div className="mt-8 p-6 rounded-2xl border-2 bg-gradient-to-br from-gray-50 to-blue-50">
              <div className={`p-6 rounded-2xl mb-6 border-2 transition-all duration-300 ${
                currentExerciseResult.isCorrect 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 text-green-800 shadow-lg' 
                  : 'bg-gradient-to-br from-red-50 to-pink-100 border-red-300 text-red-800 shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`text-3xl ${currentExerciseResult.isCorrect ? '🎉' : '💡'}`}>
                    {currentExerciseResult.isCorrect ? '🎉' : '💡'}
                  </div>
                  <p className="text-xl font-bold">
                    {currentExerciseResult.isCorrect ? 'Excellent!' : 'Good try!'}
                  </p>
                </div>
                {!currentExerciseResult.isCorrect && currentExerciseResult.explanation && (
                  <p className="mt-3 text-sm leading-relaxed">{currentExerciseResult.explanation}</p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-semibold">Points earned:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: exercises[currentExerciseIndex].points || 1 }, (_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full ${
                        i < (currentExerciseResult.pointsEarned || 0) ? 'bg-yellow-400' : 'bg-gray-300'
                      }`} />
                    ))}
                  </div>
                  <span className="text-sm">{currentExerciseResult.pointsEarned || 0} / {exercises[currentExerciseIndex].points || 1}</span>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleNextExercise}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  <span>{currentExerciseIndex < exercises.length - 1 ? 'Next Question' : 'Complete Reading Task'}</span>
                  <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion Summary */}
      {taskCompleted && (
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-8 rounded-3xl border-2 border-green-300 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-teal-400/10"></div>
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-3xl font-extrabold bg-gradient-to-r from-green-700 to-teal-800 bg-clip-text text-transparent mb-2">
                Reading Task Completed!
              </h3>
              <p className="text-green-600 text-lg">Amazing work! You've finished all the questions.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200 text-center">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-green-800 font-bold text-xl">
                  {exerciseResults.reduce((sum, r) => sum + r.pointsEarned, 0)} / {exercises.reduce((sum, ex) => sum + (ex.points || 1), 0)}
                </p>
                <p className="text-green-600 text-sm">Total Points</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-green-800 font-bold text-xl">
                  {exerciseResults.filter(r => r.isCorrect).length} / {exercises.length}
                </p>
                <p className="text-green-600 text-sm">Correct Answers</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200 text-center">
                <div className="text-3xl mb-2">⏱️</div>
                <p className="text-green-800 font-bold text-xl">
                  {Math.floor(exerciseResults.reduce((sum, r) => sum + r.timeTaken, 0) / 60)}m
                </p>
                <p className="text-green-600 text-sm">Time Taken</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}