'use client';

import { useState, useEffect } from 'react';
import { Check, X, Move, Target, Shuffle } from 'lucide-react';

interface QuizMatchingExerciseProps {
  leftItems: string[];
  rightItems: string[];
  correctMatches: Array<{
    left_index: number;
    right_index: number;
  }>;
  onComplete: (isCorrect: boolean) => void;
}

export const QuizMatchingExercise = ({
  leftItems,
  rightItems,
  correctMatches,
  onComplete
}: QuizMatchingExerciseProps) => {
  const [matches, setMatches] = useState<Array<{ leftIndex: number; rightIndex: number }>>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ side: 'left' | 'right'; index: number } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ side: 'left' | 'right'; index: number } | null>(null);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [animatingCorrectAnswers, setAnimatingCorrectAnswers] = useState(false);
  const [revealedCorrectMatches, setRevealedCorrectMatches] = useState<Array<{ left_index: number; right_index: number }>>([]);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  // Enhanced color palette for matches - no purple/pink
  const colors = [
    { bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-300', text: 'text-blue-800', accent: 'bg-gradient-to-r from-blue-400 to-blue-500', ring: 'ring-blue-200' },
    { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', accent: 'bg-gradient-to-r from-emerald-400 to-emerald-500', ring: 'ring-emerald-200' },
    { bg: 'bg-gradient-to-br from-amber-50 to-amber-100', border: 'border-amber-300', text: 'text-amber-800', accent: 'bg-gradient-to-r from-amber-400 to-amber-500', ring: 'ring-amber-200' },
    { bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-300', text: 'text-orange-800', accent: 'bg-gradient-to-r from-orange-400 to-orange-500', ring: 'ring-orange-200' },
    { bg: 'bg-gradient-to-br from-teal-50 to-teal-100', border: 'border-teal-300', text: 'text-teal-800', accent: 'bg-gradient-to-r from-teal-400 to-teal-500', ring: 'ring-teal-200' },
    { bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', accent: 'bg-gradient-to-r from-indigo-400 to-indigo-500', ring: 'ring-indigo-200' },
    { bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', accent: 'bg-gradient-to-r from-cyan-400 to-cyan-500', ring: 'ring-cyan-200' },
    { bg: 'bg-gradient-to-br from-slate-50 to-slate-100', border: 'border-slate-300', text: 'text-slate-800', accent: 'bg-gradient-to-r from-slate-400 to-slate-500', ring: 'ring-slate-200' },
  ];

  // Check if a match already exists for an item
  const isMatched = (side: 'left' | 'right', index: number) => {
    return matches.some(match => 
      side === 'left' ? match.leftIndex === index : match.rightIndex === index
    );
  };

  // Get the match for an item
  const getMatchForItem = (side: 'left' | 'right', index: number) => {
    return matches.find(match => 
      side === 'left' ? match.leftIndex === index : match.rightIndex === index
    );
  };

  // Get color for a match
  const getMatchColor = (leftIndex: number, rightIndex: number) => {
    const matchIndex = matches.findIndex(m => m.leftIndex === leftIndex && m.rightIndex === rightIndex);
    return colors[matchIndex % colors.length];
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, side: 'left' | 'right', index: number) => {
    if (submitted || isMatched(side, index)) return;
    setDraggedItem({ side, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, side: 'left' | 'right', index: number) => {
    e.preventDefault();
    if (draggedItem && draggedItem.side !== side && !isMatched(side, index)) {
      setDragOverTarget({ side, index });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, side: 'left' | 'right', index: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.side === side || isMatched(side, index)) return;

    // Create new match
    const newMatch = draggedItem.side === 'left' 
      ? { leftIndex: draggedItem.index, rightIndex: index }
      : { leftIndex: index, rightIndex: draggedItem.index };

    setMatches([...matches, newMatch]);
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  // Click-based matching (fallback for touch devices)
  const handleItemClick = (side: 'left' | 'right', index: number) => {
    if (submitted || isMatched(side, index)) return;

    if (side === 'left') {
      if (selectedLeft === index) {
        setSelectedLeft(null); // Deselect if clicking the same item
      } else {
        setSelectedLeft(index);
        // If right item is selected, create match
        if (selectedRight !== null) {
          setMatches([...matches, { leftIndex: index, rightIndex: selectedRight }]);
          setSelectedLeft(null);
          setSelectedRight(null);
        }
      }
    } else {
      if (selectedRight === index) {
        setSelectedRight(null); // Deselect if clicking the same item
      } else {
        setSelectedRight(index);
        // If left item is selected, create match
        if (selectedLeft !== null) {
          setMatches([...matches, { leftIndex: selectedLeft, rightIndex: index }]);
          setSelectedLeft(null);
          setSelectedRight(null);
        }
      }
    }
  };

  // Remove a match
  const removeMatch = (leftIndex: number, rightIndex: number) => {
    if (submitted) return;
    setMatches(matches.filter(match => 
      !(match.leftIndex === leftIndex && match.rightIndex === rightIndex)
    ));
  };

  // Check if all items are matched
  const allMatched = matches.length === leftItems.length;

  // Submit and check answers
  const handleSubmit = () => {
    if (!allMatched) return;
    
    setSubmitted(true);
    setShowResults(true);

    // Check if all matches are correct
    const isCorrect = matches.every(match => 
      correctMatches.some(correct => 
        correct.left_index === match.leftIndex && 
        correct.right_index === match.rightIndex
      )
    );

    // If not all correct, animate the correct answers after a brief delay
    if (!isCorrect) {
      setTimeout(() => {
        setAnimatingCorrectAnswers(true);
        setShowCorrectAnswers(true);
        animateCorrectAnswersReveal();
      }, 1000);
    }

    onComplete(isCorrect);
  };

  // Animate making correct matches one by one
  const animateCorrectAnswersReveal = () => {
    setRevealedCorrectMatches([]);
    
    // Clear incorrect matches first
    const correctUserMatches = matches.filter(match => 
      correctMatches.some(correct => 
        correct.left_index === match.leftIndex && correct.right_index === match.rightIndex
      )
    );
    
    // Set only correct matches
    setMatches(correctUserMatches);
    
    // Add missing correct matches one by one
    const missingCorrectMatches = correctMatches.filter(correct => 
      !correctUserMatches.some(userMatch => 
        userMatch.leftIndex === correct.left_index && userMatch.rightIndex === correct.right_index
      )
    );
    
    missingCorrectMatches.forEach((correctMatch, index) => {
      setTimeout(() => {
        setMatches(prev => [...prev, { leftIndex: correctMatch.left_index, rightIndex: correctMatch.right_index }]);
        setRevealedCorrectMatches(prev => [...prev, correctMatch]);
        
        // Stop animation after 2 seconds for this match
        setTimeout(() => {
          setRevealedCorrectMatches(prev => prev.filter(match => 
            !(match.left_index === correctMatch.left_index && match.right_index === correctMatch.right_index)
          ));
          
          // If this was the last match, mark animation as finished
          if (index === missingCorrectMatches.length - 1) {
            setTimeout(() => setAnimationFinished(true), 500);
          }
        }, 2000);
      }, index * 800); // Stagger by 800ms each
    });
  };

  // Check if a specific match is correct (for visual feedback)
  const isMatchCorrect = (leftIndex: number, rightIndex: number) => {
    return correctMatches.some(correct => 
      correct.left_index === leftIndex && 
      correct.right_index === rightIndex
    );
  };

  // Check if a correct answer is revealed (for animation)
  const isCorrectAnswerRevealed = (leftIndex: number, rightIndex: number) => {
    return revealedCorrectMatches.some(revealed => 
      revealed.left_index === leftIndex && 
      revealed.right_index === rightIndex
    );
  };

  return (
    <div className="rounded-lg border-2 border-primary/10 bg-gradient-to-br from-rose-50 to-white shadow-md p-4 space-y-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/chat-pattern.svg')] opacity-5 pointer-events-none" />
      
      {/* Instructions - Compact */}
      <div className="text-center relative z-10">
        <div className="flex items-center gap-2 justify-center mb-3">
          <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
            <Shuffle className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Matching Exercise</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Match the Pairs</h3>
        <p className="text-sm text-slate-600">
          Drag or click to match items
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">
        {/* Left column */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700 text-center mb-2 text-sm">Match These</h4>
          {leftItems.map((item, index) => {
            const match = getMatchForItem('left', index);
            const isSelected = selectedLeft === index;
            const hasMatch = match !== undefined;
            const isDragging = draggedItem?.side === 'left' && draggedItem?.index === index;
            const isDropTarget = dragOverTarget?.side === 'left' && dragOverTarget?.index === index;
            
            let styling = '';
            let colorTheme = null;
            
            // Check if this should show as a correct answer (either user match or animated reveal)
            const shouldShowAsCorrect = hasMatch && match && isMatchCorrect(index, match.rightIndex);
            const correctAnswerRevealed = hasMatch && match && showCorrectAnswers && isCorrectAnswerRevealed(index, match.rightIndex);
            
            if (hasMatch && match) {
              colorTheme = getMatchColor(index, match.rightIndex);
              if (submitted && showResults) {
                if (correctAnswerRevealed && !animationFinished) {
                  styling = 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-xl border-2 transform scale-105 transition-all duration-700 animate-pulse';
                } else {
                  styling = shouldShowAsCorrect
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg transform transition-all duration-500'
                    : 'border-red-500 bg-red-50 shadow-lg opacity-60';
                }
              } else {
                styling = `${colorTheme.border} ${colorTheme.bg} ${colorTheme.text} border-2 shadow-lg`;
              }
            } else if (isSelected) {
              styling = 'border-blue-500 bg-blue-50 shadow-lg border-2';
            } else if (isDragging) {
              styling = 'border-blue-500 bg-blue-100 shadow-xl border-2 opacity-50 rotate-2 scale-105';
            } else if (isDropTarget) {
              styling = 'border-green-500 bg-green-50 shadow-lg border-2 border-dashed ring-2 ring-green-200';
            } else {
              styling = 'border-slate-200 hover:border-blue-300 hover:bg-blue-25 hover:shadow-md border-2';
            }
            
            return (
              <div key={`left-${index}`} className="relative">
                <div
                  draggable={!submitted && !hasMatch}
                  onDragStart={(e) => handleDragStart(e, 'left', index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, 'left', index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'left', index)}
                  onClick={() => handleItemClick('left', index)}
                  className={`w-full p-2 text-left rounded-lg transition-all duration-200 cursor-pointer select-none ${styling}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${correctAnswerRevealed ? 'text-emerald-800 font-bold' : ''}`}>
                      {item}
                    </span>
                    {correctAnswerRevealed && (
                      <div className="flex items-center text-emerald-600 animate-bounce">
                        <Check className="h-4 w-4 ml-2" />
                      </div>
                    )}
                    {hasMatch && !submitted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMatch(index, match!.rightIndex);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700 text-center mb-2 text-sm">With These</h4>
          {rightItems.map((item, index) => {
            const match = getMatchForItem('right', index);
            const isSelected = selectedRight === index;
            const hasMatch = match !== undefined;
            const isDragging = draggedItem?.side === 'right' && draggedItem?.index === index;
            const isDropTarget = dragOverTarget?.side === 'right' && dragOverTarget?.index === index;
            
            let styling = '';
            let colorTheme = null;
            
            // Check if this should show as a correct answer (either user match or animated reveal)
            const shouldShowAsCorrect = hasMatch && match && isMatchCorrect(match.leftIndex, index);
            const correctAnswerRevealed = hasMatch && match && showCorrectAnswers && isCorrectAnswerRevealed(match.leftIndex, index);
            
            if (hasMatch && match) {
              colorTheme = getMatchColor(match.leftIndex, index);
              if (submitted && showResults) {
                if (correctAnswerRevealed && !animationFinished) {
                  styling = 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-xl border-2 transform scale-105 transition-all duration-700 animate-pulse';
                } else {
                  styling = shouldShowAsCorrect
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg transform transition-all duration-500'
                    : 'border-red-500 bg-red-50 shadow-lg opacity-60';
                }
              } else {
                styling = `${colorTheme.border} ${colorTheme.bg} ${colorTheme.text} border-2 shadow-lg`;
              }
            } else if (isSelected) {
              styling = 'border-blue-500 bg-blue-50 shadow-lg border-2';
            } else if (isDragging) {
              styling = 'border-blue-500 bg-blue-100 shadow-xl border-2 opacity-50 rotate-2 scale-105';
            } else if (isDropTarget) {
              styling = 'border-green-500 bg-green-50 shadow-lg border-2 border-dashed ring-2 ring-green-200';
            } else {
              styling = 'border-slate-200 hover:border-blue-300 hover:bg-blue-25 hover:shadow-md border-2';
            }
            
            return (
              <div key={`right-${index}`} className="relative">
                <div
                  draggable={!submitted && !hasMatch}
                  onDragStart={(e) => handleDragStart(e, 'right', index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, 'right', index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'right', index)}
                  onClick={() => handleItemClick('right', index)}
                  className={`w-full p-2 text-left rounded-lg transition-all duration-200 cursor-pointer select-none ${styling}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${correctAnswerRevealed ? 'text-emerald-800 font-bold' : ''}`}>
                      {item}
                    </span>
                    {correctAnswerRevealed && (
                      <div className="flex items-center text-emerald-600 animate-bounce">
                        <Check className="h-4 w-4 ml-2" />
                      </div>
                    )}
                    {hasMatch && !submitted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMatch(match!.leftIndex, index);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress with VocabularyChat styling */}
      <div className="text-center relative z-10">
        <p className="text-sm text-slate-600">
          {matches.length} of {leftItems.length} matches made
        </p>
      </div>

      {/* Submit button - Compact */}
      {!submitted && (
        <div className="flex justify-center relative z-10">
          <button
            onClick={handleSubmit}
            disabled={!allMatched}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 flex items-center gap-2 ${
              allMatched
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 hover:shadow-lg transform hover:scale-105 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="h-4 w-4" />
            Check Matches
          </button>
        </div>
      )}

      {/* Feedback - Compact */}
      {submitted && showResults && !matches.every(match => isMatchCorrect(match.leftIndex, match.rightIndex)) && (
        <div className="text-center p-3 bg-gradient-to-br from-rose-100/80 to-orange-100/80 backdrop-blur-sm border border-rose-200/50 rounded-lg shadow-md relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-rose-800 text-sm">Results</span>
          </div>
          <p className="text-rose-700 text-sm mb-2">
            <strong>{matches.filter(match => isMatchCorrect(match.leftIndex, match.rightIndex)).length}</strong> out of <strong>{matches.length}</strong> correct.
          </p>
          {showCorrectAnswers && (
            <div className="border-t border-rose-200/50 pt-2 mt-2">
              <div className="flex items-center justify-center gap-1">
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Watch correct matches!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success message - Compact */}
      {submitted && showResults && matches.every(match => isMatchCorrect(match.leftIndex, match.rightIndex)) && (
        <div className="text-center p-3 bg-gradient-to-br from-emerald-100/80 to-green-100/80 backdrop-blur-sm border border-emerald-200/50 rounded-lg shadow-md relative z-10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-emerald-800 text-sm">Perfect! All correct!</span>
          </div>
        </div>
      )}
    </div>
  );
};