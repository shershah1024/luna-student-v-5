"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionRendererProps } from './QuestionRenderer';

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
  left: string;
  right: string;
};

/**
 * Renders matching questions where users connect items from left column to right column
 * Uses improved VocabularyMatchingExercise design with color-coded pairs
 */
export default function MatchingRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
}: QuestionRendererProps) {
  
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [userPairs, setUserPairs] = useState<MatchPair[]>([]);
  const [pairColors, setPairColors] = useState<Record<string, number>>({});
  
  // Parse the matching data - standard structure uses left/right arrays
  const { leftItems, rightItems, correctMatches, promptText } = useMemo(() => {
    // Extract data - it might be nested in a data field (from database) or at root level
    const questionData = question.data || question;

    const leftItems: string[] = questionData.left || [];
    const rightItems: string[] = questionData.right || [];
    const promptText = questionData.prompt || questionData.question || 'Match the items from each column.';

    // Parse correct answers - should be a mapping like {"item1": "match1", "item2": "match2"}
    let correctMatches: Record<string, string> = {};
    try {
      const correctAnswerStr = question.correct_answer || questionData.correct_answer;
      if (correctAnswerStr) {
        correctMatches = typeof correctAnswerStr === 'string'
          ? JSON.parse(correctAnswerStr)
          : correctAnswerStr;
      }
    } catch (e) {
      console.error('Failed to parse correct_answer:', e);
    }

    return { leftItems, rightItems, correctMatches, promptText };
  }, [question]);
  
  // Shuffle right items for display - only shuffle once when component mounts
  const [shuffledRightItems, setShuffledRightItems] = useState<string[]>([]);
  
  useEffect(() => {
    // Only shuffle if we haven't shuffled yet
    if (shuffledRightItems.length === 0 && rightItems.length > 0) {
      const shuffled = [...rightItems];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledRightItems(shuffled);
    }
  }, [rightItems, shuffledRightItems.length]);

  // Initialize from selected answer - only when selectedAnswer actually changes
  useEffect(() => {
    if (!selectedAnswer) {
      // Reset to empty state if no answer
      if (userPairs.length > 0) {
        setUserPairs([]);
        setPairColors({});
      }
      return;
    }
    
    let matches: Record<string, string> = {};
    try {
      matches = JSON.parse(selectedAnswer);
    } catch {
      matches = {};
    }
    
    const pairs: MatchPair[] = [];
    const colors: Record<string, number> = {};
    let colorIndex = 0;
    
    Object.entries(matches).forEach(([left, right]) => {
      pairs.push({ left, right });
      colors[left] = colorIndex % MATCH_COLORS.length;
      colorIndex++;
    });
    
    // Only update if the pairs have actually changed
    const currentPairsStr = JSON.stringify(userPairs.map(p => ({ left: p.left, right: p.right })).sort());
    const newPairsStr = JSON.stringify(pairs.map(p => ({ left: p.left, right: p.right })).sort());
    
    if (currentPairsStr !== newPairsStr) {
      setUserPairs(pairs);
      setPairColors(colors);
    }
  }, [selectedAnswer]);
  
  const handleLeftClick = useCallback((leftItem: string) => {
    if (showResults) return;
    
    // If this item is already paired, do nothing
    if (userPairs.some(pair => pair.left === leftItem)) return;
    
    setSelectedLeft(leftItem);
  }, [showResults, userPairs]);
  
  const handleRightClick = useCallback((rightItem: string) => {
    if (showResults || selectedLeft === null) return;
    
    // If this item is already paired, do nothing
    if (userPairs.some(pair => pair.right === rightItem)) return;
    
    // Create new pair
    const newPair: MatchPair = {
      left: selectedLeft,
      right: rightItem
    };
    
    // Assign a color to this pair (cycle through available colors)
    const colorIndex = userPairs.length % MATCH_COLORS.length;
    setPairColors(prev => ({
      ...prev,
      [selectedLeft]: colorIndex
    }));
    
    const newUserPairs = [...userPairs, newPair];
    setUserPairs(newUserPairs);
    
    // Update the answer in the parent component
    const matchesObj: Record<string, string> = {};
    newUserPairs.forEach(pair => {
      matchesObj[pair.left] = pair.right;
    });
    onAnswerChange(question.id, JSON.stringify(matchesObj));
    
    setSelectedLeft(null);
  }, [showResults, selectedLeft, userPairs, question.id, onAnswerChange]);
  
  const removePair = useCallback((leftItem: string) => {
    if (showResults) return;
    
    // Remove the pair
    const newUserPairs = userPairs.filter(pair => pair.left !== leftItem);
    setUserPairs(newUserPairs);
    
    // Remove the color assignment
    setPairColors(prev => {
      const newColors = {...prev};
      delete newColors[leftItem];
      return newColors;
    });
    
    // Update the answer in the parent component
    const matchesObj: Record<string, string> = {};
    newUserPairs.forEach(pair => {
      matchesObj[pair.left] = pair.right;
    });
    onAnswerChange(question.id, JSON.stringify(matchesObj));
  }, [showResults, userPairs, question.id, onAnswerChange]);
  
  // Calculate total points based on number of pairs
  const totalPoints = leftItems.length;
  
  // Calculate earned points based on correct matches
  const earnedPoints = userPairs.filter(pair => 
    correctMatches[pair.left] === pair.right
  ).length;

  // Show error state if no data
  if (!leftItems.length || !rightItems.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: Missing matching data for this question.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2 text-lg">Matching Exercise</h3>
          <p className="text-base text-gray-600 mb-2">{promptText}</p>
          <p className="text-sm text-gray-500 italic">Click on an item from each column to create a match.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item, index) => {
            const userPair = userPairs.find(pair => pair.left === item);
            
            return (
              <div 
                key={`left-${index}`}
                onClick={() => handleLeftClick(item)}
                className={cn(
                  "p-3 rounded-lg flex items-center justify-between transition-all cursor-pointer border-2",
                  userPair 
                    ? `${MATCH_COLORS[pairColors[item]].bg} ${MATCH_COLORS[pairColors[item]].border}`
                    : selectedLeft === item
                      ? 'bg-blue-100 border-blue-400'
                      : 'hover:bg-gray-50 bg-white border-gray-200',
                  showResults ? 'cursor-default' : ''
                )}
              >
                <span className="text-gray-800 font-medium text-lg">{item}</span>
                
                {!showResults && userPair && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removePair(item);
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
          {shuffledRightItems.map((item, index) => {
            const matchingPair = userPairs.find(pair => pair.right === item);
            const isPaired = !!matchingPair;
            const colorIndex = matchingPair ? pairColors[matchingPair.left] : null;
            
            return (
              <div 
                key={`right-${index}`}
                onClick={() => handleRightClick(item)}
                className={cn(
                  "p-3 rounded-lg transition-all cursor-pointer border-2",
                  isPaired
                    ? `${MATCH_COLORS[colorIndex!].bg} ${MATCH_COLORS[colorIndex!].border}`
                    : selectedLeft !== null && !showResults
                      ? 'hover:bg-gray-50 bg-white border-gray-200'
                      : 'bg-white border-gray-200',
                  showResults ? 'cursor-default' : ''
                )}
              >
                <span className="text-gray-800 font-medium text-lg">{item}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="text-center text-sm text-gray-500 mt-3">
        {userPairs.length} of {Math.min(leftItems.length, rightItems.length)} matches made
      </div>
      
      {/* Results summary */}
      {showResults && (
        <div className="mt-4 border rounded-lg bg-white p-3">
          <h4 className="font-medium text-gray-800 mb-2 text-lg">Correct Matches:</h4>
          <div className="space-y-1">
            {Object.entries(correctMatches).map(([left, right], index) => {
              const userMatch = userPairs.find(pair => pair.left === left);
              const isCorrect = userMatch?.right === right;
              
              return (
                <div key={index} className="flex items-center gap-2 text-base text-gray-700">
                  <span className="font-medium">{left}</span>
                  <span>→</span>
                  <span>{right}</span>
                  {isCorrect && (
                    <span className="text-green-600 ml-2">✓</span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Score summary */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-base font-semibold text-gray-800">
              Score: {earnedPoints} / {totalPoints} points
            </div>
          </div>
        </div>
      )}
    </div>
  );
}