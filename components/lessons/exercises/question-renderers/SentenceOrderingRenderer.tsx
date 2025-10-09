"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, CheckCircle, X, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionRendererProps } from './QuestionRenderer';

/**
 * Renders sentence reordering questions with drag-and-drop functionality
 * Users can reorder sentences to form a logical sequence
 */
export default function SentenceOrderingRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showResults,
}: QuestionRendererProps) {

  // Extract data - it might be nested in a data field (from database) or at root level
  const questionData = question.data || question;
  const points = questionData.points || question.points || 4; // Default to 4 for sentence ordering

  // Parse sentences from question data
  const originalSentences = questionData.sentences || [];
  
  // Parse current order from selected answer
  let currentOrder: string[] = [];
  try {
    currentOrder = selectedAnswer ? JSON.parse(selectedAnswer) : [...originalSentences];
  } catch {
    currentOrder = [...originalSentences];
  }
  
  // Parse correct order
  let correctOrder: string[] = [];
  const correctAnswerData = question.correct_answer || questionData.correct_answer;
  try {
    correctOrder = correctAnswerData ? JSON.parse(correctAnswerData) : originalSentences;
  } catch {
    correctOrder = originalSentences;
  }
  
  const [items, setItems] = useState<string[]>(currentOrder);
  
  const moveUp = (index: number) => {
    if (showResults || index === 0) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    setItems(newItems);
    onAnswerChange(question.id, JSON.stringify(newItems));
  };

  const moveDown = (index: number) => {
    if (showResults || index === items.length - 1) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    onAnswerChange(question.id, JSON.stringify(newItems));
  };
  
  const resetOrder = () => {
    if (showResults) return;
    
    // Shuffle the sentences to give a fresh start
    const shuffled = [...originalSentences].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    onAnswerChange(question.id, JSON.stringify(shuffled));
  };
  
  // Calculate which sentences are in correct positions
  const getPositionStatus = (sentence: string, index: number) => {
    if (!showResults) return 'neutral';
    
    const correctIndex = correctOrder.indexOf(sentence);
    if (index === correctIndex) return 'correct';
    return 'incorrect';
  };
  
  return (
    <div className="space-y-4">
      
      {/* Instructions */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-base text-gray-700 mb-2">
            <span className="font-semibold">Click the arrow buttons</span> on the right of each sentence to move them up or down and arrange them in the correct order.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded border">
              <ChevronUp className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </div>
            <span>Use these buttons to reorder</span>
          </div>
        </div>
        {!showResults && (
          <button
            onClick={resetOrder}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition-colors font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Shuffle
          </button>
        )}
      </div>
      
      
      {/* Sentence list with arrow controls */}
      <div className="space-y-3">
        {items.map((sentence, index) => {
          const positionStatus = getPositionStatus(sentence, index);
          
          return (
            <motion.div
              key={sentence}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200 select-none",
                showResults && positionStatus === 'correct'
                  ? 'bg-green-100 border-green-400 text-green-800'
                  : showResults && positionStatus === 'incorrect'
                  ? 'bg-red-100 border-red-400 text-red-800'
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center gap-4">
                {/* Position number */}
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-base flex-shrink-0 transition-all duration-200",
                  showResults && positionStatus === 'correct'
                    ? 'bg-green-100 border-green-400 text-green-600'
                    : showResults && positionStatus === 'incorrect'
                    ? 'bg-red-100 border-red-400 text-red-600'
                    : 'bg-blue-100 border-blue-300 text-blue-600'
                )}>
                  {index + 1}
                </div>
                
                {/* Sentence text */}
                <div className="flex-1 text-lg font-medium leading-relaxed">
                  {sentence}
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center gap-2">
                  {showResults && (
                    positionStatus === 'correct' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )
                  )}
                  
                  {/* Move buttons */}
                  {!showResults && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className={cn(
                          "p-2 rounded-lg border transition-all duration-200 font-medium",
                          index === 0
                            ? "text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50"
                            : "text-blue-600 border-blue-300 hover:text-blue-800 hover:bg-blue-100 hover:border-blue-400 active:scale-95"
                        )}
                        title="Move up"
                      >
                        <ChevronUp className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === items.length - 1}
                        className={cn(
                          "p-2 rounded-lg border transition-all duration-200 font-medium",
                          index === items.length - 1
                            ? "text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50"
                            : "text-blue-600 border-blue-300 hover:text-blue-800 hover:bg-blue-100 hover:border-blue-400 active:scale-95"
                        )}
                        title="Move down"
                      >
                        <ChevronDown className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Results summary */}
      {showResults && (
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2 text-lg">Correct Order:</h4>
          <div className="space-y-1">
            {correctOrder.map((sentence, index) => (
              <div key={index} className="flex items-start gap-2 text-base text-gray-600">
                <span className="font-medium text-gray-500 mt-0.5 flex-shrink-0">
                  {index + 1}.
                </span>
                <span>{sentence}</span>
              </div>
            ))}
          </div>
          
          {/* Score summary */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-base text-gray-600">
              <span className="font-medium">Score:</span>{' '}
              {items.filter((sentence, index) => correctOrder[index] === sentence).length} / {correctOrder.length} correct
            </div>
          </div>
        </div>
      )}
    </div>
  );
}