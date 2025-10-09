import { useState, useEffect } from 'react';
import { X, RotateCcw } from 'lucide-react';

interface WordOrderProps {
  question: any;
  selectedAnswer?: string;
  onAnswerChange: (questionId: string | number, answer: string) => void;
  showResults: boolean;
}

/**
 * Renderer for word order questions
 * User clicks words from the scrambled pool to build a sentence
 */
export default function WordOrderRenderer({
  question,
  selectedAnswer = '',
  onAnswerChange,
  showResults
}: WordOrderProps) {
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with scrambled words
    if (selectedAnswer) {
      try {
        const savedOrder = JSON.parse(selectedAnswer);
        if (Array.isArray(savedOrder)) {
          // Restore from saved answer
          const selected = savedOrder.map((idx: number) => question.scrambled_words[idx]);
          setSelectedWords(selected);
          // Remove selected words from available pool
          const remaining = question.scrambled_words.filter((word: string) => !selected.includes(word));
          setAvailableWords(remaining);
        } else {
          setAvailableWords([...question.scrambled_words]);
          setSelectedWords([]);
        }
      } catch {
        setAvailableWords([...question.scrambled_words]);
        setSelectedWords([]);
      }
    } else if (question.scrambled_words) {
      setAvailableWords([...question.scrambled_words]);
      setSelectedWords([]);
    }
  }, [question.scrambled_words, selectedAnswer]);

  const handleWordClick = (word: string, fromAvailable: boolean) => {
    if (showResults) return;

    if (fromAvailable) {
      // Move word from available to selected
      setAvailableWords(prev => prev.filter(w => w !== word));
      setSelectedWords(prev => [...prev, word]);

      // Update answer
      const newSelected = [...selectedWords, word];
      const indices = newSelected.map(w => question.scrambled_words.indexOf(w));
      onAnswerChange(question.id, JSON.stringify(indices));
    } else {
      // Move word from selected back to available
      setSelectedWords(prev => prev.filter(w => w !== word));
      setAvailableWords(prev => [...prev, word]);

      // Update answer
      const newSelected = selectedWords.filter(w => w !== word);
      const indices = newSelected.map(w => question.scrambled_words.indexOf(w));
      onAnswerChange(question.id, JSON.stringify(indices));
    }
  };

  const handleReset = () => {
    if (showResults) return;
    setAvailableWords([...question.scrambled_words]);
    setSelectedWords([]);
    onAnswerChange(question.id, '');
  };

  const currentSentence = selectedWords.join(' ');
  const isCorrect = currentSentence === question.correct_sentence;

  return (
    <div className="space-y-4">
      {/* Available words pool */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Click words to build your sentence:</p>
          {selectedWords.length > 0 && !showResults && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 min-h-[60px]">
          {availableWords.length > 0 ? (
            availableWords.map((word, index) => (
              <button
                key={`available-${word}-${index}`}
                onClick={() => handleWordClick(word, true)}
                disabled={showResults}
                className={`
                  px-4 py-2 rounded-lg font-medium text-base
                  transition-all transform hover:scale-105
                  ${showResults
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-300 cursor-pointer shadow-sm hover:shadow'
                  }
                `}
              >
                {word}
              </button>
            ))
          ) : (
            <span className="text-gray-400 italic">All words used</span>
          )}
        </div>
      </div>

      {/* Selected words / Answer area */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">Your sentence:</p>
        <div className={`flex flex-wrap gap-2 p-4 rounded-lg border-2 min-h-[80px] ${
          showResults
            ? isCorrect
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
            : 'bg-blue-50 border-blue-200'
        }`}>
          {selectedWords.length > 0 ? (
            selectedWords.map((word, index) => (
              <div
                key={`selected-${word}-${index}`}
                className={`
                  group relative px-4 py-2 rounded-lg font-medium text-base
                  ${showResults
                    ? isCorrect
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }
                `}
              >
                {word}
                {!showResults && (
                  <button
                    onClick={() => handleWordClick(word, false)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <span className="text-gray-400 italic">Click words above to build your sentence</span>
          )}
        </div>
      </div>

      {/* Results display */}
      {showResults && (
        <div className={`p-4 rounded-lg ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className={`text-xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? '✓' : '✗'}
            </span>
            <div className="flex-1">
              <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Perfect word order!' : 'Incorrect order'}
              </p>
              {!isCorrect && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-medium">Correct sentence:</p>
                  <p className="text-base text-gray-800 mt-1 bg-white p-2 rounded">
                    {question.correct_sentence}
                  </p>
                </div>
              )}
              {question.explanation && (
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}