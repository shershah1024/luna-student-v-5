'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useEffect, useRef } from 'react';
import { CheckCircle, MessageCircle, Loader2, Sparkles, Play, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Import tool components
import { FillInTheBlanksExercise } from '@/components/FillInTheBlanksExercise';
import { VocabularyMatchingExercise } from '@/components/VocabularyMatchingExercise';
import { PronunciationExercise } from '@/components/FastPronunciationExercise';
import { SentenceBuilder } from '@/components/SentenceBuilder';
import WordProgressIndicator from '@/components/WordProgressIndicator';
import { GermanCharacterPicker } from '@/components/GermanCharacterPicker';

// Luna Typing Indicator Component
function LunaTypingIndicator() {
  const thinkingTerms = [
    "thinking...",
    "pondering...", 
    "reflecting...",
    "nachdenken...", // German for thinking
    "überlegen...", // German for considering
    "grübeln...", // German for pondering
    "contemplating...",
    "processing...",
    "cogitating...",
    "brainstorming...",
    "reflecting deeply..."
  ];
  
  // Use a simple hash of current time to get consistent but varying term
  const termIndex = Math.floor(Date.now() / 3000) % thinkingTerms.length;
  const currentTerm = thinkingTerms[termIndex];
  
  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%] rounded-lg px-5 py-4 bg-[#EFEAE6] text-[#2D3748]">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-sm text-gray-600 italic">{currentTerm}</span>
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
        objective: "Interactive AI tutor to help you learn German vocabulary"
      };
    }

    const objective = exerciseData.exercise_objective || 
                     exerciseData.objective || 
                     exerciseData.description ||
                     "Interactive AI tutor to help you learn German vocabulary";
    
    return { objective };
  };

  const { objective } = getLessonContent();


  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
      <div className="w-full max-w-lg mx-auto">
      {/* Main Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          Master German Words
        </h1>
      </div>
      
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-gray-600 text-base mb-4">
          {exerciseData && objective !== "Interactive AI tutor to help you learn German vocabulary" 
            ? objective 
            : 'Build a strong vocabulary foundation that sticks. Learn words faster, remember them longer, and express yourself with precision in any conversation.'
          }
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
            Start Building Vocabulary
          </div>
        </button>
      </div>
      </div>
    </div>
  );
}

// Props interface for the VocabularyTutor component
export interface VocabularyTutorProps {
  taskId: string;
  userId?: string;
  exerciseData?: any;
  apiEndpoint?: string;
  onLessonComplete?: () => void;
  className?: string;
}

// Main VocabularyTutor component
export function VocabularyTutor({
  taskId,
  userId,
  exerciseData,
  apiEndpoint = '/api/vocabulary-tutor-contextual',
  onLessonComplete,
  className
}: VocabularyTutorProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [input, setInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize vocabulary on component mount
  useEffect(() => {
    async function initializeVocabulary() {
      if (!taskId || !userId) {
        console.log('[VocabularyTutor] Missing required data:', { taskId, userId });
        setIsInitializing(false);
        return;
      }

      try {
        console.log('[VocabularyTutor] Initializing vocabulary for task:', taskId);
        const response = await fetch('/api/vocabulary/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('[VocabularyTutor] Initialization failed:', response.status, errorData);
          setInitializationError(`Failed to initialize vocabulary: ${response.status}`);
          setIsInitializing(false);
          return;
        }

        const result = await response.json();
        console.log('[VocabularyTutor] Vocabulary initialization result:', {
          success: result.success,
          initialized: result.initialized,
          vocabularyCount: result.vocabularyCount
        });

        if (result.success) {
          console.log('[VocabularyTutor] Vocabulary ready -', result.vocabularyCount, 'words');
        } else {
          setInitializationError('Vocabulary initialization failed');
        }
      } catch (error) {
        console.error('[VocabularyTutor] Initialization error:', error);
        setInitializationError('Network error during vocabulary initialization');
      } finally {
        setIsInitializing(false);
      }
    }

    initializeVocabulary();
  }, [taskId, userId]);

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    generateId: () => crypto.randomUUID(),
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            messages: messages, // Send full conversation history
            task_id: taskId, // Pass the task_id from the URL
            userId: userId, // Pass the userId
            ...body,
          },
        };
      },
    }),
    onError: (error) => {
      console.error('[VOCAB CHAT] ===== ERROR =====');
      console.error('[VOCAB CHAT] Error:', error);
      console.error('[VOCAB CHAT] ==================');
    },
    onToolCall: ({ toolCall }) => {
    },
    onFinish: ({ message, finishReason }) => {
    },
  });

  // Add effect to log when messages change
  useEffect(() => {
  }, [messages]);

  // Log status changes for typing indicator development
  useEffect(() => {
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status as string !== 'loading') {
      sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: input }],
      });
      setInput('');
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

  // Handle German character selection
  const handleGermanCharacterSelect = (character: string) => {
    const textarea = inputRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const newValue = input.slice(0, cursorPos) + character + input.slice(textarea.selectionEnd);
      setInput(newValue);
      
      // Set cursor position after the inserted character
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos + character.length, cursorPos + character.length);
      }, 0);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle start button click
  const handleStartConversation = () => {
    if (status as string === 'loading') return;
    
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: 'Hallo' }],
    });
  };

  // Show initialization or intro screen first
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
        <div className="w-full max-w-lg mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Preparing Your Vocabulary Lesson
          </h2>
          <p className="text-gray-600">
            Setting up your personalized German vocabulary practice...
          </p>
        </div>
      </div>
    );
  }

  if (initializationError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
        <div className="w-full max-w-lg mx-auto text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Initialization Failed
          </h2>
          <p className="text-red-700 mb-4">
            {initializationError}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <ChatbotIntroScreen 
        onStart={() => setShowIntro(false)}
        exerciseData={exerciseData}
      />
    );
  }

  return (
    <div className={`h-[100vh] bg-[#FDFBF9] relative pt-20 ${className || ''}`}>

      {/* Messages Container */}
      <div className="absolute inset-x-0 top-20 bottom-[120px] overflow-y-auto px-6 py-4 scroll-smooth">
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
                      Say Hallo to Start
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
                            {/* Handle AI SDK 5 streaming tool parts */}
                            {(part.type as any)?.startsWith?.('tool-') && (part as any).state === 'output-available' && (
                              <div className="mt-2">
                                {/* Fill in the Blanks */}
                                {(part.type as any) === 'tool-fillInTheBlanks' && (
                                  <FillInTheBlanksExercise
                                    sentence={(part as any).output.sentence}
                                    correctAnswer={(part as any).output.correctAnswer}
                                    hint={(part as any).output.hint}
                                    englishTranslation={(part as any).output.englishTranslation}
                                    id={(part as any).output.id}
                                    onComplete={(completeSentence, isCorrect) => {
                                      setTimeout(() => {
                                        sendMessage({
                                          role: 'user',
                                          parts: [{ type: 'text', text: completeSentence }],
                                        });
                                      }, 1500);
                                    }}
                                  />
                                )}
                                
                                {/* Matching Exercise */}
                                {(part.type as any) === 'tool-matchingExercise' && (
                                  <VocabularyMatchingExercise
                                    instructions={(part as any).output.instructions}
                                    leftItems={(part as any).output.leftItems}
                                    rightItems={(part as any).output.rightItems}
                                    correctPairs={(part as any).output.correctPairs}
                                    id={(part as any).output.id}
                                    onComplete={(matchResults) => {
                                      sendMessage({
                                        role: 'user',
                                        parts: [{ type: 'text', text: `I completed the matching exercise. My matches: ${matchResults}` }],
                                      });
                                    }}
                                  />
                                )}
                                
                                {/* Sentence Builder */}
                                {(part.type as any) === 'tool-sentenceBuilder' && (
                                  <SentenceBuilder
                                    instructions={(part as any).output.instructions}
                                    germanWords={(part as any).output.germanWords}
                                    correctOrder={(part as any).output.correctOrder}
                                    id={(part as any).output.id}
                                    onComplete={(builtSentence, isCorrect) => {
                                      sendMessage({
                                        role: 'user',
                                        parts: [{ type: 'text', text: builtSentence }],
                                      });
                                    }}
                                  />
                                )}
                                
                                {/* Pronunciation Exercise */}
                                {(part.type as any) === 'tool-pronunciationExercise' && (
                                  <PronunciationExercise
                                    word={(part as any).output.word}
                                    explanation={(part as any).output.audioHint || (part as any).output.phonetic || 'Practice pronunciation'}
                                    id={(part as any).output.id}
                                    language="de"
                                    onComplete={(score, isGood) => {
                                      sendMessage({
                                        role: 'user',
                                        parts: [{ type: 'text', text: `${score}%` }],
                                      });
                                    }}
                                  />
                                )}
                                
                                {/* Word Progress Update */}
                                {(part.type as any) === 'tool-updateVocabularyProgress' && (part as any).state === 'output-available' && (
                                  <div className="my-2">
                                    <WordProgressIndicator
                                      word={(part as any).output.term || (part as any).output.word || 'Unknown word'}
                                      previousStatus={parseInt((part as any).output.previousStatus) || 0}
                                      newStatus={parseInt((part as any).output.newStatus)}
                                      continueConversation={(part as any).output.continue_conversation}
                                    />
                                  </div>
                                )}
                                
                                {/* Fallback for unknown tools */}
                                {!['tool-fillInTheBlanks', 'tool-matchingExercise', 'tool-sentenceBuilder', 'tool-pronunciationExercise', 'tool-updateVocabularyProgress'].includes((part.type as any)) && (
                                  <div className="p-2 bg-blue-100 rounded">
                                    <strong>Tool Type:</strong> {part.type}<br/>
                                    <strong>State:</strong> {(part as any).state}<br/>
                                    <pre className="text-xs mt-1">{JSON.stringify(part, null, 2)}</pre>
                                  </div>
                                )}
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
              {(status === 'submitted' || status === 'streaming') && <LunaTypingIndicator />}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#E8E4E1] p-4 bg-white z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* German Character Helper */}
          <div className="mb-3">
            <GermanCharacterPicker 
              onCharacterSelect={handleGermanCharacterSelect}
              isActive={status !== 'submitted' && status !== 'streaming'}
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
              disabled={!input.trim() || status as string === 'loading'}
              size="icon"
              className="rounded-lg h-10 w-10 bg-[#2D3748] hover:bg-[#1F2937] text-white disabled:opacity-50 flex-shrink-0"
            >
              {status as string === 'loading' ? (
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