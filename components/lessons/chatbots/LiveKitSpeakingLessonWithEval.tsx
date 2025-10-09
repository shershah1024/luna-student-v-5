'use client';

import React, { useState, useEffect } from 'react';
import { App } from '@/components/livekit/app';
import { APP_CONFIG_DEFAULTS } from '@/livekit-app-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, Loader2, MessageSquare, CheckCircle, XCircle, AlertCircle, Mic, Brain, HeadphonesIcon, Globe, Volume2, Lightbulb } from 'lucide-react';

interface LiveKitSpeakingLessonWithEvalProps {
  taskId: string;
  courseId: string;
  onComplete?: () => void;
  userId: string;
  exerciseData?: {
    course_name: string;
    chapter_id: string;
    exercise_id: string;
    exercise_objective?: string;
    exercise_type: string;
    chapter_title?: string;
    chapter_theme?: string;
    lesson_name?: string;
  };
  speakingExerciseData?: {
    task_id: string;
    bot_instruction: string;  // This will be sent as 'instructions' to LiveKit
    course: string;
    // UI display fields (not sent to LiveKit)
    user_instruction: string;
    lesson_title: string;
    topic: string;
    level: string;
    tips: string[];
  };
  onRoomReady?: (room: any) => void;
  shouldBlockStart?: boolean;
  connectionHealth?: any;
}

interface EvaluationData {
  task_completion: {
    completed: boolean;
    requirements_met: string[];
    requirements_missed: string[];
    completion_percentage: number;
    explanation: string;
  };
  grammar_vocabulary: {
    score: number;
    grammar_strengths: string[];
    grammar_errors: (string | {
      error: string;
      correction: string;
      grammar_category?: string;
      severity?: string;
      explanation: string;
    })[];
    vocabulary_appropriate: string[];
    vocabulary_incorrect: string[];
    level_appropriateness: string;
    explanation: string;
  };
  communication_effectiveness: {
    score: number;
    clarity_of_message: string;
    interaction_quality: string;
    strengths: string[];
    areas_for_improvement: string[];
    explanation: string;
  };
  total_score: number;
  max_score: number;
  percentage: number;
  overall_feedback: string;
  level_assessment: string;
}

