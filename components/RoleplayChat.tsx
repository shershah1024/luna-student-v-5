'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Play, MessageSquare, Send, Award, Star, TrendingUp, BookOpen, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SpecialCharacterToolbar } from '@/components/SpecialCharacterToolbar';


// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%] rounded-lg px-5 py-4 bg-[#EFEAE6] text-[#2D3748]">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

// Chatbot intro screen component
function ChatbotIntroScreen({
  onStart,
  exerciseData
}: {
  onStart: () => void;
  exerciseData?: any;
}) {
  const getLessonContent = () => {
    if (!exerciseData) {
      return {
        objective: "Interactive conversation practice"
      };
    }

    const objective = exerciseData.exercise_objective ||
                     exerciseData.objective ||
                     exerciseData.description ||
                     "Interactive conversation practice";

    return { objective };
  };

  const { objective } = getLessonContent();
  const topic = exerciseData?.topic || exerciseData?.chapter_theme || 'Conversation';
  const isDebate = exerciseData?.assignment_type === 'debate' || exerciseData?.exercise_type === 'debate';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
      <div className="w-full max-w-lg mx-auto">
      {/* Main Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          {isDebate ? 'Debate Practice' : 'Conversation Practice'}
        </h1>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-gray-600 text-base mb-4">
          {topic}
        </p>
        <p className="text-gray-500 text-sm">
          {objective}
        </p>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="w-full bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
        >
          <div className="flex items-center justify-center gap-3">
            <Play className="h-6 w-6" />
            Start Conversation
          </div>
        </button>

        <p className="text-sm text-gray-500 mt-3">
          Practice through natural conversation
        </p>
      </div>
      </div>
    </div>
  );
}

// Props interface for the RoleplayChat component
export interface RoleplayChatProps {
  taskId: string;
  userId?: string;
  exerciseData?: any;
  apiEndpoint?: string;
  onConversationComplete?: () => void;
  className?: string;
  disableIntroScreen?: boolean;
}

// Evaluation feedback display component
function EvaluationFeedback({
  evaluation,
  onClose,
  exerciseData
}: {
  evaluation: any;
  onClose: () => void;
  exerciseData?: any;
}) {
  const router = useRouter();

  const handleClose = () => {
    // Just close the evaluation view
    onClose();
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Conversation Evaluation</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Completion Status */}
          {evaluation.task_completion && (
            <div className={`rounded-xl p-5 ${evaluation.task_completion.completed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className={`h-5 w-5 ${evaluation.task_completion.completed ? 'text-green-600' : 'text-yellow-600'}`} />
                <h4 className="text-lg font-semibold">Task Completion</h4>
                <span className={`ml-auto text-lg font-bold ${evaluation.task_completion.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                  {evaluation.task_completion.completion_percentage}%
                </span>
              </div>

              {evaluation.task_completion.requirements_met?.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-green-700 mb-1">✓ Requirements Met:</p>
                  <ul className="text-sm text-green-600 space-y-1">
                    {evaluation.task_completion.requirements_met.map((req: string, idx: number) => (
                      <li key={idx}>• {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.task_completion.requirements_missed?.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-yellow-700 mb-1">⚠ Requirements Missed:</p>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    {evaluation.task_completion.requirements_missed.map((req: string, idx: number) => (
                      <li key={idx}>• {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white/50 rounded-lg p-2 mt-2">
                <p className="text-sm text-gray-700">{evaluation.task_completion.explanation}</p>
              </div>
            </div>
          )}

          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Language Score</h3>
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.total_score, 10)}`}>
                {evaluation.total_score}/10
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(evaluation.total_score, 10)}`}
                style={{ width: `${evaluation.percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">{evaluation.percentage}% Language Proficiency</p>
          </div>

          {/* Grammar Score */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold">Grammar Assessment</h4>
              <span className={`ml-auto text-xl font-bold ${getScoreColor(evaluation.grammar_score, 5)}`}>
                {evaluation.grammar_score}/5
              </span>
            </div>

            {evaluation.grammar_feedback && (
              <div className="space-y-3">
                {evaluation.grammar_feedback.strengths?.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="font-medium text-green-800 mb-1">✓ Strengths:</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {evaluation.grammar_feedback.strengths.map((strength: string, idx: number) => (
                        <li key={idx}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.grammar_feedback.areas_for_improvement?.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="font-medium text-yellow-800 mb-1">⚡ Areas for Improvement:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {evaluation.grammar_feedback.areas_for_improvement.map((area: string, idx: number) => (
                        <li key={idx}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.grammar_feedback.grammar_errors?.length > 0 && (
                  <div>
                    <p className="font-medium text-red-800 mb-2">✗ Grammar Corrections:</p>
                    <div className="space-y-2">
                      {evaluation.grammar_feedback.grammar_errors.map((err: any, idx: number) => (
                        <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              err.severity === 'HIGH' ? 'bg-red-600 text-white' :
                              err.severity === 'MEDIUM' ? 'bg-orange-500 text-white' :
                              'bg-yellow-500 text-white'
                            }`}>
                              {err.severity}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="line-through text-red-600">{err.error}</span>
                                {' → '}
                                <span className="font-medium text-green-600">{err.correction}</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">{err.explanation}</p>
                              <p className="text-xs text-gray-500 mt-1">Category: {err.grammar_category?.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{evaluation.grammar_feedback.explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Vocabulary Score */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h4 className="text-lg font-semibold">Vocabulary Assessment</h4>
              <span className={`ml-auto text-xl font-bold ${getScoreColor(evaluation.vocabulary_score, 5)}`}>
                {evaluation.vocabulary_score}/5
              </span>
            </div>

            {evaluation.vocabulary_feedback && (
              <div className="space-y-3">
                {evaluation.vocabulary_feedback.appropriate_usage?.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="font-medium text-green-800 mb-1">✓ Appropriate Usage:</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {evaluation.vocabulary_feedback.appropriate_usage.map((usage: string, idx: number) => (
                        <li key={idx}>• {usage}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.vocabulary_feedback.incorrect_usage?.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="font-medium text-red-800 mb-1">✗ Incorrect Usage:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {evaluation.vocabulary_feedback.incorrect_usage.map((usage: string, idx: number) => (
                        <li key={idx}>• {usage}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-blue-800 mb-1">Level Appropriateness:</p>
                  <p className="text-sm text-blue-700">{evaluation.vocabulary_feedback.level_appropriateness}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{evaluation.vocabulary_feedback.explanation}</p>
                </div>
              </div>
            )}
          </div>

          {/* Overall Feedback */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-semibold">Overall Feedback</h4>
            </div>
            <p className="text-gray-700 leading-relaxed">{evaluation.overall_feedback}</p>
          </div>

          {/* Level Assessment */}
          {evaluation.level_assessment && (
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="text-lg font-semibold mb-2">Level Assessment</h4>
              <p className="text-gray-700">{evaluation.level_assessment}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main RoleplayChat component
export function RoleplayChat({
  taskId,
  userId,
  exerciseData,
  apiEndpoint = '/api/roleplay-partner',
  onConversationComplete,
  className,
  disableIntroScreen = false,
}: RoleplayChatProps) {
  const [showIntro, setShowIntro] = useState(() => !disableIntroScreen);
  const [input, setInput] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showMinExchangesHint, setShowMinExchangesHint] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    generateId: () => crypto.randomUUID(),
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            messages: messages,
            task_id: taskId,
            userId: userId,
            ...body,
          },
        };
      },
    }),
    onError: (error) => {
      console.error('[ROLEPLAY CHAT] Error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status !== 'submitted' && status !== 'streaming') {
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }],
      });
      setInput('');
    }
  };

  // Function to handle conversation evaluation
  const handleEvaluateConversation = async () => {
    // Ensure we have at least 5 dialogue exchanges (10 messages)
    if (messages.length < 10) {
      setShowMinExchangesHint(true);
      setTimeout(() => setShowMinExchangesHint(false), 3000);
      return;
    }

    setIsEvaluating(true);

    try {
      // Get user instruction from exerciseData
      const userInstruction = exerciseData?.user_instruction ||
                             exerciseData?.conversation_bot_prompt ||
                             exerciseData?.instructions?.['conversation-bot'] ||
                             exerciseData?.exercise_objective ||
                             'Practice conversation';

      // Extract course name from exerciseData or use default
      const courseName = exerciseData?.course_name ||
                        exerciseData?.course_id ||
                        'goethe-a1';

      // Prepare conversation history
      const conversationHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.parts?.[0]?.text || ''
        }));

      // Call the evaluation API
      console.log('[ROLEPLAY] Sending evaluation request:', {
        conversation_history_count: conversationHistory.length,
        user_instruction: userInstruction,
        course_name: courseName,
        task_id: taskId
      });

      const response = await fetch('/api/chatbot-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_history: conversationHistory,
          user_instruction: userInstruction,
          course_name: courseName,
          task_id: taskId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ROLEPLAY] Evaluation failed:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to evaluate conversation');
      }

      const evaluation = await response.json();
      setEvaluationData(evaluation);
      setShowEvaluation(true);
    } catch (error) {
      console.error('Error evaluating conversation:', error);
      alert('Failed to evaluate conversation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    }
  };

  // Handle special character insertion
  const handleCharacterSelect = (character: string) => {
    if (!inputRef.current) return;

    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = input;

    // Insert character at cursor position
    const newText = text.substring(0, start) + character + text.substring(end);
    setInput(newText);

    // Set cursor position after the inserted character
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
      adjustTextareaHeight();
    }, 0);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle start button click
  const handleStartConversation = () => {
    if (status === 'submitted' || status === 'streaming') return;

    const greeting = exerciseData?.language === 'German' ? 'Hallo' : 'Hello';
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: greeting }],
    });
  };

  // Show intro screen first
  if (showIntro && !disableIntroScreen) {
    return (
      <ChatbotIntroScreen
        onStart={() => setShowIntro(false)}
        exerciseData={exerciseData}
      />
    );
  }

  // Show evaluation results inline instead of chat when evaluation is ready
  if (showEvaluation && evaluationData) {
    return (
      <div className={`h-[100vh] bg-[#FDFBF9] overflow-y-auto ${className || ''}`}>
        <EvaluationFeedback
          evaluation={evaluationData}
          exerciseData={exerciseData}
          onClose={() => {
            setShowEvaluation(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`h-[100vh] bg-[#FDFBF9] relative pt-20 ${className || ''}`}>

      {/* Messages Container */}
      <div className="absolute inset-x-0 top-20 bottom-[90px] overflow-y-auto px-6 py-4 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="text-center space-y-4">
                <Button
                  onClick={handleStartConversation}
                  disabled={status === 'submitted' || status === 'streaming'}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {(status === 'submitted' || status === 'streaming') ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5 mr-2" />
                      {exerciseData?.language === 'German' ? 'Say Hallo to Start' : 'Say Hello to Start'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                return (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
                    <div className={`max-w-[80%] rounded-lg px-5 py-4 ${
                      message.role === 'user'
                        ? 'bg-[#2D3748] text-white'
                        : 'bg-[#EFEAE6] text-[#2D3748]'
                    }`}>
                      {message.parts?.map((part, index) => {
                        return (
                          <div key={index}>
                            {part.type === 'text' && (
                              <div className={`prose max-w-none prose-base ${
                                message.role === 'user'
                                  ? 'prose-invert !text-white prose-p:!text-white prose-a:!text-white prose-headings:!text-white prose-strong:!text-white prose-code:!text-white'
                                  : 'text-[#2D3748]'
                              } prose-p:leading-relaxed prose-pre:bg-transparent prose-p:my-2 prose-ul:my-2 prose-li:my-1 text-base leading-relaxed`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        );
                      }) || (
                        <div className={`prose max-w-none prose-base ${
                          message.role === 'user'
                            ? 'prose-invert !text-white prose-p:!text-white prose-a:!text-white prose-headings:!text-white prose-strong:!text-white prose-code:!text-white'
                            : 'text-[#2D3748]'
                        } prose-p:leading-relaxed prose-pre:bg-transparent prose-p:my-2 prose-ul:my-2 prose-li:my-1 text-base leading-relaxed`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{'Message content not available'}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}


              {/* Show typing indicator when AI is processing/streaming */}
              {(status === 'submitted' || status === 'streaming') && <TypingIndicator />}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>



      {/* Input Area - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#E8E4E1] p-2 bg-white z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Complete & Rate Button - Positioned above messages */}
          {!evaluationData && (
            <div className="absolute bottom-full right-4 mb-2">
              {/* Hint message */}
              {showMinExchangesHint && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm animate-fade-in mb-2">
                  💡 Please have at least {Math.ceil((10 - messages.length) / 2)} more exchange{Math.ceil((10 - messages.length) / 2) > 1 ? 's' : ''} before evaluation
                </div>
              )}

              <Button
                onClick={handleEvaluateConversation}
                disabled={isEvaluating}
                className={`${
                  messages.length < 10
                    ? 'bg-gray-400 hover:bg-gray-500'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                } text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 text-sm ${
                  isEvaluating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Award className="h-3 w-3" />
                    Complete & Rate
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Special Character Toolbar */}
          <div className="mb-1">
            <SpecialCharacterToolbar
              language={exerciseData?.language || 'English'}
              onCharacterSelect={handleCharacterSelect}
              isActive={status !== 'submitted' && status !== 'streaming'}
              className="flex justify-center"
            />
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full min-h-[44px] max-h-[160px] resize-none px-4 py-2 rounded-lg border border-[#E8E4E1] focus:outline-none focus:border-[#2D3748] text-[#2D3748] placeholder-[#4A5568] bg-white"
                rows={1}
              />
            </div>

            <Button
              type="submit"
              disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
              size="icon"
              className="rounded-lg h-10 w-10 bg-[#2D3748] hover:bg-[#1F2937] text-white disabled:opacity-50 flex-shrink-0"
            >
              {(status === 'submitted' || status === 'streaming') ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
