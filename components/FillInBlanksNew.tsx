import { useState } from 'react';
import { CheckCircle, X, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  // Split text by [blank] placeholders
  const textParts = text.split('[blank]');

  const handleInputChange = (index: number, value: string) => {
    if (isSubmitted) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const evaluateAnswer = async (userAnswer: string, correctAnswer: string, index: number): Promise<boolean> => {
    // First check exact match locally
    const exactMatch = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    if (exactMatch) {
      return true;
    }

    // If not exact match, use backend AI evaluation
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
        console.error('Backend evaluation failed:', response.statusText);
        return false; // Fallback to marking as incorrect
      }

      const result = await response.json();
      return result.is_correct;
    } catch (error) {
      console.error('Error calling backend evaluation:', error);
      return false; // Fallback to marking as incorrect
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted || isEvaluating) return;
    
    console.log('[FillInBlanks] Starting submission...');
    setIsEvaluating(true);
    
    try {
      // Evaluate all answers
      const evaluationPromises = userAnswers.map((userAnswer, index) => 
        evaluateAnswer(userAnswer, answers[index], index)
      );
      
      const evaluationResults = await Promise.all(evaluationPromises);
      const isAllCorrect = evaluationResults.every(result => result);
      
      setResults(evaluationResults);
      setIsSubmitted(true);
      
      console.log('[FillInBlanks] Evaluation complete:', { userAnswers, isAllCorrect });
      
      if (onComplete) {
        onComplete(userAnswers, isAllCorrect);
      }
      
    } catch (error) {
      console.error('[FillInBlanks] Error during evaluation:', error);
      // Fallback to simple evaluation
      const fallbackResults = userAnswers.map((answer, index) => 
        answer.trim().toLowerCase() === answers[index].trim().toLowerCase()
      );
      const isAllCorrect = fallbackResults.every(result => result);
      
      setResults(fallbackResults);
      setIsSubmitted(true);
      
      if (onComplete) {
        onComplete(userAnswers, isAllCorrect);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const canSubmit = userAnswers.every(answer => answer.trim() !== '') && !isSubmitted && !isEvaluating;

  return (
    <div className="rounded-lg border-2 border-rose-200 bg-white shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Fill in the Blanks</h3>
        <p className="text-sm text-gray-600">Complete the text with the missing words</p>
      </div>

      {/* Text with Input Fields */}
      <div className="text-base text-gray-800 leading-relaxed">
        {textParts.map((part, index) => (
          <span key={`${id}-part-${index}`}>
            {part}
            {index < textParts.length - 1 && (
              <span className="inline-block mx-1 relative">
                <input
                  type="text"
                  value={userAnswers[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  disabled={isSubmitted || isEvaluating}
                  placeholder="..."
                  className={cn(
                    "w-32 px-3 py-2 text-center border-2 rounded-md text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500",
                    "disabled:cursor-not-allowed disabled:bg-gray-50",
                    isSubmitted && results.length > 0
                      ? results[index]
                        ? 'border-green-400 bg-green-50 text-green-800'
                        : 'border-red-400 bg-red-50 text-red-800'
                      : isEvaluating
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                  )}
                />
                
                {/* Result Icons */}
                {isSubmitted && results.length > 0 && (
                  <div className={cn(
                    "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10",
                    results[index] ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  )}>
                    {results[index] ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </div>
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* German Special Characters */}
      {!isSubmitted && (
        <div className="text-center">
          <div className="inline-block p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">German Characters:</p>
            <div className="flex gap-1 justify-center">
              {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => {
                    // Simple insertion at the end of the first empty field
                    const firstEmptyIndex = userAnswers.findIndex(answer => answer === '');
                    if (firstEmptyIndex !== -1) {
                      handleInputChange(firstEmptyIndex, userAnswers[firstEmptyIndex] + char);
                    }
                  }}
                  disabled={isEvaluating}
                  className="w-8 h-8 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!isSubmitted && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "px-8 py-3 rounded-lg font-semibold transition-all duration-200",
              canSubmit
                ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isEvaluating ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Checking...
              </span>
            ) : (
              'Submit Answers'
            )}
          </button>
        </div>
      )}

      {/* Results Summary */}
      {isSubmitted && results.length > 0 && (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            {results.every(r => r) ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">All Correct!</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-800">
                  {results.filter(r => r).length} out of {results.length} correct
                </span>
              </>
            )}
          </div>
          
          {/* Show correct answers for wrong ones */}
          {!results.every(r => r) && (
            <div className="text-sm text-gray-600 space-y-1">
              {results.map((isCorrect, index) => 
                !isCorrect ? (
                  <div key={index}>
                    Blank {index + 1}: "{answers[index]}"
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};