'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader } from '@/components/ui/loader';
import ClickableText from '@/components/ui/ClickableText';
import QuestionRenderer from './question-renderers/QuestionRenderer';
import { Headphones, Volume2, CheckCircle, Target, Play, FileText, Send, Trophy, RotateCcw, Zap, Brain, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

// Types matching the actual database structure
interface QuestionData {
  id: number;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  sample_answer: string;
  points: number;
}

interface ListeningExerciseData {
  id: number;
  course_name: string;
  chapter_id: string;
  exercise_id: string;
  audio_url: string;
  transcript: string;
  audio_title: string;
  questions: QuestionData[];
  exercise_type: string;
  task_id?: string;
}

// Premium Listening exercise intro screen component
function ListeningIntroScreen({ 
  onStart, 
  title,
  questionCount 
}: { 
  onStart: () => void; 
  title: string;
  questionCount: number;
}) {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      icon: Headphones,
      title: "Listen Actively",
      description: "Focus on the audio and listen for key information",
      gradientFrom: "from-blue-500",
      gradientTo: "to-indigo-600",
      bgColor: "from-blue-50/50 to-indigo-50/30",
      borderColor: "border-blue-200/50"
    },
    {
      icon: Volume2,
      title: "Play Multiple Times",
      description: "You can replay the audio as many times as needed",
      gradientFrom: "from-emerald-500",
      gradientTo: "to-green-600",
      bgColor: "from-emerald-50/50 to-green-50/30",
      borderColor: "border-emerald-200/50"
    },
    {
      icon: Target,
      title: "Answer Questions",
      description: "Use what you heard to answer the comprehension questions",
      gradientFrom: "from-purple-500",
      gradientTo: "to-violet-600",
      bgColor: "from-purple-50/50 to-violet-50/30",
      borderColor: "border-purple-200/50"
    },
    {
      icon: CheckCircle,
      title: "Check Transcript",
      description: "Review the transcript after answering to see what you missed",
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-600",
      bgColor: "from-amber-50/50 to-orange-50/30",
      borderColor: "border-amber-200/50"
    }
  ];

  // Cycle through tips automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const currentTipData = tips[currentTip];
  const TipIcon = currentTipData.icon;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
      <div className="w-full max-w-lg mx-auto">
      {/* Main Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <Headphones className="h-8 w-8 text-green-600" />
          Listening Exercise
        </h1>
      </div>
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="relative bg-green-600 p-6 rounded-full">
            <Headphones className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {title}
        </h2>
        
        <p className="text-gray-600 text-base mb-4">
          Listen to the audio and answer comprehension questions
        </p>
        
        <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
          <span className="text-green-700 font-semibold">{questionCount} questions</span>
          <span className="text-green-600">to answer</span>
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <motion.button
          onClick={onStart}
          className="w-full bg-green-600 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95 hover:bg-green-700"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Play className="h-6 w-6" />
            Start Listening Exercise
          </div>
        </motion.button>
        
        <p className="text-sm text-gray-500 mt-3">
          Make sure your audio is on and volume is comfortable
        </p>
      </div>
      </div>
    </div>
  );
}

interface ListeningExerciseComponentProps {
  taskId: string;
  userId: string;
  onComplete?: (data: {
    totalScore: number;
    maxScore: number;
    results: { questionNumber: number; selectedAnswer: string; isCorrect: boolean }[];
    audioPlayCount: number;
  }) => void;
  initialData?: {
    audio_url: string;
    transcript?: string;
    audio_title?: string;
    questions: any;
  } | null;
}

export default function ListeningExerciseComponent({
  taskId,
  userId,
  onComplete,
  initialData,
}: ListeningExerciseComponentProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [exerciseData, setExerciseData] = useState<ListeningExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ questionNumber: number; selectedAnswer: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  // Fetch exercise data from database
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        if (initialData) {
          // Use questionsData if available (from our new API), otherwise transform the raw questions
          const questions = initialData.questionsData || initialData.questions;
          let transformedQuestions: QuestionData[] = [];
          
          if (Array.isArray(questions) && questions.length > 0) {
            // Check if these are already properly formatted questions (from questionsData)
            if (questions[0]?.question && questions[0]?.type) {
              // These are already formatted questions from questionsData
              transformedQuestions = questions.map((q: any) => ({
                id: q.question_number || q.id,
                type: q.type,
                question: q.question,
                options: q.options || (q.type === 'true_false' ? ['true', 'false'] : []),
                correct_answer: q.correct_answer,
                sample_answer: q.explanation || '',
                points: q.points || 1,
                // Include specialized properties for complex question types
                sentences: q.sentences,
                pairs: q.pairs,
                blanks: q.blanks,
              }));
            } else {
              // These need transformation (legacy format)
              transformedQuestions = transformQuestions(questions);
            }
          }
          
          const parsedData: any = {
            id: 0,
            course_name: '',
            chapter_id: '',
            exercise_id: taskId,
            audio_title: initialData.audio_title || 'Listening Exercise',
            audio_url: initialData.audio_url,
            transcript: initialData.transcript || null,
            questions: transformedQuestions,
            exercise_type: 'listening_task',
            task_id: taskId
          };
          setExerciseData(parsedData);
        } else {
          const { data, error } = await supabase
            .from('listening_exercises')
            .select('*')
            .eq('task_id', taskId)
            .single();
          if (error) throw error;
          let parsedQuestions = typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions;
          if (parsedQuestions?.message_groups) {
            const extractedQuestions: QuestionData[] = [];
            parsedQuestions.message_groups.forEach((group: any) => {
              group.questions_in_group?.forEach((q: any) => {
                const correctOption = q.options?.find((opt: any) => opt.is_correct);
                extractedQuestions.push({
                  id: q.question_number,
                  type: 'multiple_choice',
                  question: q.question_stem,
                  options: q.options?.map((opt: any) => opt.text_caption) || [],
                  correct_answer: correctOption?.text_caption || '',
                  sample_answer: correctOption?.explanation || '',
                  points: 1
                });
              });
            });
            parsedQuestions = extractedQuestions;
          }
          const parsedData = { ...data, questions: parsedQuestions };
          setExerciseData(parsedData);
        }
      } catch (err) {
        console.error('Error fetching listening exercise data:', err);
        setError('Failed to load listening exercise');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [taskId, initialData]);

  function transformQuestions(questionsResp: any): QuestionData[] {
    if (!questionsResp) return [];
    const out: QuestionData[] = [];
    if (Array.isArray(questionsResp.multiple_choice)) {
      questionsResp.multiple_choice.forEach((q: any, idx: number) => {
        const correct = q.options?.find((o: any) => o.is_correct)?.option || '';
        out.push({
          id: out.length + 1,
          type: 'multiple_choice',
          question: q.question,
          options: (q.options || []).map((o: any) => o.option),
          correct_answer: correct,
          sample_answer: q.explanation || '',
          points: q.points || 1
        });
      });
    }
    if (Array.isArray(questionsResp.true_false)) {
      questionsResp.true_false.forEach((q: any) => {
        out.push({
          id: out.length + 1,
          type: 'true_false',
          question: q.question,
          options: ['true', 'false'],
          correct_answer: q.correct_answer,
          sample_answer: q.explanation || '',
          points: q.points || 1
        });
      });
    }
    if (Array.isArray(questionsResp.short_answer)) {
      questionsResp.short_answer.forEach((q: any) => {
        out.push({
          id: out.length + 1,
          type: 'short_answer',
          question: q.question,
          options: [],
          correct_answer: q.correct_answer,
          sample_answer: q.explanation || '',
          points: q.points || 1
        });
      });
    }
    return out;
  }

  // Handle when audio starts playing for the first time
  useEffect(() => {
    if (isAudioPlaying && !hasPlayedOnce) {
      setHasPlayedOnce(true);
      setAudioPlayCount(prev => prev + 1);
    }
  }, [isAudioPlaying, hasPlayedOnce]);

  const handleAnswerSelect = (questionId: number, selectedAnswer: string) => {
    setAnswers(prev => [
      ...prev.filter(a => a.questionNumber !== questionId),
      { questionNumber: questionId, selectedAnswer }
    ]);
  };

  const getSelectedAnswer = (questionId: number) => {
    const answer = answers.find(a => a.questionNumber === questionId);
    return answer?.selectedAnswer;
  };

  // Function to format answer display based on question type
  const formatAnswerDisplay = (answer: string, questionType: string): string => {
    if (!answer) return '';
    
    // Special handling for matching exercises
    if (questionType === 'match_the_following') {
      try {
        const parsed = JSON.parse(answer);
        // Format as readable pairs
        return Object.entries(parsed)
          .map(([left, right]) => `${left} → ${right}`)
          .join(', ');
      } catch {
        return answer; // fallback to original if not valid JSON
      }
    }
    
    // Special handling for true/false
    if (questionType === 'true_false' && (answer === 'true' || answer === 'false')) {
      return answer === 'true' ? 'True' : 'False';
    }
    
    return answer;
  };

  const handleSubmit = async () => {
    setShowResults(true);
    
    if (!exerciseData) return;

    // Calculate results
    const results = answers.map(answer => {
      const question = exerciseData.questions.find(q => q.id === answer.questionNumber);
      const isCorrect = question?.correct_answer === answer.selectedAnswer;
      
      return {
        questionNumber: answer.questionNumber,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: isCorrect || false
      };
    });

    const totalScore = results.filter(r => r.isCorrect).length;
    const maxScore = exerciseData.questions.length;

    // Save listening results to database using new API
    try {
      console.log('[ListeningExercise] Saving listening results...');
      
      const listeningResultData = {
        taskId: taskId,
        exerciseId: exerciseData.exercise_id,
        audioTitle: exerciseData.audio_title,
        audioUrl: exerciseData.audio_url,
        score: totalScore,
        maxScore: maxScore,
        audioPlayCount: audioPlayCount,
        timeTakenSeconds: 0, // Not tracking time in this version
        questionResults: results,
        transcriptViewed: showTranscript
      };
      
      console.log('[ListeningExercise] Listening result data:', listeningResultData);
      
      const response = await fetch('/api/listening/save-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listeningResultData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[ListeningExercise] Listening results saved successfully:', result);
      } else {
        const errorData = await response.text();
        console.error('[ListeningExercise] Failed to save listening results:', errorData);
      }

      // Legacy save to listening_scores for backward compatibility
      const { error } = await supabase
        .from('listening_scores')
        .insert({
          user_id: userId,
          exercise_id: taskId,
          score: totalScore,
          max_score: maxScore,
          audio_play_count: audioPlayCount,
          completed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving legacy listening score:', error);
      }
    } catch (error) {
      console.error('Error saving listening results:', error);
    }

    // Notify parent component
    if (onComplete) {
      onComplete({
        totalScore,
        maxScore,
        results,
        audioPlayCount,
      });
    }
  };

  const hasAnswers = answers.length > 0;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className={cn(utilityClasses.premiumCard, utilityClasses.glassMorphism, "max-w-2xl mx-auto p-8")}>
        <div className={cn(
          utilityClasses.premiumCard,
          "p-6 bg-gradient-to-br from-red-50/50 to-pink-50/30 border border-red-200/50 text-center"
        )}>
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Exercise</h3>
          <p className="text-red-700">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  if (!exerciseData) {
    return (
      <div className={cn(utilityClasses.premiumCard, utilityClasses.glassMorphism, "max-w-2xl mx-auto p-8")}>
        <div className={cn(
          utilityClasses.premiumCard,
          "p-6 bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-200/50 text-center"
        )}>
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Exercise Not Found</h3>
          <p className="text-amber-700">No listening exercise found for this task.</p>
        </div>
      </div>
    );
  }

  // Show intro screen first
  if (showIntro) {
    return (
      <ListeningIntroScreen 
        onStart={() => setShowIntro(false)}
        title={exerciseData?.audio_title || "Listening Exercise"}
        questionCount={exerciseData?.questions?.length || 0}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center justify-center gap-3 mb-4">
          <Headphones className="h-10 w-10 text-blue-600" />
          {exerciseData.audio_title}
        </h1>
        <p className="text-gray-600 text-lg">Listen carefully and demonstrate your comprehension</p>
      </div>
      
      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructions</h3>
            <p className="text-base text-gray-600 mb-2">Listen to the audio carefully and answer the comprehension questions below.</p>
            <p className="text-sm text-gray-500 italic">💡 Click on any words in the transcript for explanations and add them to your vocabulary list.</p>
          </div>
        </div>
      </div>
      
      {/* Audio Player Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Audio player temporarily disabled - component was removed */}
          <audio 
            controls 
            src={exerciseData.audio_url}
            className="w-full"
            onPlay={() => setIsAudioPlaying(true)}
            onPause={() => setIsAudioPlaying(false)}
          />
          {exerciseData.transcript && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </button>
          )}
        </div>
      </div>
        
      {/* Transcript Section */}
      {exerciseData.transcript && showTranscript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden mb-6"
        >
          <div className="border-b border-gray-200 px-4 py-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Audio Transcript</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-slate-800 leading-relaxed space-y-6">
                {(() => {
                  try {
                    // Try to parse the transcript as JSON
                    const transcriptData = JSON.parse(exerciseData.transcript);
                    if (Array.isArray(transcriptData)) {
                      return transcriptData.map((item, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l-4 border-blue-300 pl-6 py-3 bg-blue-50 rounded-r-lg"
                        >
                          <div className="flex items-center mb-3">
                            <div className="w-3 h-3 bg-slate-500 rounded-full mr-3"></div>
                            <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
                              {item.speaker}
                            </div>
                          </div>
                          <div className="text-slate-800 font-medium leading-relaxed text-lg">
                            <ClickableText 
                              text={item.text} 
                              testId={taskId} 
                              userId={userId} 
                            />
                          </div>
                        </motion.div>
                      ));
                    }
                  } catch (e) {
                    // If not JSON, display as plain text
                    console.log('Transcript is not JSON, displaying as plain text');
                  }
                  
                  // Fallback: display as plain text
                  return (
                    <div className="prose prose-lg prose-slate max-w-none">
                      <ClickableText 
                        text={exerciseData.transcript} 
                        testId={taskId} 
                        userId={userId} 
                      />
                    </div>
                  );
                })()}
              </div>
              
              {/* Transcript helper text */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Zap className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    Click on any word to get definitions and add to your vocabulary
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
        
      {/* Questions Section */}
      <div className="space-y-4">
        
        <div className="space-y-6">
          {exerciseData.questions?.map((question, index) => (
            <motion.div 
              key={question.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center font-bold text-sm">
                  <span className="text-blue-600">{index + 1}</span>
                </div>
                {/* Only show question text if it's not fill_in_the_blanks 
                    (fill_in_the_blanks renderer handles its own question display) */}
                {question.type !== 'fill_in_the_blanks' && (
                  <div className="text-slate-800 leading-relaxed font-medium flex-1 text-xl">
                    <ClickableText 
                      text={question.question} 
                      testId={taskId} 
                      userId={userId} 
                    />
                  </div>
                )}
              </div>
              
              <QuestionRenderer
                question={question}
                selectedAnswer={getSelectedAnswer(question.id)}
                onAnswerChange={handleAnswerSelect}
                showResults={showResults}
                taskId={taskId}
                userId={userId}
              />
              
              {showResults && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-base font-semibold text-gray-800">Answer Feedback</span>
                  </div>
                  <div className="space-y-2 text-base">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Correct answer:</span>
                      <span className="text-gray-800 font-semibold">
                        {formatAnswerDisplay(question.correct_answer, question.type)}
                      </span>
                      {question.points && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                          {question.points} {question.points === 1 ? 'point' : 'points'}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const selectedAnswer = getSelectedAnswer(question.id);
                      const isCorrect = selectedAnswer === question.correct_answer;
                      
                      // Only show explanation for incorrect answers, but skip for matching and sentence reordering
                      if (!isCorrect && question.type !== 'match_the_following' && question.type !== 'sentence_reordering' && question.type !== 'fill_in_the_blanks') {
                        const displayCorrect = formatAnswerDisplay(question.correct_answer, question.type);
                        const displaySelected = formatAnswerDisplay(selectedAnswer || '', question.type);
                        
                        return (
                          <div className="text-gray-700 leading-relaxed text-base">
                            <span className="font-medium">Explanation:</span> {
                              selectedAnswer
                                ? `Your answer "${displaySelected}" was incorrect. The correct answer is "${displayCorrect}".`
                                : `You didn't answer this question. The correct answer is "${displayCorrect}".`
                            }
                            {question.sample_answer && (
                              <div className="mt-2 text-gray-600">
                                {question.sample_answer}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
          
        {/* Submit Button */}
        {!showResults && (
          <div className="text-center space-y-4">
            {!hasAnswers && (
              <div className="p-4 bg-white border border-gray-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-base font-semibold text-gray-800">Ready to Submit?</span>
                </div>
                <p className="text-base text-gray-600">
                  Answer at least one question to submit your responses
                </p>
              </div>
            )}
            
            <motion.button
              onClick={handleSubmit}
              disabled={!hasAnswers}
              className={cn(
                "w-full bg-blue-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 flex items-center justify-center gap-3",
                hasAnswers
                  ? 'hover:bg-blue-700 active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
              whileHover={hasAnswers ? { scale: 1.02 } : {}}
              whileTap={hasAnswers ? { scale: 0.98 } : {}}
            >
              <Send className="h-5 w-5" />
              Submit All Answers
            </motion.button>
          </div>
        )}

        {/* Results Summary */}
        {showResults && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center"
          >
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-slate-900">Exercise Complete!</h3>
                <p className="text-slate-600">Well done on your listening comprehension</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-primary/20 shadow-sm">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {answers.filter(answer => {
                    const question = exerciseData.questions.find(q => q.id === answer.questionNumber);
                    return question?.correct_answer === answer.selectedAnswer;
                  }).length}
                </div>
                <div className="text-sm font-medium text-slate-600">Correct</div>
              </div>
              
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-primary/20 shadow-sm">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {exerciseData.questions.length}
                </div>
                <div className="text-sm font-medium text-slate-600">Total</div>
              </div>
              
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-primary/20 shadow-sm">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {Math.round((answers.filter(answer => {
                    const question = exerciseData.questions.find(q => q.id === answer.questionNumber);
                    return question?.correct_answer === answer.selectedAnswer;
                  }).length / exerciseData.questions.length) * 100)}%
                </div>
                <div className="text-sm font-medium text-slate-600">Score</div>
              </div>
              
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-primary/20 shadow-sm">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {audioPlayCount}
                </div>
                <div className="text-sm font-medium text-slate-600">Audio Plays</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