// Elaborate Evaluation Animation Component
function SpeakingEvaluationAnimation({ conversationLength }: { conversationLength: number }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const evaluationSteps = [
    { icon: HeadphonesIcon, text: "Listening to your conversation...", color: "text-blue-600" },
    { icon: Brain, text: "Analyzing speaking patterns...", color: "text-purple-600" },
    { icon: Globe, text: "Checking German language usage...", color: "text-green-600" },
    { icon: MessageSquare, text: "Evaluating communication flow...", color: "text-orange-600" },
    { icon: Award, text: "Calculating your speaking score...", color: "text-red-600" }
  ];

  const speakingTips = [
    "🎯 Clear pronunciation helps native speakers understand you better",
    "💬 Use filler words like 'äh', 'also', 'ja' to sound more natural",
    "🗣️ Don't be afraid to ask 'Wie sagt man...?' when stuck",
    "✨ Short, simple sentences are perfect for A1 level",
    "🌟 Asking questions shows active participation in conversation",
    "💡 Using gestures and context helps communicate your ideas"
  ];

  const encouragements = [
    "Reviewing your German vocabulary usage...",
    "Checking how well you completed the task...",
    "Analyzing your conversation flow and responses...",
    "Looking for communication strengths..."
  ];

  // Cycle through evaluation steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % evaluationSteps.length);
    }, 2500);
    return () => clearInterval(stepInterval);
  }, []);

  // Cycle through tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % speakingTips.length);
    }, 4000);
    return () => clearInterval(tipInterval);
  }, []);

  // Typing animation for encouragement text
  useEffect(() => {
    const currentEncouragement = encouragements[currentStep % encouragements.length];
    let i = 0;
    setTypedText('');
    setIsTyping(true);
    
    const typingInterval = setInterval(() => {
      if (i < currentEncouragement.length) {
        setTypedText(currentEncouragement.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 40);

    return () => clearInterval(typingInterval);
  }, [currentStep]);

  const CurrentIcon = evaluationSteps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[150] bg-gradient-to-br from-blue-50 via-white to-emerald-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          {/* Main evaluation status with animated icon */}
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white p-6 rounded-full shadow-xl">
                <CurrentIcon className={`h-12 w-12 ${evaluationSteps[currentStep].color} animate-pulse`} />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Evaluating Your Speaking
            </h2>
            
            <div className="h-10 flex items-center justify-center">
              <p className={`text-xl ${evaluationSteps[currentStep].color} transition-all duration-500 font-medium`}>
                {evaluationSteps[currentStep].text}
              </p>
            </div>
          </div>

          {/* Multi-stage progress bar */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-3">
              {evaluationSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
                      ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse' : 'bg-gray-200'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>
                          {step.text.replace('...', '')}
                        </span>
                        {isCompleted && (
                          <span className="text-xs text-green-600 font-medium">Complete</span>
                        )}
                      </div>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full
                            ${isCompleted ? 'bg-green-500 w-full' : isCurrent ? 'bg-gradient-to-r from-blue-500 to-emerald-500 w-1/2 animate-pulse' : 'w-0'}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis Card with typing effect */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <Brain className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-800 mb-2 text-lg">AI Language Analysis</h3>
                <p className="text-purple-700 font-medium">
                  {typedText}
                  {isTyping && <span className="animate-pulse text-purple-500 ml-1">|</span>}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
                  <Volume2 className="w-4 h-4" />
                  <span>Processing your conversation...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Speaking tip card with rotating content */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100 shadow-lg transform hover:scale-[1.02] transition-transform">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm animate-bounce">
                <Lightbulb className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-800 mb-2">Speaking Tip</h3>
                <p className="text-emerald-700 transition-all duration-500 min-h-[48px]">
                  {speakingTips[currentTip]}
                </p>
              </div>
            </div>
          </div>

          {/* Fun facts or stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-100">
              <div className="text-2xl font-bold text-blue-600">
                <MessageSquare className="w-8 h-8 mx-auto text-blue-600" />
              </div>
              <div className="text-xs text-gray-600 mt-1">Conversation</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-100">
              <div className="text-2xl font-bold text-emerald-600">A1</div>
              <div className="text-xs text-gray-600 mt-1">Target Level</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-md border border-gray-100">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor((currentStep + 1) / evaluationSteps.length * 100)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">Processing</div>
            </div>
          </div>

          {/* Motivational message */}
          <div className="text-center text-gray-600">
            <p className="text-sm">
              ✨ Your speaking practice is being carefully evaluated to help you improve
            </p>
            <p className="text-xs mt-2 text-gray-500">
              This detailed analysis usually takes 15-30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveKitSpeakingLessonWithEval({
  taskId,
  courseId,
  onComplete,
  userId,
  exerciseData,
  speakingExerciseData,
  onRoomReady,
  shouldBlockStart,
  connectionHealth
}: LiveKitSpeakingLessonWithEvalProps) {
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showMinExchangesHint, setShowMinExchangesHint] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [roomInstance, setRoomInstance] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);

  // Configure the LiveKit app for this lesson
  const appConfig = {
    ...APP_CONFIG_DEFAULTS,
    startButtonText: "Start Speaking",
  };

  const handleEvaluateConversation = async () => {
    setIsEvaluating(true);
    
    // End the LiveKit session immediately when evaluation starts
    setSessionEnded(true);
    if (roomInstance) {
      roomInstance.disconnect();
    }
    
    try {
      // First, fetch the conversation history from speaking_log
      const historyResponse = await fetch(`/api/speaking-log?taskId=${taskId}&userId=${userId}`);
      
      if (!historyResponse.ok) {
        throw new Error('Failed to fetch conversation history');
      }
      
      const { messages } = await historyResponse.json();
      
      // Store messages for the animation
      setConversationMessages(messages);
      
      // Check if we have enough conversation (at least 10 messages)
      if (messages.length < 10) {
        setShowMinExchangesHint(true);
        setTimeout(() => setShowMinExchangesHint(false), 3000);
        setIsEvaluating(false);
        return;
      }
      
      // Format conversation for evaluation
      const conversationHistory = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.parts?.[0]?.text || ''
      }));
      
      // Get task instructions from exerciseData
      const taskInstructions = exerciseData?.exercise_objective || 
                              'Practice speaking German in a conversational setting';
      
      // Call the new lesson-speaking-evaluation API
      const response = await fetch('/api/lesson-speaking-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          conversation_history: conversationHistory,
          task_instructions: taskInstructions,
          course_name: exerciseData?.course_name || 'telc_a1'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to evaluate conversation');
      }
      
      const evaluation = await response.json();
      
      // Map the response to match our interface (handle both old and new API response formats)
      const mappedEvaluation: EvaluationData = {
        ...evaluation,
        grammar_vocabulary: {
          ...evaluation.grammar_vocabulary,
          grammar_errors: evaluation.grammar_vocabulary.grammar_errors_list || evaluation.grammar_vocabulary.grammar_errors || []
        }
      };
      
      setEvaluationData(mappedEvaluation);
      setShowEvaluation(true);
      
      // Mark lesson as complete after evaluation
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error evaluating conversation:', error);
      alert('Failed to evaluate conversation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Evaluation Results Component
  const EvaluationResults = () => {
    if (!evaluationData) return null;

    const getScoreColor = (score: number, maxScore: number) => {
      const percentage = (score / maxScore) * 100;
      if (percentage >= 80) return 'text-green-600';
      if (percentage >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6 pb-8">
          {/* Header */}
          <div className="text-center pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Speaking Evaluation Results</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-bold">
                <span className={getScoreColor(evaluationData.total_score, evaluationData.max_score)}>
                  {evaluationData.total_score}
                </span>
                <span className="text-gray-500 text-xl">/{evaluationData.max_score}</span>
              </div>
              <div className="text-lg text-gray-600">
                ({evaluationData.percentage}%)
              </div>
            </div>
          </div>

          {/* Task Completion */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {evaluationData.task_completion.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Task Completion ({evaluationData.task_completion.completion_percentage}%)
            </h3>
            
            {evaluationData.task_completion.requirements_met.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Requirements Met:</p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {evaluationData.task_completion.requirements_met.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {evaluationData.task_completion.requirements_missed.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Requirements Missed:</p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {evaluationData.task_completion.requirements_missed.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-sm text-gray-600">{evaluationData.task_completion.explanation}</p>
            </div>
          </Card>

          {/* Grammar & Vocabulary */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              Grammar & Vocabulary: 
              <span className={`ml-2 ${getScoreColor(evaluationData.grammar_vocabulary.score, 5)}`}>
                {evaluationData.grammar_vocabulary.score}/5
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluationData.grammar_vocabulary.grammar_strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Grammar Strengths:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {evaluationData.grammar_vocabulary.grammar_strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {evaluationData.grammar_vocabulary.grammar_errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-2">Grammar Corrections:</p>
                  <div className="space-y-2">
                    {evaluationData.grammar_vocabulary.grammar_errors.map((err, i) => {
                      // Handle both string and object formats for backward compatibility
                      if (typeof err === 'string') {
                        return (
                          <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{err}</p>
                          </div>
                        );
                      }
                      // New format with error details - Chatbot style
                      return (
                        <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              err.severity === 'HIGH' ? 'bg-red-600 text-white' :
                              err.severity === 'MEDIUM' ? 'bg-orange-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}>
                              {err.severity || 'MEDIUM'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="line-through text-red-600">{err.error}</span>
                                {' → '}
                                <span className="font-medium text-green-600">{err.correction}</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">{err.explanation}</p>
                              {err.grammar_category && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Category: {err.grammar_category.replace(/_/g, ' ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {evaluationData.grammar_vocabulary.vocabulary_appropriate?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Appropriate Vocabulary:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {evaluationData.grammar_vocabulary.vocabulary_appropriate.map((word, i) => (
                      <li key={i}>{word}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {evaluationData.grammar_vocabulary.vocabulary_incorrect?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">Vocabulary Issues:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {evaluationData.grammar_vocabulary.vocabulary_incorrect.map((word, i) => (
                      <li key={i}>{word}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {evaluationData.grammar_vocabulary.level_appropriateness && (
              <div className="mt-3">
                <p className="text-sm">
                  <span className="font-medium">Level Assessment:</span> {evaluationData.grammar_vocabulary.level_appropriateness}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-600">{evaluationData.grammar_vocabulary.explanation}</p>
            </div>
          </Card>

          {/* Communication Effectiveness */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="space-y-3">
            <h3 className="font-semibold text-lg">
              Communication Effectiveness: 
              <span className={`ml-2 ${getScoreColor(evaluationData.communication_effectiveness.score, 5)}`}>
                {evaluationData.communication_effectiveness.score}/5
              </span>
            </h3>
            
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Clarity:</span> {evaluationData.communication_effectiveness.clarity_of_message}
              </p>
              <p className="text-sm">
                <span className="font-medium">Interaction:</span> {evaluationData.communication_effectiveness.interaction_quality}
              </p>
            </div>
            
            {evaluationData.communication_effectiveness.strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {evaluationData.communication_effectiveness.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-sm text-gray-600">{evaluationData.communication_effectiveness.explanation}</p>
            </div>
          </Card>

          {/* Overall Feedback */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm border border-purple-200">
            <div className="space-y-3">
            <h3 className="font-semibold text-lg">Overall Feedback</h3>
            <p className="text-sm text-gray-700">{evaluationData.overall_feedback}</p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Level Assessment:</span> {evaluationData.level_assessment}
            </p>
            </div>
          </Card>

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => {
                // Navigate to units page using chapter_id
                const unitId = exerciseData?.chapter_id;
                if (unitId) {
                  window.location.href = `/units/${unitId}`;
                } else {
                  // Fallback to home page if no unit ID
                  window.location.href = '/';
                }
                if (onComplete) {
                  onComplete();
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Close & Return to Unit
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Handle session start callback from App component
  const handleSessionStart = () => {
    setSessionStarted(true);
  };
  
  // Handle message count updates from the LiveKit session
  const handleMessageCountChange = (count: number) => {
    setMessageCount(count);
  };

  // Block starting if connection is poor
  if (shouldBlockStart && !sessionStarted) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="border-orange-200 p-8 text-center shadow-lg max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-orange-600 mb-4" />
          <h3 className="text-xl font-semibold text-orange-800 mb-2">
            Poor Connection Detected
          </h3>
          <p className="text-orange-700 mb-4">
            {connectionHealth?.message || 'Your internet connection is not stable enough for speaking lessons.'}
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Please check your internet connection and try again. Speaking lessons require a stable connection for the best experience.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Only show App if session hasn't ended and not showing evaluation */}
      {!sessionEnded && !showEvaluation && (
        <App
          appConfig={appConfig}
          onComplete={onComplete}
          onMessageCountChange={handleMessageCountChange}
          lessonData={speakingExerciseData || (exerciseData ? {
            // Fallback to basic exercise data if speaking data not available
            chapter_title: exerciseData.chapter_title,
            exercise_objective: exerciseData.exercise_objective,
            chapter_theme: exerciseData.chapter_theme,
            lesson_name: exerciseData.lesson_name
          } : undefined)}
          taskId={taskId}
          onSessionStart={handleSessionStart}
          onRoomReady={(room: any) => {
            setRoomInstance(room);
            onRoomReady?.(room);
          }}
        />
      )}
      
      {/* End and Evaluate Button - only show after session starts and 5+ messages, hide when evaluating or showing evaluation */}
      {sessionStarted && messageCount >= 5 && !evaluationData && !isEvaluating && !showEvaluation && (
        <div className="fixed bottom-32 right-8 z-[100]">
          {/* Hint message */}
          {showMinExchangesHint && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm animate-fade-in mb-2">
              💡 Please have more conversation before evaluation (minimum 10 exchanges)
            </div>
          )}
          
          <Button
            onClick={handleEvaluateConversation}
            disabled={messageCount < 10}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-2 transition-all duration-200 font-semibold text-base border-2 border-purple-500 hover:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
          >
            <Award className="h-4 w-4" />
            End and Evaluate
          </Button>
        </div>
      )}
      
      {/* Evaluation Animation Screen - shows while evaluating */}
      {isEvaluating && !showEvaluation && (
        <SpeakingEvaluationAnimation conversationLength={conversationMessages.length} />
      )}
      
      {/* Evaluation Results Screen - replaces conversation view */}
      {showEvaluation && (
        <div className="h-full overflow-y-auto">
          <EvaluationResults />
        </div>
      )}
    </div>
  );
}