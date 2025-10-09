import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Clock, Mic, CheckCircle, ArrowRight, BookOpen, Target, AlertCircle, Sparkles, MessageCircle, Headphones, Globe } from 'lucide-react';
import { Card } from './ui/card';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
  taskId?: string;
  testId?: string;
  lessonData?: {
    chapter_title?: string;
    exercise_objective?: string;
    chapter_theme?: string;
    lesson_name?: string;
    bot_instruction?: string;
    test_id?: string;
    topic?: string;
    level?: string;
    title?: string;
    instructions?: string;
    context?: any;
    section_id?: string;
    // Speaking exercise specific fields
    user_instruction?: string;
    lesson_title?: string;
    tips?: string[];
  };
}

const parseInstructions = (text: string) => {
  const sections: any[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentSection: any = null;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('# ')) {
      // Main title
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'title',
        content: trimmed.replace('# ', ''),
        items: []
      };
    } else if (trimmed.startsWith('## ')) {
      // Section header
      const content = trimmed.replace('## ', '');
      if (content.includes('Duration:')) {
        const duration = content.replace('Duration: ', '');
        if (currentSection) currentSection.duration = duration;
      } else {
        if (currentSection) {
          currentSection.items.push({
            type: 'section',
            content: content
          });
        }
      }
    } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      // Bullet point
      if (currentSection) {
        currentSection.items.push({
          type: 'bullet',
          content: trimmed.replace(/^[•-] /, '')
        });
      }
    } else if (trimmed.includes('**') && trimmed.includes(':')) {
      // Bold item with description
      const [label, ...rest] = trimmed.split(':');
      if (currentSection) {
        currentSection.items.push({
          type: 'highlight',
          label: label.replace(/\*\*/g, ''),
          content: rest.join(':').trim()
        });
      }
    } else if (trimmed && !trimmed.startsWith('#')) {
      // Regular paragraph
      if (currentSection) {
        currentSection.items.push({
          type: 'text',
          content: trimmed
        });
      }
    }
  });
  
  if (currentSection) sections.push(currentSection);
  return sections;
};

export const Welcome = React.forwardRef<
  HTMLElement,
  WelcomeProps
