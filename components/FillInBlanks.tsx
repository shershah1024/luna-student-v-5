import { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle, X, HelpCircle, Clock, Target, Edit3, Type, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

export type FillInBlanksProps = {
  text: string;
  answers: string[];
  hints: string[];
  id: string;
  onComplete?: (userAnswers: string[], isAllCorrect: boolean) => void;
  assignmentId?: string;
  userEmail?: string;
};

export const FillInBlanks = ({
  text,
  answers,
  hints,
  id,
  onComplete,
  assignmentId = 'default-assignment',
  userEmail = 'default@example.com'
}: FillInBlanksProps) => {
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(answers.length).fill(''));
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<boolean[]>([]);
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(answers.length).fill(null));
  const isSubmittingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  
  // Split text by [blank] placeholders
  const textParts = text.split('[blank]');

  // Debug component lifecycle
  useEffect(() => {
    console.log('[FillInBlanks] Component mounted for id:', id);
    return () => {
      console.log('[FillInBlanks] Component unmounted for id:', id);
    };
  }, [id]);

  useEffect(() => {
    console.log('[FillInBlanks] Props changed:', { id, text, answers });
  }, [id, text, answers]);
  
  const handleInputChange = (index: number, value: string) => {
    if (submitted) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
    // Removed auto-submit functionality
  };
  
  const insertSpecialChar = (char: string) => {
    if (activeInputIndex === null || submitted) return;
    
    const input = inputRefs.current[activeInputIndex];
    if (!input) return;
    
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    
    const newValue = 
      userAnswers[activeInputIndex].substring(0, selectionStart) + 
      char + 
      userAnswers[activeInputIndex].substring(selectionEnd);
    
    const newAnswers = [...userAnswers];
    newAnswers[activeInputIndex] = newValue;
    setUserAnswers(newAnswers);
    
    // Set cursor position after the inserted character
    setTimeout(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }
    }, 0);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const evaluateAnswer = async (userAnswer: string, correctAnswer: string, index: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/evaluate-fill-in-blank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          answer_explanation: hints[index] || '',
          assignmentId,
          userEmail
        })
      });

      if (!response.ok) {
        console.error('Failed to evaluate answer:', response.statusText);
        // Fallback to simple comparison
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }

      const result = await response.json();
      return result.is_correct;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Fallback to simple comparison
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }
  };

  const handleSubmit = useCallback(async () => {
    // More aggressive duplicate prevention using ref
    if (isSubmittingRef.current || submitted || evaluating) {
      console.log('handleSubmit: Already submitting/submitted/evaluating, ignoring duplicate call', {
        isSubmittingRef: isSubmittingRef.current,
        submitted,
        evaluating
      });
      return;
    }
    
    console.log('handleSubmit: Starting evaluation...');
    isSubmittingRef.current = true; // Set immediately to block future calls
    setEvaluating(true);
    // Don't set submitted immediately - wait until evaluation is done to prevent layout shift
    
    try {
      // First, check for exact matches locally
      const localResults: boolean[] = [];
      const needsBackendEvaluation: Array<{ index: number; userAnswer: string; correctAnswer: string }> = [];
      
      userAnswers.forEach((userAnswer, index) => {
        const isExactMatch = userAnswer.trim().toLowerCase() === answers[index].trim().toLowerCase();
        localResults[index] = isExactMatch;
        
        if (!isExactMatch) {
          needsBackendEvaluation.push({
            index,
            userAnswer,
            correctAnswer: answers[index]
          });
        }
      });
      
      // If all answers are exact matches, no need for backend evaluation
      if (needsBackendEvaluation.length === 0) {
        setEvaluationResults(localResults);
        const isAllCorrect = localResults.every(result => result);
        
        if (onComplete) {
          console.log('[FillInBlanks] Calling onComplete with (exact matches):', { userAnswers, isAllCorrect });
          onComplete(userAnswers, isAllCorrect);
        }
        
        // Set submitted after completion to prevent layout shift during click
        setSubmitted(true);
      } else {
        // Only evaluate non-exact matches with backend AI
        const backendPromises = needsBackendEvaluation.map(({ index, userAnswer, correctAnswer }) => 
          evaluateAnswer(userAnswer, correctAnswer, index).then(result => ({ index, result }))
        );
        
        const backendResults = await Promise.all(backendPromises);
        
        // Merge local and backend results
        const finalResults = [...localResults];
        backendResults.forEach(({ index, result }) => {
          finalResults[index] = result;
        });
        
        setEvaluationResults(finalResults);
        const isAllCorrect = finalResults.every(result => result);
        
        if (onComplete) {
          console.log('[FillInBlanks] Calling onComplete with (AI evaluation):', { userAnswers, isAllCorrect });
          onComplete(userAnswers, isAllCorrect);
        }
        
        // Set submitted after completion to prevent layout shift during click
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error during evaluation:', error);
      // Fallback to simple evaluation
      const isAllCorrect = userAnswers.every((answer, index) => 
        answer.trim().toLowerCase() === answers[index].trim().toLowerCase()
      );
      setEvaluationResults(userAnswers.map((answer, index) => 
        answer.trim().toLowerCase() === answers[index].trim().toLowerCase()
      ));
      
      if (onComplete) {
        console.log('[FillInBlanks] Calling onComplete with (fallback):', { userAnswers, isAllCorrect });
        onComplete(userAnswers, isAllCorrect);
      }
      
      // Set submitted after completion to prevent layout shift during click
      setSubmitted(true);
    } finally {
      console.log('[FillInBlanks] Setting evaluating to false - submit button should now be hidden');
      setEvaluating(false);
      // Don't reset isSubmittingRef here - keep it true to prevent future submissions
    }
  }, [userAnswers, answers, submitted, evaluating, onComplete, assignmentId, userEmail]);
  
  const isCorrect = (index: number) => {
    if (evaluationResults.length > 0) {
      return evaluationResults[index];
    }
    // Fallback to simple comparison if no AI evaluation yet
    return userAnswers[index].trim().toLowerCase() === answers[index].trim().toLowerCase();
  };
  
  return (
    <div className="rounded-lg border-2 border-primary/10 bg-gradient-to-br from-rose-50 to-white shadow-md p-4 space-y-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/chat-pattern.svg')] opacity-5 pointer-events-none" />
      
      {/* Header - Compact */}
      <div className="text-center relative z-10">
        <div className="flex items-center gap-2 justify-center mb-3">
          <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
            <Edit3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Fill in the Blanks</span>
        </div>
        <p className="text-sm text-slate-600">Complete the text with missing words</p>
      </div>

      {/* Text with Inputs - Compact */}
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-base text-slate-800 leading-normal">
          {textParts.map((part, index) => (
            <span key={`${id}-part-${index}`}>
              {part}
              {index < textParts.length - 1 && (
                <span className="inline-block mx-2 relative">
                  <div className="relative inline-block group">
                    <div className="inline-block relative">
                      <input
                        type="text"
                        value={userAnswers[index]}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => {
                          if (!evaluating) setActiveInputIndex(index);
                        }}
                        onBlur={() => {
                          if (!evaluating) setActiveInputIndex(null);
                        }}
                        ref={(el) => {
                          if (inputRefs.current) {
                            inputRefs.current[index] = el;
                          }
                        }}
                        disabled={submitted || evaluating}
                        placeholder="..."
                        className={cn(
                          "w-24 px-2 py-1.5 text-center border-2 rounded-lg text-sm font-medium transition-all duration-300 relative",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                          "disabled:cursor-not-allowed",
                          hints[index] && !submitted && "pr-6",
                          submitted && evaluationResults.length > 0
                            ? evaluationResults[index]
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-200/50'
                              : 'border-red-400 bg-red-50 text-red-800 shadow-md ring-2 ring-red-200/50'
                            : evaluating
                              ? 'border-blue-300 bg-blue-50/50 opacity-75 ring-2 ring-blue-200/30'
                              : 'border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm'
                        )}
                      />
                      
                      {/* Green tick for correct answers */}
                      {submitted && evaluationResults.length > 0 && evaluationResults[index] && !evaluating && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-white z-10">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                      
                      {/* Red X for incorrect answers */}
                      {submitted && evaluationResults.length > 0 && !evaluationResults[index] && !evaluating && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-white z-10">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                      
                      {/* Premium Loading indicator */}
                      {evaluating && (
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-gradient-to-br from-blue-100/90 to-indigo-100/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-200/50 shadow-lg animate-pulse">
                          <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                          <span className="text-sm font-semibold text-blue-700">Checking your answer...</span>
                        </div>
                      )}
                      
                      {/* Premium feedback after evaluation */}
                      {submitted && evaluationResults.length > 0 && !evaluating && (
                        <div className={cn(
                          "absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-xl border font-semibold text-sm whitespace-nowrap shadow-lg backdrop-blur-sm",
                          evaluationResults[index]
                            ? 'bg-gradient-to-br from-emerald-100/90 to-green-100/90 border-emerald-300/50 text-emerald-800'
                            : 'bg-gradient-to-br from-red-100/90 to-pink-100/90 border-red-300/50 text-red-800'
                        )}>
                          {evaluationResults[index] ? (
                            <>
                              <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                              <span className="font-bold">Perfect!</span>
                            </>
                          ) : (
                            <>
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                <X className="h-3 w-3" />
                              </div>
                              <span>Correct: <span className="font-bold">"{answers[index]}"</span></span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Premium Hint Button & Popup */}
                    {hints[index] && !submitted && (
                      <>
                        <button 
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 hover:text-blue-700 focus:outline-none transition-all duration-200 hover:scale-110"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveHintIndex(activeHintIndex === index ? null : index);
                          }}
                          aria-label="Show hint"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </button>
                        {activeHintIndex === index && (
                          <div className={cn(
                            utilityClasses.premiumCard,
                            "absolute z-20 top-full left-0 mt-3 p-4 bg-blue-50/90 backdrop-blur-sm border border-blue-200/50 rounded-xl shadow-lg text-sm text-slate-700 w-48"
                          )}>
                            <div className="flex items-center gap-2 font-semibold text-blue-700 mb-2">
                              <HelpCircle className="h-4 w-4" />
                              Hint
                            </div>
                            <p className="leading-relaxed">{hints[index]}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
        
      {/* German Special Characters - Compact */}
      {!submitted && (
        <div className="text-center relative z-10">
          <div className="p-3 bg-gradient-to-br from-rose-100/80 to-pink-100/80 backdrop-blur-sm border border-rose-200/50 rounded-lg shadow-md inline-block">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-gradient-to-br from-rose-500 to-rose-600 rounded-md flex items-center justify-center">
                <Type className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-xs font-medium text-slate-700">German Characters</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertSpecialChar(char)}
                  disabled={activeInputIndex === null || evaluating}
                  className={cn(
                    "w-6 h-6 flex items-center justify-center border rounded-lg font-medium transition-all duration-200 text-xs",
                    "focus:outline-none focus:ring-2 focus:ring-rose-500/20",
                    activeInputIndex !== null && !evaluating
                      ? "bg-white border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 hover:scale-110 active:scale-95 shadow-sm"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                  title={activeInputIndex !== null && !evaluating ? `Insert ${char}` : "Select an input field first"}
                >
                  {char}
                </button>
              ))}
            </div>
            {activeInputIndex === null && !evaluating && (
              <p className="text-xs text-slate-500 mt-2">Click on an input field first, then select a character</p>
            )}
          </div>
        </div>
      )}

      {/* Submit Button - Keep visible to prevent layout shift */}
      {!submitted && (
        <div className="flex flex-col items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Aggressive debouncing - prevent clicks within 500ms
              const now = Date.now();
              if (now - lastClickTimeRef.current < 500) {
                console.log('[FillInBlanks] Click ignored due to debouncing:', now - lastClickTimeRef.current, 'ms since last click');
                return;
              }
              lastClickTimeRef.current = now;
              
              console.log('[FillInBlanks] Submit button clicked, calling handleSubmit');
              handleSubmit();
            }}
            disabled={submitted || evaluating || isSubmittingRef.current || userAnswers.some(answer => answer.trim() === '')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 flex items-center gap-2 min-w-[160px] justify-center",
              submitted || evaluating || isSubmittingRef.current || userAnswers.some(answer => answer.trim() === '')
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-slate-200/50"
                : "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 hover:scale-105 active:scale-95 shadow-rose-500/25 hover:shadow-lg"
            )}
          >
            {evaluating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Submit Answers
              </>
            )}
          </button>
          
          {userAnswers.some(answer => answer.trim() === '') && !evaluating && (
            <div className="p-2 bg-gradient-to-br from-rose-100/80 to-amber-100/80 backdrop-blur-sm border border-rose-200/50 rounded-lg shadow-md text-center">
              <p className="text-rose-700 text-xs font-medium">
                Please fill in all blanks before submitting
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overall Feedback - Compact */}
      {submitted && evaluationResults.length > 0 && !evaluating && !evaluationResults.every(result => result) && (
        <div className="relative z-10 p-3 bg-gradient-to-br from-rose-100/80 to-orange-100/80 backdrop-blur-sm border border-rose-200/50 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-rose-800 text-sm">Results Summary</span>
          </div>
          <p className="text-rose-700 text-sm">
            <strong>{evaluationResults.filter(result => result).length}</strong> out of <strong>{evaluationResults.length}</strong> correct.
          </p>
        </div>
      )}
    </div>
  );
};
