'use client';

import { useState, useEffect } from 'react';
import { Send, Trophy, RotateCcw, X } from 'lucide-react';

// Simple color themes for matching pairs
const MATCH_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400' },
  { bg: 'bg-green-100', border: 'border-green-400' },
  { bg: 'bg-purple-100', border: 'border-purple-400' },
  { bg: 'bg-yellow-100', border: 'border-yellow-400' },
  { bg: 'bg-pink-100', border: 'border-pink-400' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400' },
  { bg: 'bg-orange-100', border: 'border-orange-400' },
  { bg: 'bg-teal-100', border: 'border-teal-400' },
];

type MatchPair = {
  leftId: string;
  rightId: string;
};

export type VocabularyMatchingExerciseProps = {
  instructions: string;
  leftItems: Array<{id: string; text: string}>;
  rightItems: Array<{id: string; text: string}>;
  correctPairs: MatchPair[];
  id?: string;
  onComplete?: (matchResults: string) => void;
};

export function VocabularyMatchingExercise({
  instructions,
  leftItems,
  rightItems,
  correctPairs,
  id,
  onComplete
}: VocabularyMatchingExerciseProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [userPairs, setUserPairs] = useState<MatchPair[]>([]);
  const [pairColors, setPairColors] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  
  // Shuffle right items for display
  const [shuffledRightItems, setShuffledRightItems] = useState<Array<{id: string; text: string}>>([]);
  
  useEffect(() => {
    // Create a shuffled copy of the right items
    const shuffled = [...rightItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledRightItems(shuffled);
  }, [rightItems]);
  
  
  const handleLeftClick = (leftId: string) => {
    if (submitted) return;
    
    // If this item is already paired, do nothing
    if (userPairs.some(pair => pair.leftId === leftId)) return;
    
    setSelectedLeft(leftId);
  };
  
  const handleRightClick = (rightId: string) => {
    if (submitted || selectedLeft === null) return;
    
    // If this item is already paired, do nothing
    if (userPairs.some(pair => pair.rightId === rightId)) return;
    
    // Create new pair
    const newPair: MatchPair = {
      leftId: selectedLeft,
      rightId: rightId
    };
    
    // Assign a color to this pair (cycle through available colors)
    const colorIndex = userPairs.length % MATCH_COLORS.length;
    setPairColors(prev => ({
      ...prev,
      [selectedLeft]: colorIndex
    }));
    
    setUserPairs([...userPairs, newPair]);
    setSelectedLeft(null);
  };
  
  const removePair = (leftId: string) => {
    if (submitted) return;
    
    // Remove the pair
    setUserPairs(userPairs.filter(pair => pair.leftId !== leftId));
    
    // Remove the color assignment
    setPairColors(prev => {
      const newColors = {...prev};
      delete newColors[leftId];
      return newColors;
    });
  };
  
  // Calculate correct and wrong matches
  const calculateMatches = () => {
    let correctCount = 0;
    
    userPairs.forEach(userPair => {
      // Check if this pair is in the correctPairs array
      const isCorrect = correctPairs.some(
        correctPair => 
          correctPair.leftId === userPair.leftId && 
          correctPair.rightId === userPair.rightId
      );
      
      if (isCorrect) {
        correctCount++;
      }
    });
    
    return {
      correctCount,
      wrongCount: userPairs.length - correctCount
    };
  };
  
  // First submission - check answers
  const handleCheck = () => {
    setChecked(true);
    
    // Calculate correct/wrong counts
    const { correctCount } = calculateMatches();
    setCorrectCount(correctCount);
  };
  
  // Second submission - send to model
  const handleSubmit = () => {
    setSubmitted(true);
    setSelectedLeft(null);
    
    if (onComplete) {
      // Create a readable summary of the matches
      const matchResults = userPairs.map(pair => {
        const leftText = leftItems.find(item => item.id === pair.leftId)?.text || '';
        const rightText = rightItems.find(item => item.id === pair.rightId)?.text || '';
        return `${leftText} → ${rightText}`;
      }).join(', ');
      
      onComplete(matchResults);
    }
  };
  
  const handleRetake = () => {
    // Reset the component state
    setSelectedLeft(null);
    setUserPairs([]);
    setPairColors({});
    setChecked(false);
    setSubmitted(false);
    setCorrectCount(0);
  };
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">Matching Exercise</h3>
          <p className="text-sm text-gray-600 mb-2">{instructions}</p>
          <p className="text-xs text-gray-500 italic">Click on an item from each column to create a match.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item) => {
            const userPair = userPairs.find(pair => pair.leftId === item.id);
            
            return (
              <div 
                key={`${id}-left-${item.id}`}
                onClick={() => handleLeftClick(item.id)}
                className={`p-3 rounded-lg flex items-center justify-between transition-all cursor-pointer border-2 ${
                  userPair 
                    ? `${MATCH_COLORS[pairColors[item.id]].bg} ${MATCH_COLORS[pairColors[item.id]].border}`
                    : selectedLeft === item.id
                      ? 'bg-blue-100 border-blue-400'
                      : 'hover:bg-gray-50 bg-white border-gray-200'
                } ${submitted ? 'cursor-default' : ''}`}
              >
                <span className="text-gray-800 font-medium">{item.text}</span>
                
                {!submitted && userPair && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removePair(item.id);
                    }}
                    className="text-red-500 text-sm font-bold hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Right column */}
        <div className="space-y-2">
          {shuffledRightItems.map((item) => {
            const matchingPair = userPairs.find(pair => pair.rightId === item.id);
            const isPaired = !!matchingPair;
            const colorIndex = matchingPair ? pairColors[matchingPair.leftId] : null;
            
            return (
              <div 
                key={`${id}-right-${item.id}`}
                onClick={() => handleRightClick(item.id)}
                className={`p-3 rounded-lg transition-all cursor-pointer border-2 ${
                  isPaired
                    ? `${MATCH_COLORS[colorIndex!].bg} ${MATCH_COLORS[colorIndex!].border}`
                    : selectedLeft !== null && !submitted
                      ? 'hover:bg-gray-50 bg-white border-gray-200'
                      : 'bg-white border-gray-200'
                } ${submitted ? 'cursor-default' : ''}`}
              >
                <span className="text-gray-800 font-medium">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Results display if checked or submitted */}
      {(checked || submitted) && (
        <div className="mt-4 border rounded-lg bg-white p-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-sm text-gray-800">Your Score</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-base text-gray-800">
                {correctCount}/{Math.min(leftItems.length, rightItems.length)} correct
              </div>
            </div>
          </div>
          
        </div>
      )}
      
      {/* Status indicator */}
      <div className="text-center text-xs text-gray-500 mt-3">
        {userPairs.length} of {Math.min(leftItems.length, rightItems.length)} matches made
      </div>
      
      {!submitted && (
        <div className="mt-4 flex items-center gap-3">
          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={userPairs.length < Math.min(leftItems.length, rightItems.length)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Check Answers
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          )}
          
          <button
            onClick={handleRetake}
            className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            {checked ? 'Try Again' : 'Reset'}
          </button>
        </div>
      )}
    </div>
  );
}

export default VocabularyMatchingExercise;