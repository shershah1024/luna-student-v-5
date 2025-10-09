'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Type for simple writing assignment (from writing_assignments table)
interface SimpleWritingTask {
  id: number;
  task_id: string;
  instruction: string;
  assignment_id: string;
  lesson_id: string | null;
  level: string;
  image_url?: string | null;
  created_at?: string;
}

// Type for complex form-based writing (from writing_tests table)
interface FormBasedWritingTask {
  form_title?: string;
  form_fields?: Array<{
    field_label?: string;
    field_name?: string;
    field_type: string;
    expected_answer_type?: string;
    expected_content?: string;
    prefilled_value?: string | null;
  }>;
  scenario_context?: string;
  scenario?: string;
  overall_instructions_text?: string;
  instructions?: string;
  additional_info?: string;
  provided_info?: Record<string, string>;
}

interface UnifiedWritingExerciseProps {
  taskData: SimpleWritingTask | FormBasedWritingTask | any;
  taskId: string;
  userId: string;
  courseId?: string;
  onComplete?: () => void;
  mode?: 'lesson' | 'test';
}

// Type guard to check if it's a simple writing task
function isSimpleWritingTask(data: any): data is SimpleWritingTask {
  return data && typeof data.instruction === 'string' && typeof data.task_id === 'string';
}

// Type guard to check if it's a form-based task
function isFormBasedTask(data: any): data is FormBasedWritingTask {
  return data && (
    Array.isArray(data.form_fields) || 
    typeof data.scenario_context === 'string' ||
    typeof data.scenario === 'string'
  );
}

// Convert form-based task to simple instruction format
function convertFormToInstruction(formData: FormBasedWritingTask): string {
  let instruction = '';
  
  // Add context/scenario
  const context = formData.scenario_context || formData.scenario || '';
  if (context) {
    instruction += context + '\n\n';
  }
  
  // Add main instruction
  const mainInstruction = formData.overall_instructions_text || formData.instructions || '';
  if (mainInstruction) {
    instruction += mainInstruction + '\n\n';
  }
  
  // If there are form fields, convert them to bullet points
  if (formData.form_fields && formData.form_fields.length > 0) {
    instruction += 'Bitte geben Sie folgende Informationen an:\n';
    formData.form_fields.forEach(field => {
      const fieldName = field.field_label || field.field_name || '';
      const expectedType = field.expected_answer_type || field.expected_content || '';
      instruction += `- ${fieldName} ${expectedType ? `(${expectedType})` : ''}\n`;
    });
  }
  
  // Add any additional info
  if (formData.additional_info) {
    instruction += '\n' + formData.additional_info;
  }
  
  // Add provided info
  if (formData.provided_info && Object.keys(formData.provided_info).length > 0) {
    instruction += '\n\nGegebene Informationen:\n';
    Object.entries(formData.provided_info).forEach(([key, value]) => {
      instruction += `- ${key}: ${value}\n`;
    });
  }
  
  return instruction.trim();
}

export default function UnifiedWritingExercise({
  taskData,
  taskId,
  userId,
  courseId,
  onComplete,
  mode = 'lesson'
}: UnifiedWritingExerciseProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  
  // Determine task type and extract instruction
  const getTaskInstruction = () => {
    if (isSimpleWritingTask(taskData)) {
      return taskData.instruction;
    } else if (isFormBasedTask(taskData)) {
      return convertFormToInstruction(taskData);
    }
    return 'No instruction available';
  };
  
  const getTaskLevel = () => {
    if (isSimpleWritingTask(taskData)) {
      return taskData.level;
    }
    // Default to A1 for form-based tasks
    return 'A1';
  };
  
  const getImageUrl = () => {
    if (isSimpleWritingTask(taskData)) {
      return taskData.image_url;
    }
    return null;
  };

  // Count words in text
  useEffect(() => {
    const text = userText.trim();
    if (text === '') {
      setWordCount(0);
    } else {
      const words = text.split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [userText]);

  const handleSubmit = async () => {
    if (!userText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Determine which evaluation endpoint to use based on task type
      const endpoint = mode === 'test' 
        ? '/api/writing-evaluations/telc-a1/section2-evaluation'
        : '/api/writing-evaluations/a1/essay-evaluation';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_data: isSimpleWritingTask(taskData) 
            ? taskData.instruction 
            : JSON.stringify(taskData),
          learner_response: userText,
          test_id: taskId,
          task_type: isFormBasedTask(taskData) ? 'form_converted' : 'essay'
        }),
      });

      if (!response.ok) throw new Error('Failed to evaluate response');
      
      const result = await response.json();
      setEvaluation(result);
      setShowEvaluation(true);
      
      // Mark as completed
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setError('Failed to submit response for evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const instruction = getTaskInstruction();
  const level = getTaskLevel();
  const imageUrl = getImageUrl();

  if (error && !taskData) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Schreibübung - {level}
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        </div>

        {/* Writing Prompt */}
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <div className="text-gray-700 whitespace-pre-wrap">
            {instruction}
          </div>
          {imageUrl && (
            <div className="mt-4">
              <img 
                src={imageUrl} 
                alt="Writing prompt reference" 
                className="rounded-lg max-w-full h-auto shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Writing Area */}
        {!showEvaluation ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ihre Antwort:
              </label>
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Schreiben Sie hier Ihre Antwort..."
                disabled={isSubmitting}
              />
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-gray-500">
                  Verwenden Sie einfache Sätze und klare Struktur
                </div>
                <div className="text-sm font-semibold text-gray-600">
                  {wordCount} Wörter
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!userText.trim() || isSubmitting || wordCount < 10}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Bewertung läuft...' : 'Antwort einreichen'}
              </button>
            </div>
          </div>
        ) : (
          /* Evaluation Results */
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <h3 className="text-xl font-semibold text-green-800 mb-4">
                Bewertungsergebnisse
              </h3>
              
              {evaluation?.total_score !== undefined && (
                <div className="text-right mb-4">
                  <div className="text-3xl font-bold text-green-700">
                    {evaluation.total_score}/{evaluation.max_total_score || 10}
                  </div>
                  <div className="text-sm text-green-600">
                    {((evaluation.total_score / (evaluation.max_total_score || 10)) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              
              {evaluation?.overall_evaluation && (
                <div className="bg-white rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {evaluation.overall_evaluation}
                  </p>
                </div>
              )}
            </div>

            {/* Grammar Corrections */}
            {evaluation?.grammar_errors && evaluation.grammar_errors.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 border-b">
                  <h4 className="font-semibold text-gray-800">
                    Grammatik & Rechtschreibung
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  {evaluation.grammar_errors.map((error: any, index: number) => (
                    <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                      <div className="text-sm">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded line-through">
                          {error.error}
                        </span>
                        <span className="mx-2">→</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          {error.correction}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        💡 {error.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}