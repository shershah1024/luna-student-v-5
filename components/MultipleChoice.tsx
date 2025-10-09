import { useState } from 'react';
import { CheckCircle, X, Target, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';

export type MultipleChoiceProps = {
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer?: string; // Made optional with fallback
  id?: string;           // Made optional with fallback
  onAnswer?: (answer: string, isCorrect: boolean) => void;
};

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const MultipleChoice = ({
  question,
  options,
  correctIndex,
  correctAnswer,
  id,
  onAnswer
}: MultipleChoiceProps) => {
  console.log('[MultipleChoice] Component rendered with props:', {
    question,
    options,
    optionsType: typeof options,
    optionsIsArray: Array.isArray(options),
    optionsLength: options?.length,
    correctIndex,
    correctAnswer,
    id,
    hasOnAnswer: !!onAnswer
  });
  
  // Add fallback values for missing props
  const safeCorrectAnswer = correctAnswer || (options && correctIndex >= 0 && correctIndex < options.length ? options[correctIndex] : 'Unknown');
  const safeId = id || `mc-${Date.now()}`;
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Premium color themes for options - using our design system
  const colorThemes = [
    {
      normal: 'bg-white/80 border-slate-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30',
      selected: 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-100/50',
      correct: 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg shadow-emerald-100/50',
      incorrect: 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg shadow-red-100/50',
      disabled: 'border-slate-200 bg-slate-50/50'
    }
  ];

  const handleOptionClick = (index: number) => {
    if (isSubmitted) return;
    
    setSelectedIndex(index);
    setIsSubmitted(true);
    
    if (onAnswer) {
      const isCorrect = index === correctIndex;
      onAnswer(options[index], isCorrect);
    }
  };

  const getOptionStyling = (index: number) => {
    const isSelected = selectedIndex === index;
    const isCorrect = index === correctIndex;
    const theme = colorThemes[0]; // Use single theme for consistency
    
    const baseClass = cn(
      "border-2 rounded-2xl transition-all duration-300",
      utilityClasses.smoothTransition
    );
    
    if (!isSubmitted) {
      if (isSelected) {
        return cn(baseClass, theme.selected, "scale-[1.02]");
      }
      return cn(baseClass, theme.normal, "hover:scale-[1.01] hover:shadow-md");
    } else {
      if (isCorrect) {
        return cn(baseClass, theme.correct, "scale-[1.02]");
      } else if (isSelected) {
        return cn(baseClass, theme.incorrect, "scale-[1.02]");
      }
      return cn(baseClass, theme.disabled, "opacity-60");
    }
  };

  const getLetterStyling = (index: number) => {
    const isSelected = selectedIndex === index;
    const isCorrect = index === correctIndex;
    
    const baseClass = cn(
      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm"
    );
    
    if (!isSubmitted) {
      if (isSelected) {
        return cn(baseClass, "bg-blue-600 text-white shadow-blue-200/50");
      }
      return cn(baseClass, "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700");
    } else {
      if (isCorrect) {
        return cn(baseClass, "bg-emerald-600 text-white shadow-emerald-200/50");
      } else if (isSelected) {
        return cn(baseClass, "bg-red-600 text-white shadow-red-200/50");
      }
      return cn(baseClass, "bg-slate-200 text-slate-500");
    }
  };

  // Safety check for required props
  if (!options || !Array.isArray(options) || options.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-800 font-medium">Error: Multiple choice options are missing or invalid</p>
        <pre className="text-sm text-red-600 mt-2">
          {JSON.stringify({ question, options, correctIndex, correctAnswer: safeCorrectAnswer, id: safeId }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/10 bg-gradient-to-br from-rose-50 to-white shadow-md p-4 space-y-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/chat-pattern.svg')] opacity-5 pointer-events-none" />
      
      {/* Question Header - Compact */}
      <div className="text-center relative z-10">
        <div className="flex items-center gap-2 justify-center mb-3">
          <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
            <HelpCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Multiple Choice</span>
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2 leading-snug max-w-xl mx-auto">{question}</h3>
        <p className="text-sm text-slate-600">Select the best answer</p>
      </div>

      {/* Options - Compact */}
      <div className="space-y-2 max-w-2xl mx-auto relative z-10">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;
          
          return (
            <div
              key={`${safeId}-option-${index}`}
              onClick={() => handleOptionClick(index)}
              className={cn(
                "w-full p-3 cursor-pointer select-none group",
                getOptionStyling(index),
                !isSubmitted && "hover:scale-[1.01] active:scale-[0.99]"
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(index);
                }
              }}
            >
              <div className="flex items-center gap-3">
                {/* Letter/Icon Circle - Smaller */}
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm",
                  isSubmitted && isCorrect ? "bg-emerald-600 text-white shadow-emerald-200/50" :
                  isSubmitted && isSelected && !isCorrect ? "bg-red-600 text-white shadow-red-200/50" :
                  isSubmitted ? "bg-slate-200 text-slate-500" :
                  isSelected ? "bg-blue-600 text-white shadow-blue-200/50" :
                  "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                )}>
                  {isSubmitted && isCorrect ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : isSubmitted && isSelected && !isCorrect ? (
                    <X className="h-3 w-3" />
                  ) : (
                    OPTION_LETTERS[index]
                  )}
                </div>
                
                {/* Option Text - Smaller */}
                <span className={cn(
                  "font-medium flex-1 text-sm leading-snug transition-all duration-300",
                  isSubmitted && isCorrect 
                    ? "text-emerald-800 font-semibold" 
                    : isSubmitted && isSelected && !isCorrect 
                      ? "text-red-800 font-semibold"
                      : isSubmitted 
                        ? "text-slate-500" 
                        : "text-slate-700"
                )}>
                  {option}
                </span>
                
                {/* Correct Badge - Smaller */}
                {isSubmitted && isCorrect && (
                  <div className="flex-shrink-0">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium border border-emerald-200">
                      ✓ Correct
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Messages - Compact */}
      {isSubmitted && selectedIndex !== correctIndex && (
        <div className="relative z-10 p-3 bg-gradient-to-br from-rose-100/80 to-orange-100/80 backdrop-blur-sm border border-rose-200/50 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-rose-800 text-sm">Correct Answer</span>
          </div>
          <p className="text-rose-700 text-sm font-medium">
            "{options[correctIndex]}"
          </p>
        </div>
      )}

      {isSubmitted && selectedIndex === correctIndex && (
        <div className="relative z-10 p-3 bg-gradient-to-br from-emerald-100/80 to-green-100/80 backdrop-blur-sm border border-emerald-200/50 rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-emerald-800 text-sm">Excellent! Perfect answer!</span>
          </div>
        </div>
      )}
    </div>
  );
};