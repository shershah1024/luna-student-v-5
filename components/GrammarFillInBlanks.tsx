'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Edit3 } from 'lucide-react';

interface GrammarFillInBlanksProps {
  text: string;
  answer: string;
  hint?: string;
  id: string;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
}

export function GrammarFillInBlanks({
  text,
  answer,
  hint,
  id,
  onAnswer
}: GrammarFillInBlanksProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Split text at [blank] or _____ markers
  const textParts = text.split(/\[blank\]|_____/);
  
  const handleSubmit = () => {
    if (hasAnswered || userAnswer.trim() === '') return;
    
    const correct = userAnswer.trim().toLowerCase() === answer.toLowerCase();
    setIsCorrect(correct);
    setHasAnswered(true);
    onAnswer(correct, userAnswer.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Edit3 className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Fill in the Blank</h3>
        </div>
        
        {/* Hint */}
        {hint && (
          <div className="mb-3 p-2 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-700">💡 {hint}</p>
          </div>
        )}
        
        {/* Text with Input */}
        <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
          <div className="text-lg leading-relaxed">
            {textParts.map((part, index) => (
              <span key={index}>
                {part}
                {index < textParts.length - 1 && (
                  <span className="inline-flex items-center">
                    {hasAnswered ? (
                      <span className={`
                        px-3 py-1 rounded font-medium border-2
                        ${isCorrect 
                          ? 'bg-green-100 border-green-300 text-green-800' 
                          : 'bg-red-100 border-red-300 text-red-800'
                        }
                      `}>
                        {userAnswer}
                        {isCorrect ? (
                          <CheckCircle className="inline ml-1 h-4 w-4" />
                        ) : (
                          <XCircle className="inline ml-1 h-4 w-4" />
                        )}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="..."
                        className="w-24 px-2 py-1 border-2 border-orange-300 rounded focus:border-orange-500 focus:outline-none text-center font-medium"
                        autoFocus={index === 0}
                      />
                    )}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        {!hasAnswered && (
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={userAnswer.trim() === ''}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Check Answer
            </button>
          </div>
        )}

        {/* Result */}
        {hasAnswered && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
            {isCorrect ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Perfect! That's correct!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Not quite right.</span>
                </div>
                <div className="text-sm text-gray-700">
                  The correct answer is: <strong className="text-orange-700">{answer}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}