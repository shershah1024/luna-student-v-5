import { useState, useEffect } from 'react';

interface ErrorCorrectionProps {
  question: any;
  selectedAnswer?: string;
  onAnswerChange: (questionId: string | number, answer: string) => void;
  showResults: boolean;
}

interface EvaluationResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  explanation?: string;
  missedErrors?: { error: string; correction: string }[];
  incorrectCorrections?: { attempted: string; correct: string }[];
}

/**
 * Renderer for error correction questions
 * User needs to find and correct grammatical errors in a sentence
 * Uses AI evaluation only when answer is not an exact match
 */
export default function ErrorCorrectionRenderer({
  question,
  selectedAnswer = '',
  onAnswerChange,
  showResults
}: ErrorCorrectionProps) {
  const [userInput, setUserInput] = useState(selectedAnswer || '');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (selectedAnswer !== undefined) {
      setUserInput(selectedAnswer);
    }
  }, [selectedAnswer]);

  // Check for exact match (case-insensitive, trimmed)
  const isExactMatch = () => {
    const normalizedInput = userInput?.trim()?.toLowerCase();
    const normalizedCorrect = question.correct_sentence?.toLowerCase();
    return normalizedInput === normalizedCorrect;
  };

  // Evaluate answer using AI when not an exact match
  const evaluateAnswer = async () => {
    // Skip evaluation if no answer or exact match
    if (!userInput?.trim() || isExactMatch()) return;

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-error-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAnswer: userInput.trim(),
          correctAnswer: question.correct_sentence,
          originalSentence: question.sentence,
          errorsCount: question.errors_count,
          errorPositions: question.error_positions,
          maxPoints: question.points || 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEvaluation(data.evaluation);
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Trigger evaluation when results are shown and answer is not exact match
  useEffect(() => {
    if (showResults && userInput?.trim() && !isExactMatch()) {
      evaluateAnswer();
    } else if (!showResults) {
      // Clear evaluation when not showing results
      setEvaluation(null);
    }
  }, [showResults, userInput]);

  const handleInputChange = (value: string) => {
    setUserInput(value);
    onAnswerChange(question.id, value);
  };

  // Determine if answer is correct (exact match or AI evaluation)
  const isCorrect = isExactMatch() || (evaluation?.isCorrect === true);

  return (
    <div className="space-y-4">
      {/* Input for corrected sentence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Corrected sentence:
        </label>
        <textarea
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={showResults}
          rows={3}
          className={`w-full p-3 border rounded-lg resize-none ${
            showResults
              ? isCorrect
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          }`}
          placeholder="Type the corrected sentence..."
        />
      </div>

      {/* Results display */}
      {showResults && (
        <div className={`p-4 rounded-lg ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className={`text-xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✓' : '✗'}
            </span>
            <div className="flex-1">
              {/* Show evaluation status for non-exact matches */}
              {!isExactMatch() && userInput?.trim() && (
                <div>
                  {isEvaluating ? (
                    <p className="text-gray-600">Evaluating your corrections...</p>
                  ) : evaluation ? (
                    <>
                      <p className={`font-medium ${evaluation.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {evaluation.feedback}
                      </p>
                      {evaluation.score !== undefined && (
                        <p className="text-sm text-gray-600 mt-1">
                          Score: {evaluation.score}/{evaluation.maxScore} points
                        </p>
                      )}
                      {evaluation.explanation && (
                        <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                          {evaluation.explanation}
                        </p>
                      )}
                      {evaluation.missedErrors && evaluation.missedErrors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 font-medium">Missed errors:</p>
                          <ul className="text-sm mt-1 space-y-1">
                            {evaluation.missedErrors.map((missed, index) => (
                              <li key={index} className="bg-white p-2 rounded">
                                <span className="text-red-600">"{missed.error}"</span>
                                {' should be '}
                                <span className="text-green-600">"{missed.correction}"</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {evaluation.incorrectCorrections && evaluation.incorrectCorrections.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 font-medium">Incorrect corrections:</p>
                          <ul className="text-sm mt-1 space-y-1">
                            {evaluation.incorrectCorrections.map((incorrect, index) => (
                              <li key={index} className="bg-white p-2 rounded">
                                You wrote: <span className="text-red-600">"{incorrect.attempted}"</span>
                                {' → Should be: '}
                                <span className="text-green-600">"{incorrect.correct}"</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-800 font-medium">Incorrect</p>
                  )}
                </div>
              )}

              {/* Show exact match feedback */}
              {isExactMatch() && (
                <p className="font-medium text-green-800">Perfect! All errors corrected.</p>
              )}

              {/* Show correct answer only if exact match failed or evaluation is complete */}
              {!isCorrect && !isEvaluating && (isExactMatch() || evaluation !== null) && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-medium">Correct answer:</p>
                  <p className="text-sm text-gray-800 mt-1 font-mono bg-white p-2 rounded">
                    {question.correct_sentence}
                  </p>
                  {question.error_positions && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-medium">Corrections needed:</p>
                      <ul className="list-disc list-inside mt-1">
                        {question.error_positions.map((error: any, index: number) => (
                          <li key={index}>
                            <span className="text-red-600 line-through">"{error.incorrect}"</span>
                            {' → '}
                            <span className="text-green-600">"{error.correct}"</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Show grammar rule explanation if available */}
              {question.explanation && showResults && (
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Grammar rule:</span> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}