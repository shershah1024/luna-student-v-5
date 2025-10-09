'use client';

import { useState, useEffect } from 'react';
import { Send, Trophy, RotateCcw } from 'lucide-react';

export type FillInTheBlanksExerciseProps = {
  sentence: string;
  correctAnswer: string;
  hint?: string;
  englishTranslation?: string;
  id?: string;
  onComplete?: (completeSentence: string, isCorrect: boolean) => void;
};

export function FillInTheBlanksExercise({
  sentence,
  correctAnswer,
  hint,
  englishTranslation,
  id,
  onComplete
}: FillInTheBlanksExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (submitted) return;
    setUserAnswer(e.target.value);
  };
  
  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    
    setSubmitted(true);
    
    // Check if answer is correct (case insensitive)
    const correct = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    
    // Create complete sentence by replacing the blank with user's answer
    const completeSentence = sentence.replace('_____', userAnswer.trim());
    
    if (onComplete) {
      onComplete(completeSentence, correct);
    }
  };
  
  const handleRetake = () => {
    setUserAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !submitted) {
      handleSubmit();
    }
  };
  
  // Split sentence into parts around the blank
  const sentenceParts = sentence.split('_____');
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">Fill in the Blank</h3>
          {hint && (
            <p className="text-sm text-gray-600 mb-2">💡 {hint}</p>
          )}
          <p className="text-xs text-gray-500 italic">Type the German word that completes the sentence.</p>
        </div>
      </div>
      
      {/* Sentence with input field */}
      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-lg text-gray-800 flex items-center flex-wrap">
          <span>{sentenceParts[0]}</span>
          <input
            type="text"
            value={userAnswer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={submitted}
            placeholder="___"
            className={`mx-2 px-3 py-1 border-b-2 bg-transparent text-center font-medium min-w-[100px] focus:outline-none ${
              submitted 
                ? isCorrect 
                  ? 'border-green-500 text-green-700' 
                  : 'border-red-500 text-red-700'
                : 'border-blue-500 focus:border-blue-600'
            } ${submitted ? 'cursor-default' : ''}`}
          />
          <span>{sentenceParts[1]}</span>
        </div>
        
        {englishTranslation && (
          <div className="mt-2 text-sm text-gray-500 italic">
            English: {englishTranslation}
          </div>
        )}
      </div>
      
      {/* Results */}
      {submitted && (
        <div className={`mb-4 border rounded-lg p-3 ${
          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={`h-4 w-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`font-semibold text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </span>
          </div>
          
          <div className="text-sm space-y-1">
            <div>
              <span className="text-gray-600">Your answer: </span>
              <span className="font-medium">{userAnswer}</span>
            </div>
            {!isCorrect && (
              <div>
                <span className="text-gray-600">Correct answer: </span>
                <span className="font-medium text-green-700">{correctAnswer}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Submit Answer
          </button>
        ) : null}
        
        <button
          onClick={handleRetake}
          className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw className="h-3 w-3" />
          {submitted ? 'Try Again' : 'Reset'}
        </button>
      </div>
    </div>
  );
}

export default FillInTheBlanksExercise;