>(({ disabled, startButtonText, onStartCall, lessonData, taskId }, ref) => {
  const [userInstructions, setUserInstructions] = useState<string | null>(null);
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(false);

  // Use user_instruction from lessonData if available (preferred), otherwise fetch from API
  useEffect(() => {
    // First check if lessonData already has user_instruction
    if (lessonData?.user_instruction) {
      setUserInstructions(lessonData.user_instruction);
      setIsLoadingInstructions(false);
      return;
    }

    // Only fetch from API if not available in lessonData and taskId is present
    if (taskId) {
      setIsLoadingInstructions(true);
      fetch(`/api/speaking-instructions?task_id=${taskId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.user_instruction) {
            setUserInstructions(data.user_instruction);
          }
        })
        .catch(err => {
          console.error('Failed to fetch speaking instructions:', err);
          // Don't let the API error block the component from showing
          // The component will fall back to using lessonData instructions
        })
        .finally(() => {
          setIsLoadingInstructions(false);
        });
    } else {
      // If no taskId, immediately set loading to false
      setIsLoadingInstructions(false);
    }
  }, [taskId, lessonData?.user_instruction]);
  // Extract the lesson title - prefer lesson_title from speaking exercise data
  const lessonTitle = lessonData?.lesson_title ||
    lessonData?.lesson_name ||
    (lessonData?.exercise_objective ? lessonData.exercise_objective.split('\n')[0].replace(/^#\s*/, '') : 'Speaking Practice');

  // Check if this is a test context (has test_id)
  const isTestContext = lessonData?.test_id;
  const testTitle = lessonData?.title || 'Speaking Test';
  const testInstructions = lessonData?.instructions || '';

  // Extract topic and level for display
  const topic = lessonData?.topic;
  const level = lessonData?.level;
  const tips = lessonData?.tips || [];

  // Handle missing lessonData gracefully
  if (!lessonData && !taskId) {
    console.warn('Welcome component: No lessonData or taskId provided');
  }

  return (
    <section
      ref={ref}
      inert={disabled ? "" : undefined}
      className={cn(
        'bg-gray-50 relative w-full h-full min-h-[600px] overflow-y-auto flex items-center justify-center py-8',
        disabled ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      )}
    >
      <div className="w-full py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with classic style */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-slate-700 rounded-full shadow-md flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {lessonTitle}
            </h1>
            <div className="flex flex-wrap justify-center gap-2">
              {lessonData?.chapter_title && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <Globe className="w-4 h-4 text-slate-700" />
                  <span className="text-gray-800 font-medium">{lessonData.chapter_title}</span>
                </div>
              )}
              {level && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <Target className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-800 font-medium">Level {level}</span>
                </div>
              )}
              {topic && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span className="text-blue-800 font-medium text-sm">{topic}</span>
                </div>
              )}
            </div>
          </div>

          {/* User Instructions or Simple Lesson Card */}
          {userInstructions ? (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-8">
              {/* Header */}
              <div className="bg-slate-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Today's Speaking Task
                </h2>
              </div>
              
              {/* Instructions content with scrollable area */}
              <div className="max-h-[400px] overflow-y-auto">
              <div className="p-6 prose prose-sm max-w-none">
                <div className="markdown-content" 
                     dangerouslySetInnerHTML={{ 
                       __html: userInstructions
                         .replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">$1</h1>')
                         .replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-semibold text-gray-800 mt-6 mb-3">$1</h2>')
                         .replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-medium text-gray-700 mt-4 mb-2">$1</h3>')
                         .replace(/^•\s+(.+)$/gm, '<div class="ml-4 mb-2 flex gap-2"><span class="text-slate-600">•</span><span class="text-gray-700">$1</span></div>')
                         .replace(/^[-]\s+(.+)$/gm, '<div class="ml-6 mb-1 flex gap-2"><span class="text-gray-400">–</span><span class="text-gray-600">$1</span></div>')
                         .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                         .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
                         .replace(/^(.+)$/gm, (match) => {
                           if (!match.match(/^<[^>]+>/)) {
                             return `<p class="mb-2 text-gray-700">${match}</p>`;
                           }
                           return match;
                         })
                     }} 
                />
                
                {/* Tips Section - show if tips are available */}
                {tips.length > 0 && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-700" />
                      <h3 className="font-semibold text-gray-800">Speaking Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {tips.map((tip, index) => (
                        <li key={index} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-amber-600 font-semibold">{index + 1}.</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Remember Section - highlight if present and no tips */}
                {tips.length === 0 && userInstructions.includes('Remember') && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Headphones className="w-5 h-5 text-slate-700" />
                      <h3 className="font-semibold text-gray-800">Pro Tips</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      Remember: Your AI partner is here to help! Don't be afraid to make mistakes.
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          ) : isTestContext ? (
            // Test-specific UI
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-8">
              <div className="bg-slate-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Test Instructions
                </h2>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  {testInstructions || 'Complete the speaking task by having a conversation with the AI examiner.'}
                </p>

                {lessonData?.prompts && lessonData.prompts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Test Questions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {lessonData.prompts.map((prompt: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{prompt.display_order || i + 1}.</span>
                          <span className="text-sm text-gray-600">{prompt.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lessonData?.total_points && (
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-gray-600">
                      Part {lessonData.task_number || 1} of 3
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {lessonData.total_points} Points
                    </span>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Your conversation will be recorded for evaluation. Speak for at least 2-3 minutes.
                  </p>
                </div>

                <div className="flex gap-4 text-sm text-gray-500 mt-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{lessonData?.time_limit ? `${Math.floor(lessonData.time_limit / 60)} minutes` : '2-3 minutes'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>Test conversation</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Regular lesson UI - enhanced with topic and tips
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-8">
              <div className="bg-slate-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Today's Speaking Practice
                </h2>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {lessonTitle}
                </h3>

                {topic && (
                  <p className="text-gray-700 mb-4">
                    <span className="font-medium">Topic:</span> {topic}
                  </p>
                )}

                <p className="text-gray-600 mb-4">
                  Practice your speaking skills in a natural conversation with your AI tutor.
                </p>

                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>5-10 minutes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>Interactive dialogue</span>
                  </div>
                  {level && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>Level {level}</span>
                    </div>
                  )}
                </div>

                {/* Show tips if available when no detailed instructions */}
                {tips.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Quick Tips
                    </h4>
                    <ul className="space-y-1">
                      {tips.slice(0, 3).map((tip, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {isLoadingInstructions && (
                  <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading detailed instructions...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Start Button with classic style */}
          <div className="text-center">
            <Button 
              onClick={onStartCall} 
              size="lg"
              className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-3"
            >
              <Mic className="w-5 h-5" />
              {startButtonText}
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Ready when you are. The conversation will begin when you click above.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

Welcome.displayName = 'Welcome';