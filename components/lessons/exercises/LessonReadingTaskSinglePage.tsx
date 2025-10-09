'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, Target, CheckCircle, Lightbulb, Play, FileText, Clock, Eye, BrainCircuit, Sparkles, Trophy, HelpCircle, X, Volume2, VolumeX, Pause, RotateCcw, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ClickableText from '@/components/ui/ClickableText';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { colors, utilityClasses, spacing, typography } from '@/lib/design-tokens';

// Helper function to extract text from React children
const extractTextFromChildren = (children: any): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';
  
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  
  if (children.props && children.props.children) {
    return extractTextFromChildren(children.props.children);
  }
  
  return '';
};

// Reading exercise intro screen component
function ReadingIntroScreen({ 
  onStart, 
  title,
  exerciseCount,
  readingText,
  instructions
}: { 
  onStart: () => void; 
  title: string;
  exerciseCount: number;
  readingText: string;
  instructions?: string;
}) {
  // Extract preview of what they'll learn from the text
  const getTextPreview = () => {
    if (!readingText) return "text";
    const preview = readingText.substring(0, 150);
    return preview + (readingText.length > 150 ? "..." : "");
  };

  const getWordCount = () => {
    if (!readingText) return 0;
    return readingText.split(/\s+/).length;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
      <div className="w-full max-w-lg mx-auto">
      {/* Main Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8 text-blue-600" />
          Reading Exercise
        </h1>
      </div>
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="relative bg-blue-600 p-6 rounded-full">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {title}
        </h2>
        
        <p className="text-gray-600 text-base mb-4">
          In this lesson, you'll practice reading comprehension and learn new vocabulary in context. 
          Read the text carefully and answer questions to test your understanding.
        </p>
        
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
          <span className="text-blue-700 font-semibold">{exerciseCount} questions</span>
          <span className="text-blue-600">to answer</span>
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <motion.button
          onClick={onStart}
          className="w-full bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 hover:bg-blue-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Play className="h-6 w-6" />
            Start Reading Exercise
          </div>
        </motion.button>
        
        <p className="text-sm text-gray-500 mt-3">
          Take your time to read and understand the text
        </p>
      </div>
      </div>
    </div>
  );
}

interface ReadingExercise {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'matching' | 'true_false' | 'ordering';
  content: any;
  points?: number;
  explanation?: string;
}

interface LessonReadingTaskSinglePageProps {
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

export default function LessonReadingTaskSinglePage({
  sectionId,
  lessonId,
  userId,
  title,
  instructions,
  readingText,
  exercises,
  enableClickableText = true,
  onComplete,
}: LessonReadingTaskSinglePageProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const mode = 'learn'; // Always in learn mode for reading lessons
  const [score, setScore] = useState<{correct: number, total: number}>({correct: 0, total: 0});
  
  // Audio playback state
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string>('');

  // Preload definitions when component mounts
  useEffect(() => {
    if (readingText && userId && lessonId && enableClickableText) {
      // Combine all text content from reading text and exercises
      const allTextParts = [readingText];
      
      // Add text from exercises
      (exercises || []).forEach(exercise => {
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

  // Audio functionality
  const fetchOrGenerateAudio = async () => {
    if (isLoadingAudio || audioUrl) return; // Don't fetch if already loading or have URL
    
    setIsLoadingAudio(true);
    setAudioError('');
    
    try {
      const response = await fetch('/api/generate-passage-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: lessonId,
          language: 'german'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        // Optional: show warning if using fallback
        if (data.warning) {
          console.warn('Audio warning:', data.warning);
        }
      } else {
        throw new Error('No audio URL received');
      }
      
    } catch (error) {
      console.error('Error fetching passage audio:', error);
      setAudioError(error instanceof Error ? error.message : 'Failed to load audio');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Handle play state changes from the audio player
  const handlePlayStateChange = (isPlaying: boolean) => {
    setIsPlayingAudio(isPlaying);
  };

  const handleAnswerSelect = (exerciseId: string, answer: any) => {
    if (!showResults) {
      setAnswers(prev => ({ ...prev, [exerciseId]: answer }));
    }
  };

  const hasAtLeastOneAnswer = () => {
    return Object.keys(answers).length > 0;
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalQuestions = exercises.length;
    
    exercises.forEach(exercise => {
      const userAnswer = answers[exercise.id];
      let isCorrect = false;
      
      switch (exercise.type) {
        case 'multiple_choice':
          if (exercise.content.correctAnswer) {
            isCorrect = userAnswer === exercise.content.correctAnswer;
          } else if (exercise.content.correctIndex !== undefined) {
            isCorrect = userAnswer === exercise.content.options[exercise.content.correctIndex];
          }
          break;
        case 'true_false':
          isCorrect = userAnswer === exercise.content.correctAnswer;
          break;
        case 'fill_in_blank':
          // For fill in blank, check if any of the accepted answers match
          if (Array.isArray(exercise.content.answers)) {
            isCorrect = exercise.content.answers.some((answer: string) => 
              answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
            );
          }
          break;
        default:
          // For other types, implement as needed
          break;
      }
      
      if (isCorrect) {
        correctCount++;
      }
    });
    
    return { correct: correctCount, total: totalQuestions };
  };

  const handleSubmit = async () => {
    if (!hasAtLeastOneAnswer()) {
      alert('Please answer at least one question before submitting.');
      return;
    }
    
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    setShowResults(true);
    
    // Create exercise results
    const exerciseResults = exercises.map(exercise => {
      const userAnswer = answers[exercise.id];
      let isCorrect = false;
      let correctAnswer = '';
      
      switch (exercise.type) {
        case 'multiple_choice':
          if (exercise.content.correctAnswer) {
            correctAnswer = exercise.content.correctAnswer;
            isCorrect = userAnswer === exercise.content.correctAnswer;
          } else if (exercise.content.correctIndex !== undefined) {
            correctAnswer = exercise.content.options[exercise.content.correctIndex];
            isCorrect = userAnswer === correctAnswer;
          }
          break;
        case 'true_false':
          correctAnswer = exercise.content.correctAnswer;
          isCorrect = userAnswer === exercise.content.correctAnswer;
          break;
        case 'fill_in_blank':
          correctAnswer = Array.isArray(exercise.content.answers) ? exercise.content.answers[0] : '';
          if (Array.isArray(exercise.content.answers)) {
            isCorrect = exercise.content.answers.some((answer: string) => 
              answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
            );
          }
          break;
      }
      
      return {
        exerciseId: exercise.id,
        userAnswer,
        correctAnswer,
        isCorrect,
        pointsEarned: isCorrect ? (exercise.points || 1) : 0,
        timeTaken: 0 // We're not tracking time per exercise in this version
      };
    });

    // Save reading results to database using new API
    try {
      console.log('[LessonReadingTask] Saving reading results...');
      
      const readingResultData = {
        taskId: lessonId,
        sectionId: sectionId,
        lessonId: lessonId,
        title: title,
        score: calculatedScore.correct,
        maxScore: calculatedScore.total,
        timeTakenSeconds: 0, // Not tracking time in this version
        exerciseResults: exerciseResults,
        readingTextPreview: readingText ? readingText.substring(0, 200) : null
      };
      
      console.log('[LessonReadingTask] Reading result data:', readingResultData);
      
      const response = await fetch('/api/reading/save-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingResultData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[LessonReadingTask] Reading results saved successfully:', result);
      } else {
        const errorData = await response.text();
        console.error('[LessonReadingTask] Failed to save reading results:', errorData);
      }

      // Legacy save to lesson_section_scores for backward compatibility
      const { error } = await supabase
        .from('lesson_section_scores')
        .insert({
          user_id: userId,
          section_id: sectionId,
          score: calculatedScore.correct,
          max_score: calculatedScore.total,
          time_spent: 0,
          feedback: { exercise_results: exerciseResults },
        });

      if (error) {
        console.error('Error saving legacy section score:', error);
      }

      // Notify parent component
      if (onComplete) {
        onComplete({
          totalScore: calculatedScore.correct,
          maxScore: calculatedScore.total,
          exerciseResults,
        });
      }
    } catch (error) {
      console.error('Error saving reading results:', error);
    }
  };

  // Removed toggleMode function as we're always in learn mode

  const getOptionClass = (exerciseId: string, option: any, correctAnswer: any, isSelected: boolean) => {
    const baseClass = cn(
      "relative border rounded-2xl px-4 py-5 cursor-pointer transition-all duration-300 text-left font-medium text-base min-h-[70px] flex items-center group",
      utilityClasses.smoothTransition
    );
    
    if (showResults) {
      if (option === correctAnswer) {
        return cn(baseClass, "border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 shadow-lg shadow-emerald-100/50");
      } else if (isSelected) {
        return cn(baseClass, "border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50 text-red-800 shadow-lg shadow-red-100/50");
      } else {
        return cn(baseClass, "border border-slate-200 bg-slate-50/50 text-slate-500");
      }
    }
    
    if (isSelected) {
      return cn(baseClass, "border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-lg shadow-blue-100/50 scale-[1.02]");
    }
    
    return cn(baseClass, "border border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 hover:text-blue-800 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]");
  };

  const renderExercise = (exercise: ReadingExercise, index: number) => {
    const userAnswer = answers[exercise.id];
    
    switch (exercise.type) {
      case 'multiple_choice':
        const correctAnswer = exercise.content.correctAnswer || 
          (exercise.content.correctIndex !== undefined ? exercise.content.options[exercise.content.correctIndex] : '');
        
        return (
          <div key={exercise.id} className={cn(
            utilityClasses.glassMorphism,
            utilityClasses.premiumCard,
            "p-6 sm:p-8 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/80 to-slate-50/30"
          )}>
            <div className="flex items-start gap-4 mb-8">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    Multiple Choice
                  </span>
                </div>
                <div className="text-lg text-slate-800 leading-relaxed">
                  <div className="prose prose-lg max-w-none prose-p:text-slate-800 prose-strong:text-slate-900 prose-em:text-slate-700">
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => (
                          <p className="mb-0">
                            {mode === 'learn' && enableClickableText ? (
                              <ClickableText 
                                text={extractTextFromChildren(children)} 
                                testId={lessonId} 
                                userId={userId} 
                              />
                            ) : (
                              children
                            )}
                          </p>
                        ),
                      }}
                    >
                      {exercise.content.question}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {exercise.content.options.map((option: string, optionIndex: number) => {
                const optionLetter = String.fromCharCode(97 + optionIndex); // a, b, c, d
                const isSelected = userAnswer === option;
                
                return (
                  <button
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(exercise.id, option)}
                    className={getOptionClass(exercise.id, option, correctAnswer, isSelected)}
                    disabled={showResults}
                  >
                    <div className="flex items-center w-full">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base mr-4 flex-shrink-0 transition-all duration-300 shadow-sm",
                        showResults
                          ? option === correctAnswer
                            ? 'bg-emerald-200 text-emerald-800 shadow-emerald-200/50'
                            : isSelected
                            ? 'bg-red-200 text-red-800 shadow-red-200/50'
                            : 'bg-slate-200 text-slate-500'
                          : isSelected
                          ? 'bg-blue-200 text-blue-800 shadow-blue-200/50'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                      )}>
                        {optionLetter.toUpperCase()}
                      </div>
                      <div className="flex-1 prose prose-lg prose-p:inline prose-strong:text-inherit prose-em:text-inherit">
                        <ReactMarkdown 
                          components={{
                            p: ({ children }) => (
                              <span>
                                {mode === 'learn' && enableClickableText ? (
                                  <ClickableText 
                                    text={extractTextFromChildren(children)} 
                                    testId={lessonId} 
                                    userId={userId} 
                                  />
                                ) : (
                                  children
                                )}
                              </span>
                            ),
                          }}
                        >
                          {option}
                        </ReactMarkdown>
                      </div>
                      {showResults && (
                        <div className="flex-shrink-0 ml-3">
                          {option === correctAnswer ? (
                            <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          ) : isSelected ? (
                            <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                              <X className="h-4 w-4" />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Premium Explanation Section */}
            {exercise.explanation && showResults && (
              <div className="mt-8 p-6 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-200/50 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-amber-800">Explanation</h4>
                </div>
                <div className="prose prose-base max-w-none prose-p:text-amber-700 prose-strong:text-amber-800 prose-em:text-amber-700">
                  <ReactMarkdown>{exercise.explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Premium Answer Result */}
            {showResults && (
              <div className="mt-8 text-center">
                <div className={cn(
                  "inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-lg font-semibold shadow-sm",
                  userAnswer === correctAnswer 
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                )}>
                  {userAnswer === correctAnswer ? (
                    <>
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      Correct Answer!
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                        <X className="h-3 w-3" />
                      </div>
                      Try Again Next Time
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'true_false':
        return (
          <div key={exercise.id} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start mb-6 sm:mb-8">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl mr-4 sm:mr-6 shadow-lg">
                {index + 1}
              </div>
              <div className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium flex-1">
                {mode === 'learn' && enableClickableText ? (
                  <ClickableText 
                    text={exercise.content.statement} 
                    testId={lessonId} 
                    userId={userId} 
                  />
                ) : (
                  <div className="prose prose-lg max-w-none prose-p:text-gray-800 prose-strong:text-gray-900 prose-em:text-gray-700">
                    <ReactMarkdown>{exercise.content.statement}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[true, false].map((option) => {
                const isSelected = userAnswer === option;
                const optionText = option ? 'True' : 'False';
                const iconText = option ? '✓' : '✗';
                
                return (
                  <button
                    key={option.toString()}
                    onClick={() => handleAnswerSelect(exercise.id, option)}
                    className={getOptionClass(exercise.id, option, exercise.content.correctAnswer, isSelected)}
                    disabled={showResults}
                  >
                    <div className="flex items-center w-full">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl mr-4 flex-shrink-0 transition-all duration-300 ${
                        showResults
                          ? option === exercise.content.correctAnswer
                            ? 'bg-green-200 text-green-800'
                            : isSelected
                            ? 'bg-red-200 text-red-800'
                            : 'bg-gray-200 text-gray-500'
                          : isSelected
                          ? 'bg-blue-200 text-blue-800'
                          : option ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {iconText}
                      </div>
                      <div className="flex-1 text-left font-semibold text-lg">
                        {optionText}
                      </div>
                      {showResults && (
                        <div className="flex-shrink-0 ml-3">
                          {option === exercise.content.correctAnswer ? (
                            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                          ) : isSelected ? (
                            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✗</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Show explanation */}
            {exercise.explanation && showResults && (
              <div className="mt-6 sm:mt-8 p-5 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-2xl shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">!</div>
                  <div className="text-base sm:text-lg font-semibold text-amber-800">Explanation</div>
                </div>
                <div className="prose prose-base max-w-none prose-p:text-amber-700 prose-strong:text-amber-800 prose-em:text-amber-700">
                  <ReactMarkdown>{exercise.explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Show answer result */}
            {showResults && (
              <div className="mt-6 sm:mt-8 text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-base sm:text-lg font-semibold ${
                  userAnswer === exercise.content.correctAnswer 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {userAnswer === exercise.content.correctAnswer ? (
                    <>
                      <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✓</div>
                      Correct!
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">✗</div>
                      Incorrect
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'fill_in_blank':
        return (
          <div key={exercise.id} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-start mb-6 sm:mb-8">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl mr-4 sm:mr-6 shadow-lg">
                {index + 1}
              </div>
              <div className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium flex-1">
                {mode === 'learn' && enableClickableText ? (
                  <ClickableText 
                    text={exercise.content.text} 
                    testId={lessonId} 
                    userId={userId} 
                  />
                ) : (
                  <div className="prose prose-lg max-w-none prose-p:text-gray-800 prose-strong:text-gray-900 prose-em:text-gray-700">
                    <ReactMarkdown>{exercise.content.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={userAnswer || ''}
                onChange={(e) => handleAnswerSelect(exercise.id, e.target.value)}
                disabled={showResults}
                placeholder="Type your answer here..."
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-lg font-medium transition-all duration-300 shadow-sm"
              />
              {showResults && (
                <div className={`p-4 rounded-xl border-2 ${
                  Array.isArray(exercise.content.answers) && 
                  exercise.content.answers.some((answer: string) => 
                    answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
                  ) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                      Array.isArray(exercise.content.answers) && 
                      exercise.content.answers.some((answer: string) => 
                        answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
                      ) ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {Array.isArray(exercise.content.answers) && 
                       exercise.content.answers.some((answer: string) => 
                         answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
                       ) ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        Array.isArray(exercise.content.answers) && 
                        exercise.content.answers.some((answer: string) => 
                          answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
                        ) ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {Array.isArray(exercise.content.answers) && 
                         exercise.content.answers.some((answer: string) => 
                           answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
                         ) ? 'Correct!' : 'Incorrect'}
                      </div>
                      {!Array.isArray(exercise.content.answers) || 
                       !exercise.content.answers.some((answer: string) => 
                         answer.toLowerCase().trim() === userAnswer?.toLowerCase().trim()
                       ) ? (
                        <div className="text-sm text-red-600 mt-1">
                          Possible answers: {Array.isArray(exercise.content.answers) ? exercise.content.answers.join(', ') : 'N/A'}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Show explanation */}
            {exercise.explanation && showResults && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                <div className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">Explanation:</div>
                <div className="prose prose-xs sm:prose-sm max-w-none prose-p:text-yellow-700 prose-strong:text-yellow-800 prose-em:text-yellow-700">
                  <ReactMarkdown>{exercise.explanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Show explanation */}
            {exercise.explanation && showResults && (
              <div className="mt-6 sm:mt-8 p-5 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-2xl shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">!</div>
                  <div className="text-base sm:text-lg font-semibold text-amber-800">Explanation</div>
                </div>
                <div className="prose prose-base max-w-none prose-p:text-amber-700 prose-strong:text-amber-800 prose-em:text-amber-700">
                  <ReactMarkdown>{exercise.explanation}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div key={exercise.id} className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600">Exercise type "{exercise.type}" not yet implemented.</p>
          </div>
        );
    }
  };

  // Show intro screen first
  if (showIntro) {
    return (
      <ReadingIntroScreen 
        onStart={() => setShowIntro(false)}
        title={title}
        exerciseCount={exercises.length}
        readingText={readingText}
        instructions={instructions}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="space-y-12">

        {/* Premium Reading Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className={cn(utilityClasses.displayText)}>
              Reading Comprehension
            </h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        {/* Premium Reading Text Container */}
        <div className={cn(
          utilityClasses.glassMorphism, 
          utilityClasses.premiumCard,
          "p-8 sm:p-12 bg-gradient-to-br from-slate-50/50 to-blue-50/30"
        )}>
          
          {/* Audio Player Section - Always show player */}
          <div className="mb-8">
            <div className={cn(
              utilityClasses.premiumCard,
              "p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/30 border border-green-200/50"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Read Aloud</h3>
              </div>
              
              {isLoadingAudio ? (
                <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-200/50 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                    <span className="text-lg font-semibold text-amber-800">Loading audio...</span>
                  </div>
                  <p className="text-amber-700">Please wait while we prepare the audio for this reading passage</p>
                </div>
              ) : audioError ? (
                <div className="bg-gradient-to-br from-red-50/50 to-pink-50/30 border border-red-200/50 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <VolumeX className="h-5 w-5 text-red-600" />
                    <span className="text-lg font-semibold text-red-800">Audio Error</span>
                  </div>
                  <p className="text-red-700 mb-4">{audioError}</p>
                  <motion.button
                    onClick={() => {
                      setAudioError('');
                      fetchOrGenerateAudio();
                    }}
                    className="bg-red-600 text-white font-medium py-2 px-4 rounded-xl hover:bg-red-700 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Again
                  </motion.button>
                </div>
              ) : audioUrl ? (
                <div className="bg-gradient-to-br from-white/80 to-green-50/20 border border-green-200 rounded-lg p-4 sm:p-6">
                  <audio
                    src={audioUrl}
                    controls
                    onPlay={() => handlePlayStateChange(true)}
                    onPause={() => handlePlayStateChange(false)}
                    className="w-full"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white/80 to-green-50/20 border border-green-200 rounded-lg p-4 sm:p-6">
                  {/* Progress bar placeholder */}
                  <div className="h-3 bg-gray-200 rounded-full mb-3 relative overflow-hidden">
                    <div className="h-full bg-gray-300 rounded-full absolute top-0 left-0 w-0" />
                  </div>
                  
                  {/* Time display placeholder */}
                  <div className="flex justify-between text-sm text-gray-400 font-medium mb-4">
                    <span>0:00</span>
                    <span>--:--</span>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Play button that fetches audio */}
                      <motion.button 
                        onClick={fetchOrGenerateAudio}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors shadow-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play size={20} className="ml-0.5" />
                      </motion.button>
                      
                      {/* Disabled buttons */}
                      <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 cursor-not-allowed bg-gray-100 border border-gray-300">
                        <RotateCcw size={16} />
                      </button>
                    </div>
                    
                    {/* Volume control placeholder */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button className="text-gray-400 p-2 rounded cursor-not-allowed">
                        <Volume2 size={18} />
                      </button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value="1"
                        disabled
                        className="w-16 sm:w-24 accent-gray-300 cursor-not-allowed opacity-50"
                      />
                      <div className="text-xs text-gray-400 font-medium w-8 text-center">
                        100%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-base sm:text-lg text-slate-800 leading-relaxed">
            <div className="prose prose-lg sm:prose-xl max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-em:text-gray-700 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-li:text-gray-800 prose-blockquote:text-gray-700 prose-blockquote:border-orange-300">
              <ReactMarkdown 
                components={{
                  p: ({ children }) => (
                    <p className="mb-4">
                      {mode === 'learn' && enableClickableText ? (
                        <ClickableText 
                          text={extractTextFromChildren(children)} 
                          testId={lessonId} 
                          userId={userId} 
                        />
                      ) : (
                        children
                      )}
                    </p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 text-gray-900">
                      {mode === 'learn' && enableClickableText ? (
                        <ClickableText 
                          text={children?.toString() || ''} 
                          testId={lessonId} 
                          userId={userId} 
                        />
                      ) : (
                        children
                      )}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mb-3 text-gray-900">
                      {mode === 'learn' && enableClickableText ? (
                        <ClickableText 
                          text={children?.toString() || ''} 
                          testId={lessonId} 
                          userId={userId} 
                        />
                      ) : (
                        children
                      )}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold mb-2 text-gray-900">
                      {mode === 'learn' && enableClickableText ? (
                        <ClickableText 
                          text={children?.toString() || ''} 
                          testId={lessonId} 
                          userId={userId} 
                        />
                      ) : (
                        children
                      )}
                    </h3>
                  ),
                }}
              >
                {readingText}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Premium Questions Section */}
        <div className="space-y-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className={cn(utilityClasses.displayText)}>Questions</h2>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-violet-600 mx-auto rounded-full shadow-sm"></div>
          </div>
          <div className="space-y-8">
            {exercises.map((exercise, index) => renderExercise(exercise, index))}
          </div>
        </div>

        {/* Premium Results Summary */}
        {showResults && (
          <div className={cn(
            utilityClasses.glassMorphism,
            utilityClasses.premiumCard,
            "p-8 sm:p-12 bg-gradient-to-br from-green-50/50 to-emerald-50/30"
          )}>
            <div className="text-center">
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h2 className={cn(utilityClasses.displayText, "text-slate-900")}>Your Results</h2>
              </div>
              
              <div className="relative inline-block mb-8">
                <div className={cn(
                  "w-40 h-40 sm:w-48 sm:h-48 rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden",
                  score.correct === score.total 
                    ? "bg-gradient-to-br from-emerald-500 to-green-600" 
                    : score.correct >= score.total * 0.7 
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
                      : "bg-gradient-to-br from-amber-500 to-orange-600"
                )}>
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                  <div className="text-center text-white relative z-10">
                    <div className="text-4xl sm:text-5xl font-bold mb-2">{score.correct}<span className="text-white/70">/{score.total}</span></div>
                    <div className="text-lg sm:text-xl font-medium opacity-90">
                      {Math.round((score.correct / score.total) * 100) || 0}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "text-2xl sm:text-3xl font-bold mb-4",
                score.correct === score.total 
                  ? "text-emerald-700" 
                  : score.correct >= score.total * 0.7 
                    ? "text-blue-700" 
                    : "text-amber-700"
              )}>
                {score.correct === score.total 
                  ? "🎉 Perfect Score!" 
                  : score.correct >= score.total * 0.7 
                    ? "👍 Well Done!" 
                    : "💪 Keep Practicing!"}
              </div>
              
              <p className="text-slate-600 text-lg">
                {score.correct === score.total 
                  ? "Excellent work! You've mastered this reading exercise." 
                  : score.correct >= score.total * 0.7 
                    ? "Great job! You have a good understanding of the text." 
                    : "Good effort! Review the explanations to improve your comprehension."}
              </p>
            </div>
          </div>
        )}

        {/* Premium Submit Section */}
        {!showResults && (
          <div className="text-center">
            {!hasAtLeastOneAnswer() && (
              <div className={cn(
                utilityClasses.premiumCard,
                "mb-8 p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/50"
              )}>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-lg font-medium text-amber-800">
                    Answer at least one question to submit
                  </p>
                </div>
              </div>
            )}
            
            <motion.button
              onClick={handleSubmit}
              disabled={!hasAtLeastOneAnswer()}
              className={cn(
                "inline-flex items-center justify-center font-semibold py-5 px-12 rounded-2xl shadow-lg transition-all duration-300 text-lg min-w-[280px] group relative overflow-hidden",
                hasAtLeastOneAnswer()
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl shadow-blue-500/25"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-slate-200/50"
              )}
              whileHover={hasAtLeastOneAnswer() ? { scale: 1.05 } : {}}
              whileTap={hasAtLeastOneAnswer() ? { scale: 0.95 } : {}}
            >
              {hasAtLeastOneAnswer() && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              )}
              
              <div className="flex items-center gap-3 relative">
                <CheckCircle className="h-6 w-6" />
                Submit Answers
              </div>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
