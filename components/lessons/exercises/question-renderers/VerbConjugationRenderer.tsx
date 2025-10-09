import { useState, useEffect } from 'react';

interface VerbConjugationProps {
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
  spellingNote?: string;
}

/**
 * Renderer for verb conjugation questions
 * User needs to conjugate a verb in the correct tense and form
 * Uses AI evaluation only when answer is not an exact match
 */
export default function VerbConjugationRenderer({
  question,
  selectedAnswer = '',
  onAnswerChange,
  showResults
}: VerbConjugationProps) {
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
    const normalizedCorrect = question.correct_answer?.toLowerCase();
    return normalizedInput === normalizedCorrect;
  };

  // Evaluate answer using AI when not an exact match
  const evaluateAnswer = async () => {
    // Skip evaluation if no answer or exact match
    if (!userInput?.trim() || isExactMatch()) return;

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-verb-conjugation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAnswer: userInput.trim(),
          correctAnswer: question.correct_answer,
          verb: question.verb,
          tense: question.tense,
          subject: question.subject,
          sentenceContext: question.sentence_context,
          maxPoints: question.points || 1
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
      {/* Verb information */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-xs font-medium text-indigo-700">Verb</p>
          <p className="text-lg font-bold text-indigo-900">{question.verb}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs font-medium text-green-700">Tense</p>
          <p className="text-lg font-bold text-green-900">{question.tense}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs font-medium text-purple-700">Subject</p>
          <p className="text-lg font-bold text-purple-900">{question.subject}</p>
        </div>
      </div>

      {/* Context sentence if provided */}
      {question.sentence_context && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">Use in context:</p>
          <p className="text-gray-800 mt-1 italic">{question.sentence_context}</p>
        </div>
      )}

      {/* Input for conjugated verb */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer:
        </label>
        <input
          type="text"
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={showResults}
          className={`w-full p-3 border rounded-lg ${
            showResults
              ? isCorrect
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          }`}
          placeholder="Type the conjugated verb..."
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
                    <p className="text-gray-600">Evaluating your conjugation...</p>
                  ) : evaluation ? (
                    <>
                      <p className={`font-medium ${evaluation.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {evaluation.feedback}
                      </p>
                      {evaluation.score !== undefined && (
                        <p className="text-sm text-gray-600 mt-1">
                          Score: {evaluation.score}/{evaluation.maxScore} point{evaluation.maxScore !== 1 ? 's' : ''}
                        </p>
                      )}
                      {evaluation.spellingNote && (
                        <p className="text-sm text-blue-700 mt-2 bg-blue-50 p-2 rounded">
                          {evaluation.spellingNote}
                        </p>
                      )}
                      {evaluation.explanation && (
                        <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded">
                          {evaluation.explanation}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-red-800 font-medium">Incorrect</p>
                  )}
                </div>
              )}

              {/* Show exact match feedback */}
              {isExactMatch() && (
                <p className="font-medium text-green-800">Correct!</p>
              )}

              {/* Show correct answer only if exact match failed or evaluation is complete */}
              {!isCorrect && !isEvaluating && (isExactMatch() || evaluation !== null) && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    The correct answer is: <span className="font-bold">{question.correct_answer}</span>
                  </p>
                  {question.sentence_context && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      Example: {question.sentence_context.replace('___', question.correct_answer)}
                    </p>
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