'use client';

import { useState, useEffect } from 'react';
import { Send, Clock, Trophy, RotateCcw, Shuffle } from 'lucide-react';

export type SentenceBuilderProps = {
  instructions: string;
  germanWords: string[];
  correctOrder: number[];
  id?: string;
  onComplete?: (builtSentence: string, isCorrect: boolean) => void;
};

export function SentenceBuilder({
  instructions,
  germanWords,
  correctOrder,
  id,
  onComplete
}: SentenceBuilderProps) {
  const [shuffledWords, setShuffledWords] = useState<Array<{word: string; originalIndex: number}>>([]);
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Timer state
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize shuffled words
  useEffect(() => {
    const wordsWithIndex = germanWords.map((word, index) => ({
      word,
      originalIndex: index
    }));

    // Shuffle the words
    const shuffled = [...wordsWithIndex];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledWords(shuffled);
  }, [germanWords]);

  // Timer effect
  useEffect(() => {
    let timerRef: NodeJS.Timeout | null = null;

    if (isTimerActive) {
      timerRef = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef) {
        clearInterval(timerRef);
      }
    };
  }, [isTimerActive]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWordClick = (wordData: {word: string; originalIndex: number}) => {
    if (submitted) return;

    // Start timer on first interaction
    if (!isTimerActive && selectedOrder.length === 0) {
      setIsTimerActive(true);
    }

    // If word is already selected, remove it and all words after it
    const existingIndex = selectedOrder.indexOf(wordData.originalIndex);
    if (existingIndex !== -1) {
      setSelectedOrder(selectedOrder.slice(0, existingIndex));
      return;
    }

    // Add word to selection
    const newOrder = [...selectedOrder, wordData.originalIndex];
    setSelectedOrder(newOrder);

    // Check if sentence is complete
    if (newOrder.length === germanWords.length) {
      setIsComplete(true);
    }
  };

  const checkAnswer = () => {
    const correct = JSON.stringify(selectedOrder) === JSON.stringify(correctOrder);
    setIsCorrect(correct);
    setSubmitted(true);
    setIsTimerActive(false);

    // Create the sentence from user's order
    const builtSentence = selectedOrder.map(index => germanWords[index]).join(' ');

    if (onComplete) {
      onComplete(builtSentence, correct);
    }
  };

  const reset = () => {
    setSelectedOrder([]);
    setIsComplete(false);
    setSubmitted(false);
    setIsCorrect(false);
    setElapsedTime(0);
    setIsTimerActive(false);

    // Re-shuffle words
    const shuffled = [...shuffledWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledWords(shuffled);
  };

  // Get the selected sentence in order
  const getSelectedSentence = () => {
    return selectedOrder.map(index => germanWords[index]).join(' ');
  };

  // Get the correct sentence
  const getCorrectSentence = () => {
    return correctOrder.map(index => germanWords[index]).join(' ');
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <Shuffle className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">Sentence Builder</h3>
          <p className="text-sm text-gray-600 mb-2">{instructions}</p>
          <p className="text-xs text-gray-500 italic">Click the words in the correct order to build the sentence.</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-full px-2 py-1">
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {formatTime(elapsedTime)}
          </span>
        </div>
      </div>

      {/* Selected sentence display */}
      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 min-h-[3rem] flex items-center">
        <div className="text-sm text-gray-500 mr-2">Your sentence:</div>
        <div className="flex-1 text-gray-800 font-medium">
          {selectedOrder.length > 0 ? getSelectedSentence() :
            <span className="text-gray-400 italic">Click words below to build your sentence...</span>
          }
        </div>
      </div>

      {/* Word selection area */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {shuffledWords.map((wordData, displayIndex) => {
          const isSelected = selectedOrder.includes(wordData.originalIndex);
          const selectionPosition = selectedOrder.indexOf(wordData.originalIndex);

          return (
            <div
              key={`${id}-word-${displayIndex}`}
              onClick={() => handleWordClick(wordData)}
              className={`p-3 rounded-lg transition-all cursor-pointer border-2 text-center ${
                isSelected
                  ? 'bg-blue-100 border-blue-400 opacity-60'
                  : submitted
                    ? 'bg-gray-100 border-gray-200 cursor-default'
                    : 'hover:bg-blue-50 bg-white border-gray-200'
              } ${submitted ? 'cursor-default' : ''}`}
            >
              <span className="text-gray-800 font-medium">{wordData.word}</span>
              {isSelected && (
                <div className="text-xs text-blue-600 mt-1 font-semibold">
                  #{selectionPosition + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results */}
      {submitted && (
        <div className={`mb-4 border rounded-lg p-3 ${
          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={`h-4 w-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`font-semibold text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>

          <div className="text-sm space-y-1">
            <div>
              <span className="text-gray-600">Your answer: </span>
              <span className="font-medium">{getSelectedSentence()}</span>
            </div>
            {!isCorrect && (
              <div>
                <span className="text-gray-600">Correct answer: </span>
                <span className="font-medium text-green-700">{getCorrectSentence()}</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Time: {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="text-center text-xs text-gray-500 mb-3">
        {selectedOrder.length} of {germanWords.length} words selected
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={checkAnswer}
            disabled={!isComplete}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Check Answer
          </button>
        ) : null}

        <button
          onClick={reset}
          className="bg-white border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw className="h-3 w-3" />
          {submitted ? 'Try Again' : 'Reset'}
        </button>
      </div>
    </div>
  );
}

export default SentenceBuilder;