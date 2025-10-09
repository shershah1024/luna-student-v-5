'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Brain } from 'lucide-react';

interface GrammarMultipleChoiceProps {
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  id: string;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
}

export function GrammarMultipleChoice({
  question,
  options,
  correctIndex,
  correctAnswer,
  id,
  onAnswer
}: GrammarMultipleChoiceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleOptionClick = (index: number) => {
    if (hasAnswered) return;
    
    setSelectedIndex(index);
    setHasAnswered(true);
    
    const isCorrect = index === correctIndex;
    onAnswer(isCorrect, index);
  };

  const getOptionStyle = (index: number) => {
    if (!hasAnswered) {
      return 'bg-white border-orange-200 hover:bg-orange-50 hover:border-orange-300 cursor-pointer';
    }
    
    if (index === correctIndex) {
      return 'bg-green-100 border-green-300 text-green-800';
    }
    
    if (index === selectedIndex && index !== correctIndex) {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    
    return 'bg-gray-100 border-gray-200 text-gray-600';
  };

  const getOptionIcon = (index: number) => {
    if (!hasAnswered) return null;
    
    if (index === correctIndex) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (index === selectedIndex && index !== correctIndex) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    
    return null;
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-800">Grammar Challenge</h3>
        </div>
        
        <p className="text-gray-800 mb-4 font-medium">{question}</p>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(index)}
              className={`
                p-3 rounded-lg border transition-all duration-200 flex items-center justify-between
                ${getOptionStyle(index)}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-sm font-bold flex items-center justify-center">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium">{option}</span>
              </div>
              {getOptionIcon(index)}
            </div>
          ))}
        </div>

        {hasAnswered && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
            {selectedIndex === correctIndex ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Richtig! Well done!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Not quite right.</span>
                </div>
                <div className="text-sm text-gray-700">
                  The correct answer is: <strong>{correctAnswer}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}