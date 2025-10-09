'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, CheckCircle, AlertCircle, Loader2, Brain, Lightbulb, BookOpen, Award, Play, Target, PenTool } from 'lucide-react';
// Markdown no longer used for evaluations
import { motion, AnimatePresence } from 'framer-motion';
import { SpecialCharacterToolbar } from '@/components/SpecialCharacterToolbar';

interface LessonWritingProps {
  taskId: string;
  userId: string;
  exerciseData: {
    course_name: string;
    chapter_id: string;
    exercise_id: string;
    exercise_objective?: string;
  };
  writingData?: WritingAssignment | any;
  onComplete?: () => void;
}

// Writing exercise intro screen component with actual assignment data
function WritingIntroScreen({ 
  onStart,
  exerciseData,
  writingData
}: { 
  onStart: () => void; 
  exerciseData?: any;
  writingData?: any;
}) {
  // Extract actual assignment information
  const topic = writingData?.content?.topic || writingData?.parameters?.topic || exerciseData?.topic || 'Writing Task';
  const level = writingData?.parameters?.difficulty_level || exerciseData?.difficulty_level || 'B1';
  const language = writingData?.parameters?.language || exerciseData?.language || 'Language';
  const instructions = writingData?.content?.instructions || writingData?.instruction || '';
  const wordCount = writingData?.content?.word_count || writingData?.parameters?.word_count || 150;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-[#FDFBF9] z-50">
      <div className="w-full max-w-2xl mx-auto">
      {/* Main Title */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <Edit className="h-8 w-8 text-blue-600" />
          Writing Assignment
        </h1>
      </div>
      
      {/* Assignment Details Card */}
      <Card className="mb-6 p-6 border-2 border-blue-100 bg-white">
        <div className="space-y-4">
          {/* Topic */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Topic</h3>
            <p className="text-xl font-semibold text-gray-800">{topic}</p>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-500">Level</p>
              <p className="text-lg font-semibold text-blue-600">{level}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Language</p>
              <p className="text-lg font-semibold text-gray-800">{language}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Target</p>
              <p className="text-lg font-semibold text-gray-800">{wordCount} words</p>
            </div>
          </div>

          {/* Instructions if available */}
          {instructions && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Instructions</h3>
              <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">{instructions}</p>
            </div>
          )}
        </div>
      </Card>

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
            Begin Writing
          </div>
        </motion.button>
        
        <p className="text-sm text-gray-500 mt-3">
          AI-powered feedback will be provided after submission
        </p>
      </div>
      </div>
    </div>
  );
}

interface WritingAssignment {
  id: number;
  task_id: string;
  instruction: string;
  assignment_id: string;
  lesson_id: string | null;
  level: string;
  image_url?: string | null;
  created_at?: string;
}

interface EvaluationResult {
  overall_evaluation: string;
  parameter_evaluations: {
    task_completion: {
      score: number;
      max_score: number;
      comment: string;
      examples?: string[];
      final_comment: string;
    };
    communicative_design: {
      score: number;
      max_score: number;
      comment: string;
      examples?: string[];
      final_comment: string;
    };
  };
  grammar_errors: Array<{
    error: string;
    correction: string;
    explanation: string;
  }>;
  total_score: number;
  max_total_score: number;
  score_breakdown?: {
    content_points: number[];
    communicative_design: number;
  };
}

// Creative evaluation waiting screen component
function EvaluationWaitingScreen({ userText }: { userText: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const evaluationSteps = [
    { icon: BookOpen, text: "Reading your response...", color: "text-blue-600" },
    { icon: Brain, text: "Analyzing content structure...", color: "text-purple-600" },
    { icon: Lightbulb, text: "Checking task completion...", color: "text-green-600" },
    { icon: Edit, text: "Reviewing grammar and style...", color: "text-orange-600" },
    { icon: Award, text: "Calculating your score...", color: "text-red-600" }
  ];

  const writingTips = [
    "💡 Strong openings grab the reader's attention immediately",
    "✍️ Use connecting words like 'furthermore', 'however', 'therefore'",
    "🎯 Stay focused on the main topic throughout your text",
    "📝 Short, clear sentences are often more effective",
    "🔗 Link your ideas with transition phrases",
    "✨ End with a memorable conclusion or call to action"
  ];

  const encouragements = [
    "Analyzing the creativity in your writing...",
    "Checking how well you addressed the topic...",
    "Evaluating your German language skills...",
    "Looking for strengths in your response..."
  ];

  // Cycle through evaluation steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % evaluationSteps.length);
    }, 2000);
    return () => clearInterval(stepInterval);
  }, []);

  // Cycle through tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % writingTips.length);
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
    }, 50);

    return () => clearInterval(typingInterval);
  }, [currentStep]);

  const CurrentIcon = evaluationSteps[currentStep].icon;

  return (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="relative bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-full">
            <CurrentIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mt-4 mb-2">
          Evaluating Your Writing
        </h3>
        
        <div className="h-8 flex items-center justify-center">
          <p className={`text-lg ${evaluationSteps[currentStep].color} transition-all duration-500`}>
            {evaluationSteps[currentStep].text}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all duration-2000 ease-out"
            style={{ width: `${((currentStep + 1) / evaluationSteps.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Analysis</span>
          <span>Complete</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Brain className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">AI Analysis in Progress</h4>
            <p className="text-blue-700">
              {typedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-6 w-6 text-green-600 mt-1 flex-shrink-0 animate-bounce" />
          <div>
            <h4 className="font-semibold text-green-800 mb-2">Writing Tip</h4>
            <p className="text-green-700 transition-all duration-500">
              {writingTips[currentTip]}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <Edit className="h-6 w-6 text-gray-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-2">Your Submission Preview</h4>
            <div className="text-sm text-gray-600 bg-white rounded-lg p-4 max-h-32 overflow-y-auto">
              {userText.length > 150 ? `${userText.substring(0, 150)}...` : userText}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {userText.split(/\s+/).filter(w => w.length > 0).length} words submitted
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Helper function to convert form-based data to instruction
function convertFormDataToInstruction(formData: any): string {
  console.log('[LessonWriting] convertFormDataToInstruction called with:', {
    formDataKeys: formData ? Object.keys(formData) : null,
    hasScenarioContext: !!formData?.scenario_context,
    hasScenario: !!formData?.scenario,
    hasOverallInstructionsText: !!formData?.overall_instructions_text,
    hasInstructions: !!formData?.instructions,
    hasFormFields: !!formData?.form_fields,
    formFieldsLength: formData?.form_fields?.length,
    hasDestination: !!formData?.destination,
    hasArrivalInfo: !!formData?.arrival_info,
    hasPromptPoints: !!formData?.prompt_points,
    promptPointsLength: formData?.prompt_points?.length,
    hasAdditionalInfo: !!formData?.additional_info
  });

  let instruction = '';
  
  // Add context/scenario
  const context = formData.scenario_context || formData.scenario || '';
  if (context) {
    console.log('[LessonWriting] Adding context/scenario to instruction, length:', context.length);
    instruction += context + '\n\n';
  }
  
  // Add main instruction
  const mainInstruction = formData.overall_instructions_text || formData.instructions || '';
  if (mainInstruction) {
    console.log('[LessonWriting] Adding main instruction, length:', mainInstruction.length);
    instruction += mainInstruction + '\n\n';
  }
  
  // If there are form fields, convert them to bullet points
  if (formData.form_fields && formData.form_fields.length > 0) {
    console.log('[LessonWriting] Processing form fields, count:', formData.form_fields.length);
    instruction += 'Bitte geben Sie folgende Informationen an:\n';
    formData.form_fields.forEach((field: any, index: number) => {
      const fieldName = field.field_label || field.field_name || '';
      const expectedType = field.expected_answer_type || field.expected_content || '';
      console.log('[LessonWriting] Processing form field', index, ':', {
        fieldName,
        expectedType,
        hasFieldLabel: !!field.field_label,
        hasFieldName: !!field.field_name,
        hasExpectedAnswerType: !!field.expected_answer_type,
        hasExpectedContent: !!field.expected_content
      });
      instruction += `- ${fieldName} ${expectedType ? `(${expectedType})` : ''}\n`;
    });
  }
  
  // For Section 2 type data (destination, arrival_info, prompt_points)
  if (formData.destination && formData.arrival_info) {
    console.log('[LessonWriting] Processing Section 2 type data with destination and arrival_info');
    instruction = `${formData.arrival_info}\n\n${formData.overall_instructions_text || ''}\n\n`;
    if (formData.prompt_points && formData.prompt_points.length > 0) {
      console.log('[LessonWriting] Processing prompt points, count:', formData.prompt_points.length);
      instruction += 'Schreiben Sie über:\n';
      formData.prompt_points.forEach((point: string, index: number) => {
        console.log('[LessonWriting] Adding prompt point', index, ':', point);
        instruction += `- ${point}\n`;
      });
    }
  }
  
  // Add any additional info
  if (formData.additional_info) {
    console.log('[LessonWriting] Adding additional info, length:', formData.additional_info.length);
    instruction += '\n' + formData.additional_info;
  }
  
  console.log('[LessonWriting] Final converted instruction:', {
    length: instruction.length,
    preview: instruction.substring(0, 100) + '...'
  });
  
  return instruction.trim();
}

export default function LessonWriting({
  taskId,
  userId,
  exerciseData,
  writingData: initialWritingData,
  onComplete,
}: LessonWritingProps) {
  console.log('[LessonWriting] Component initialized with props:', {
    taskId,
    userId,
    exerciseDataKeys: exerciseData ? Object.keys(exerciseData) : null,
    hasInitialWritingData: !!initialWritingData,
    initialWritingDataKeys: initialWritingData ? Object.keys(initialWritingData) : null,
    hasOnComplete: !!onComplete,
    timestamp: new Date().toISOString()
  });
  
  console.log('[LessonWriting] PRODUCTION DEBUG - Component mount:', {
    componentName: 'LessonWriting',
    propsReceived: {
      taskId: taskId,
      userId: userId,
      exerciseData: exerciseData,
      hasOnComplete: !!onComplete
    },
    environment: {
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
      isClient: typeof window !== 'undefined',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side'
    },
    timestamp: new Date().toISOString()
  });

  const [showIntro, setShowIntro] = useState(true);
  const [writingData, setWritingData] = useState<WritingAssignment | any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use writing data from parent or fetch if not provided
  useEffect(() => {
    const setupWritingData = async () => {
      // If writing data is already provided by parent, use it
      if (initialWritingData) {
        console.log('[LessonWriting] Using writing data provided by parent:', {
          hasData: !!initialWritingData,
          dataKeys: initialWritingData ? Object.keys(initialWritingData) : null,
          taskId: initialWritingData?.task_id,
          timestamp: new Date().toISOString()
        });
        setWritingData(initialWritingData);
        setLoading(false);
        return;
      }
      
      // Otherwise fetch it (fallback for when not provided by parent)
      console.log('[LessonWriting] No writing data provided by parent, fetching...');
      await fetchWritingDataFromAPI();
    };

    const fetchWritingDataFromAPI = async () => {
      console.log('[LessonWriting] Starting fetchWritingData for taskId:', taskId);
      console.log('[LessonWriting] Current environment:', {
        isProduction: process.env.NODE_ENV === 'production',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side',
        windowLocation: typeof window !== 'undefined' ? window.location.href : 'server-side',
        timestamp: new Date().toISOString(),
        isClient: typeof window !== 'undefined',
        isDevelopment: process.env.NODE_ENV === 'development'
      });
      
      try {
        console.log('[LessonWriting] Attempting to fetch from writing_assignments API...');
        
        // Try to fetch from writing_assignments first
        const writingAssignmentsUrl = `/api/writing-tasks?task_id=${taskId}`;
        console.log('[LessonWriting] Fetching from URL:', writingAssignmentsUrl);
        console.log('[LessonWriting] PRODUCTION DEBUG - Full fetch details:', {
          url: writingAssignmentsUrl,
          taskId: taskId,
          currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
          fetchMethod: 'GET',
          isValidTaskId: !!taskId && taskId.length > 0,
          taskIdType: typeof taskId,
          taskIdLength: taskId?.length
        });
        
        let response = await fetch(writingAssignmentsUrl);
        console.log('[LessonWriting] Writing assignments API response status:', response.status);
        console.log('[LessonWriting] Writing assignments API response headers:', Object.fromEntries(response.headers.entries()));
        console.log('[LessonWriting] PRODUCTION DEBUG - Response details:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
          type: response.type,
          redirected: response.redirected
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[LessonWriting] Writing data received from writing_assignments:', {
            dataExists: !!data,
            dataKeys: data ? Object.keys(data) : null,
            taskId: data?.task_id,
            hasInstruction: !!data?.instruction,
            instructionLength: data?.instruction?.length
          });
          console.log('[LessonWriting] PRODUCTION DEBUG - writing_assignments data:', {
            fullData: data,
            responseSize: JSON.stringify(data).length,
            dataType: typeof data,
            isArray: Array.isArray(data),
            isNull: data === null,
            isUndefined: data === undefined
          });
          
          if (data) {
            console.log('[LessonWriting] Successfully loaded data from writing_assignments, setting state');
            setWritingData(data);
            setLoading(false);
            return;
          } else {
            console.log('[LessonWriting] Data from writing_assignments was null/empty');
          }
        } else {
          console.log('[LessonWriting] Writing assignments API failed with status:', response.status);
          const errorText = await response.text();
          console.log('[LessonWriting] Writing assignments API error response:', errorText);
          console.log('[LessonWriting] PRODUCTION DEBUG - API Error details:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            errorLength: errorText.length,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
        }
        
        // If not found in writing_assignments, try writing_tests
        console.log('[LessonWriting] Not found in writing_assignments, checking writing_tests...');
        const writingTestsUrl = `/api/writing-tests?test_id=${taskId}`;
        console.log('[LessonWriting] Fetching from URL:', writingTestsUrl);
        
        response = await fetch(writingTestsUrl);
        console.log('[LessonWriting] Writing tests API response status:', response.status);
        console.log('[LessonWriting] Writing tests API response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const data = await response.json();
          console.log('[LessonWriting] Writing data received from writing_tests:', {
            dataExists: !!data,
            dataKeys: data ? Object.keys(data) : null,
            hasSections: !!data?.sections,
            sectionsLength: data?.sections?.length,
            firstSectionKeys: data?.sections?.[0] ? Object.keys(data.sections[0]) : null
          });
          
          if (data && data.sections) {
            console.log('[LessonWriting] Processing writing_tests data...');
            // Convert writing_tests data to a format we can use
            const section = data.sections[0]; // Use first section
            console.log('[LessonWriting] First section data:', {
              sectionExists: !!section,
              hasQuestionData: !!section?.question_data,
              questionDataKeys: section?.question_data ? Object.keys(section.question_data) : null
            });
            
            if (section && section.question_data) {
              console.log('[LessonWriting] Converting form data to instruction...');
              const instruction = convertFormDataToInstruction(section.question_data);
              console.log('[LessonWriting] Converted instruction length:', instruction.length);
              
              const convertedData = {
                task_id: taskId,
                instruction: instruction,
                level: 'A1',
                assignment_id: `${data.course}_section_${section.section}`,
                ...section.question_data
              };
              
              console.log('[LessonWriting] Successfully converted writing_tests data:', {
                hasTaskId: !!convertedData.task_id,
                hasInstruction: !!convertedData.instruction,
                instructionLength: convertedData.instruction.length,
                level: convertedData.level,
                assignmentId: convertedData.assignment_id
              });
              
              setWritingData(convertedData);
              setLoading(false);
              return;
            } else {
              console.log('[LessonWriting] Section or question_data missing from writing_tests response');
            }
          } else {
            console.log('[LessonWriting] No sections found in writing_tests response');
          }
        } else {
          console.log('[LessonWriting] Writing tests API failed with status:', response.status);
          const errorText = await response.text();
          console.log('[LessonWriting] Writing tests API error response:', errorText);
        }
        
        console.log('[LessonWriting] No writing task found in either API endpoint');
        throw new Error('No writing task found in either table');
      } catch (err) {
        console.error('[LessonWriting] Error in fetchWritingData:', {
          error: err,
          message: err.message,
          stack: err.stack,
          taskId: taskId,
          timestamp: new Date().toISOString()
        });
        setError('Failed to load writing exercise');
      } finally {
        console.log('[LessonWriting] fetchWritingData completed, setting loading to false');
        setLoading(false);
      }
    };

    if (taskId) {
      console.log('[LessonWriting] Task ID provided, starting setup process');
      setupWritingData();
    } else {
      console.log('[LessonWriting] No task ID provided, skipping setup');
    }
  }, [taskId, initialWritingData]);

  // Count words in German text
  useEffect(() => {
    const text = userText.trim();
    if (text === '') {
      console.log('[LessonWriting] User text is empty, setting word count to 0');
      setWordCount(0);
    } else {
      // Split by whitespace and filter out empty strings
      const words = text.split(/\s+/).filter(word => word.length > 0);
      console.log('[LessonWriting] Word count updated:', {
        textLength: text.length,
        wordCount: words.length,
        preview: text.substring(0, 50) + '...'
      });
      setWordCount(words.length);
    }
  }, [userText]);

  const handleCharacterInsert = (character: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = userText;

    // Insert character at cursor position
    const newValue = currentValue.substring(0, start) + character + currentValue.substring(end);
    setUserText(newValue);

    // Move cursor after inserted character
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + character.length, start + character.length);
    }, 0);
  };

  const handleSubmit = async () => {
    console.log('[LessonWriting] handleSubmit called:', {
      hasUserText: !!userText.trim(),
      userTextLength: userText.trim().length,
      wordCount: wordCount,
      hasWritingData: !!writingData,
      writingDataKeys: writingData ? Object.keys(writingData) : null,
      taskId: taskId,
      timestamp: new Date().toISOString()
    });

    if (!userText.trim() || !writingData) {
      console.log('[LessonWriting] Submit validation failed:', {
        hasUserText: !!userText.trim(),
        hasWritingData: !!writingData
      });
      return;
    }

    console.log('[LessonWriting] Starting submission process...');
    setIsSubmitting(true);
    setError(null);

    try {
      const requestPayload = {
        question_data: writingData.instruction,
        learner_response: userText,
        task_id: taskId
      };
      
      console.log('[LessonWriting] Sending evaluation request:', {
        questionDataLength: requestPayload.question_data?.length,
        learnerResponseLength: requestPayload.learner_response?.length,
        taskId: requestPayload.task_id,
        requestSize: JSON.stringify(requestPayload).length
      });

      const response = await fetch('/api/assignments/writing/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('[LessonWriting] Evaluation API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[LessonWriting] Evaluation API error response:', errorText);
        throw new Error(`Failed to evaluate essay: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log('[LessonWriting] JSON evaluation result received:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : null,
        totalScore: result?.total_score,
        maxTotalScore: result?.max_score,
      });
      setEvaluation(result);
      setShowEvaluation(true);
      
      console.log('[LessonWriting] Evaluation completed successfully, calling onComplete');
      // Mark as completed
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('[LessonWriting] Error in handleSubmit:', {
        error: err,
        message: err.message,
        stack: err.stack,
        taskId: taskId,
        userTextLength: userText.length,
        timestamp: new Date().toISOString()
      });
      setError('Failed to submit essay for evaluation');
    } finally {
      console.log('[LessonWriting] handleSubmit process completed, setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  // Log current component state for debugging
  console.log('[LessonWriting] Current component state:', {
    loading,
    error,
    hasWritingData: !!writingData,
    showIntro,
    showEvaluation,
    isSubmitting,
    userTextLength: userText.length,
    wordCount,
    hasEvaluation: !!evaluation,
    timestamp: new Date().toISOString()
  });
  
  // Additional production debug logging
  console.log('[LessonWriting] PRODUCTION DEBUG - Component render state:', {
    componentRendering: true,
    taskId: taskId,
    userId: userId,
    loadingState: loading,
    errorState: error,
    writingDataExists: !!writingData,
    writingDataType: typeof writingData,
    showIntroScreen: showIntro,
    isProduction: process.env.NODE_ENV === 'production',
    windowExists: typeof window !== 'undefined',
    documentExists: typeof document !== 'undefined'
  });

  if (loading) {
    console.log('[LessonWriting] Rendering loading state');
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !writingData) {
    console.log('[LessonWriting] Rendering error state:', {
      error,
      hasWritingData: !!writingData
    });
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error || 'Failed to load writing exercise'}</p>
      </Card>
    );
  }

  // Show intro screen first
  if (showIntro) {
    console.log('[LessonWriting] Rendering intro screen');
    return (
      <WritingIntroScreen 
        onStart={() => {
          console.log('[LessonWriting] User clicked start, hiding intro screen');
          setShowIntro(false);
        }}
        exerciseData={exerciseData}
        writingData={initialWritingData || writingData}
      />
    );
  }

  console.log('[LessonWriting] PRODUCTION DEBUG - About to render main component');
  
  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-3">
      {/* Writing Task Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Edit className="h-6 w-6 text-red-600" />
          Writing Task
        </h1>
      </div>
      
      {/* Exercise Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-red-100/50 p-3 sm:p-4">

        {/* Writing Prompt */}
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg border border-red-100">
          <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
            {writingData.instruction || convertFormDataToInstruction(writingData)}
          </div>
          {writingData.image_url && (
            <div className="mt-4">
              <img 
                src={writingData.image_url} 
                alt="Writing prompt reference" 
                className="rounded-lg max-w-full h-auto shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Writing Area or Evaluation Waiting Screen */}
        {!showEvaluation && !isSubmitting ? (
          <div className="space-y-4">
            <div className="p-2 sm:p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Response:
              </label>

              {/* Special Character Toolbar */}
              <div className="mb-3">
                <SpecialCharacterToolbar
                  language={writingData?.parameters?.language || writingData?.language || 'German'}
                  onCharacterSelect={handleCharacterInsert}
                  compact={false}
                />
              </div>

              <textarea
                ref={textareaRef}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                className="w-full h-40 p-3 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                disabled={isSubmitting}
                rows={12}
              />

              <div className="flex justify-end mt-2">
                <div className="text-sm font-semibold text-gray-600">
                  {wordCount} words
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!userText.trim() || isSubmitting || wordCount < 10}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Response
              </button>
            </div>
          </div>
        ) : isSubmitting ? (
          /* Show animated waiting screen during evaluation */
          <EvaluationWaitingScreen userText={userText} />
        ) : (
          /* Evaluation Results */
          <div className="mt-4 sm:mt-6 space-y-4">
            {/* Main Score Card */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-green-800">Evaluation Results</h3>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Score</div>
                  <div className="text-2xl font-bold text-green-700">
                    {evaluation?.total_score ?? 0}/{evaluation?.max_score ?? 15}
                  </div>
                  <div className="text-sm text-green-600">
                    {((evaluation?.total_score ?? 0) / (evaluation?.max_score ?? 15) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Parameter Evaluations */}
            {evaluation && (
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-800">Detailed Assessment</h4>
                {Object.entries(evaluation)
                  .filter(([k]) => k.startsWith('parameter_'))
                  .map(([key, val]: any) => {
                    // Get parameter label from the assignment data if available
                    const paramNumber = key.replace('parameter_', '');
                    const paramData = writingData?.rating_parameters?.find((p: any) => p.id === key);
                    const label = paramData?.label || `Parameter ${paramNumber}`;
                    const isLanguageControl = label.toLowerCase().includes('language') || label.toLowerCase().includes('grammar');
                    
                    return (
                      <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className={`p-3 border-b ${
                          isLanguageControl 
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50' 
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <h5 className="font-semibold text-gray-800">
                              {isLanguageControl && (
                                <span className="inline-flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  {label}
                                </span>
                              )}
                              {!isLanguageControl && label}
                            </h5>
                            <div className="flex items-center gap-3">
                              <div className={`text-xl font-bold ${
                                isLanguageControl ? 'text-yellow-600' : 'text-blue-600'
                              }`}>
                                {val?.score ?? 0}
                              </div>
                              <div className="text-sm text-gray-600">
                                of {val?.max_score ?? 0}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          {val?.comment && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-1">Feedback:</h6>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {val.comment}
                              </p>
                              {isLanguageControl && val.comment.toLowerCase().includes('error') && (
                                <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                  <p className="text-xs text-yellow-800 italic">
                                    💡 This includes grammar, vocabulary, and spelling feedback specific to your CEFR level.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Legacy sections removed - the new parameter display above handles all feedback */}

            {/* Legacy Grammar Corrections section - removed as grammar feedback is now included in Language Control parameter */}

          </div>
        )}
      </div>
    </div>
  );
}
