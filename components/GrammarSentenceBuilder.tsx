'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, Shuffle } from 'lucide-react';

interface GrammarSentenceBuilderProps {
  words: string[];
  correctSentence: string;
  hint?: string;
  id: string;
  onAnswer: (isCorrect: boolean, userSentence: string) => void;
}

export function GrammarSentenceBuilder({
  words,
  correctSentence,
  hint,
  id,
  onAnswer
}: GrammarSentenceBuilderProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([...words]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const moveWordToSentence = (word: string, fromIndex: number) => {
    if (hasAnswered) return;
    
    setSelectedWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, index) => index !== fromIndex));
  };

  const moveWordToAvailable = (word: string, fromIndex: number) => {
    if (hasAnswered) return;
    
    setAvailableWords(prev => [...prev, word]);
    setSelectedWords(prev => prev.filter((_, index) => index !== fromIndex));
  };

  const resetSentence = () => {
    if (hasAnswered) return;
    
    setSelectedWords([]);
    setAvailableWords([...words]);
  };

  const shuffleWords = () => {
    if (hasAnswered) return;
    
    setAvailableWords(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const checkAnswer = () => {
    if (hasAnswered || selectedWords.length === 0) return;
    
    const userSentence = selectedWords.join(' ');
    const correct = userSentence.toLowerCase().trim() === correctSentence.toLowerCase().trim();
    
    setIsCorrect(correct);
    setHasAnswered(true);
    onAnswer(correct, userSentence);
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shuffle className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Sentence Builder</h3>
        </div>
        
        {/* Hint */}
        {hint && (
          <div className="mb-3 p-2 bg-orange-100 rounded-lg">
            <p className="text-sm text-orange-700">💡 {hint}</p>
          </div>
        )}
        
        {/* Sentence Construction Area */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-orange-700 mb-2">Build your sentence:</h4>
          <div className="min-h-[60px] bg-white border-2 border-dashed border-orange-300 rounded-lg p-3 flex flex-wrap gap-2 items-center">
            {selectedWords.length === 0 ? (
              <span className="text-gray-400 italic">Drag words here to build your sentence...</span>
            ) : (
              selectedWords.map((word, index) => (
                <button
                  key={`selected-${index}`}
                  onClick={() => moveWordToAvailable(word, index)}
                  disabled={hasAnswered}
                  className={`
                    px-3 py-1 rounded-md border transition-colors
                    ${hasAnswered 
                      ? 'bg-orange-100 border-orange-200 cursor-default' 
                      : 'bg-orange-100 border-orange-300 hover:bg-orange-200 cursor-pointer'
                    }
                    text-orange-800 font-medium
                  `}
                >
                  {word}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Available Words */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-orange-700">Available words:</h4>
            <div className="flex gap-2">
              {!hasAnswered && (
                <>
                  <button
                    onClick={shuffleWords}
                    className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                    title="Shuffle words"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={resetSentence}
                    className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                    title="Reset sentence"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availableWords.map((word, index) => (
              <button
                key={`available-${index}`}
                onClick={() => moveWordToSentence(word, index)}
                disabled={hasAnswered}
                className={`
                  px-3 py-1 rounded-md border transition-colors
                  ${hasAnswered 
                    ? 'bg-gray-100 border-gray-200 cursor-default text-gray-600' 
                    : 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-300 cursor-pointer'
                  }
                  font-medium
                `}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* Check Answer Button */}
        {!hasAnswered && (
          <div className="text-center">
            <button
              onClick={checkAnswer}
              disabled={selectedWords.length === 0}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Check Sentence
            </button>
          </div>
        )}

        {/* Result */}
        {hasAnswered && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
            {isCorrect ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Excellent! Perfect word order!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Good try! Let's check the correct order.</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Your sentence:</strong> {selectedWords.join(' ')}
                  </div>
                  <div>
                    <strong>Correct sentence:</strong> <span className="text-orange-700">{correctSentence}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}