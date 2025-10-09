'use client';

import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface MultipleChoiceQuestionProps {
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  id: string;
  onAnswer?: (isCorrect: boolean, selectedIndex: number) => void;
}

export function MultipleChoiceQuestion({
  question,
  options,
  correctIndex,
  correctAnswer,
  id,
  onAnswer
}: MultipleChoiceQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (index: number) => {
    if (showResult) return; // Prevent changing answer after submission
    
    setSelectedIndex(index);
    setShowResult(true);
    
    const isCorrect = index === correctIndex;
    onAnswer?.(isCorrect, index);
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 cursor-pointer";
    }
    
    if (index === correctIndex) {
      return "bg-green-50 border-green-300 text-green-800";
    }
    
    if (index === selectedIndex && index !== correctIndex) {
      return "bg-red-50 border-red-300 text-red-800";
    }
    
    return "bg-gray-50 border-gray-200 text-gray-600";
  };

  const getOptionIcon = (index: number) => {
    if (!showResult) return null;
    
    if (index === correctIndex) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (index === selectedIndex && index !== correctIndex) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    
    return null;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Multiple Choice Question</h3>
        <p className="text-gray-700">{question}</p>
      </div>
      
      <div className="space-y-2">
        {options && options.length > 0 ? options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(index)}
            disabled={showResult}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${getOptionStyle(index)}`}
          >
            <span className="font-medium">
              {String.fromCharCode(65 + index)}. {option}
            </span>
            {getOptionIcon(index)}
          </button>
        )) : (
          <div className="text-red-500 p-3 bg-red-50 rounded-lg">
            Error: No options available for this question. Options received: {JSON.stringify(options)}
          </div>
        )}
      </div>
      
      {showResult && (
        <div className="mt-4 p-3 rounded-lg bg-white border">
          {selectedIndex === correctIndex ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Correct!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Incorrect</span>
              </div>
              <p className="text-sm text-gray-600">
                The correct answer is: <strong>{correctAnswer}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}