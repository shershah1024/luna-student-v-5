'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  CheckCircle2Icon,
  XCircleIcon,
  Trophy,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

// German pronouns
const PRONOUNS = [
  { pronoun: 'ich', label: 'ich' },
  { pronoun: 'du', label: 'du' },
  { pronoun: 'er/sie/es', label: 'er/sie/es' },
  { pronoun: 'wir', label: 'wir' },
  { pronoun: 'ihr', label: 'ihr' },
  { pronoun: 'sie/Sie', label: 'sie/Sie' }
];

// Sample verbs with conjugations
const VERBS = {
  sein: {
    infinitive: 'sein',
    translation: 'to be',
    present: { ich: 'bin', du: 'bist', 'er/sie/es': 'ist', wir: 'sind', ihr: 'seid', 'sie/Sie': 'sind' },
    past: { ich: 'war', du: 'warst', 'er/sie/es': 'war', wir: 'waren', ihr: 'wart', 'sie/Sie': 'waren' }
  },
  haben: {
    infinitive: 'haben',
    translation: 'to have',
    present: { ich: 'habe', du: 'hast', 'er/sie/es': 'hat', wir: 'haben', ihr: 'habt', 'sie/Sie': 'haben' },
    past: { ich: 'hatte', du: 'hattest', 'er/sie/es': 'hatte', wir: 'hatten', ihr: 'hattet', 'sie/Sie': 'hatten' }
  },
  spielen: {
    infinitive: 'spielen',
    translation: 'to play',
    present: { ich: 'spiele', du: 'spielst', 'er/sie/es': 'spielt', wir: 'spielen', ihr: 'spielt', 'sie/Sie': 'spielen' },
    past: { ich: 'spielte', du: 'spieltest', 'er/sie/es': 'spielte', wir: 'spielten', ihr: 'spieltet', 'sie/Sie': 'spielten' }
  },
  sprechen: {
    infinitive: 'sprechen',
    translation: 'to speak',
    present: { ich: 'spreche', du: 'sprichst', 'er/sie/es': 'spricht', wir: 'sprechen', ihr: 'sprecht', 'sie/Sie': 'sprechen' },
    past: { ich: 'sprach', du: 'sprachst', 'er/sie/es': 'sprach', wir: 'sprachen', ihr: 'spracht', 'sie/Sie': 'sprachen' }
  }
};

const TENSES = {
  present: 'Present',
  past: 'Past'
};

interface SimpleConjugatorProps {
  className?: string;
}

export function SimpleConjugator({ className = '' }: SimpleConjugatorProps) {
  const [selectedVerb, setSelectedVerb] = useState<string>('sein');
  const [selectedTense, setSelectedTense] = useState<string>('present');
  const [answers, setAnswers] = useState<{ [pronoun: string]: string }>({});
  const [checked, setChecked] = useState<{ [pronoun: string]: boolean | null }>({});
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showingAnswers, setShowingAnswers] = useState<boolean>(false);
  const [allComplete, setAllComplete] = useState<boolean>(false);

  const currentVerb = VERBS[selectedVerb as keyof typeof VERBS];
  const currentConjugations = currentVerb[selectedTense as keyof typeof currentVerb] as { [key: string]: string };

  // Reset when verb or tense changes
  useEffect(() => {
    setAnswers({});
    setChecked({});
    setScore({ correct: 0, total: 0 });
    setError('');
    setShowingAnswers(false);
    setAllComplete(false);
  }, [selectedVerb, selectedTense]);

  // Check if all answers are filled and correct
  useEffect(() => {
    const totalAnswers = PRONOUNS.length;
    const filledAnswers = Object.keys(answers).filter(pronoun => answers[pronoun]?.trim()).length;
    const correctAnswers = Object.keys(checked).filter(pronoun => checked[pronoun] === true).length;
    
    if (filledAnswers === totalAnswers && correctAnswers === totalAnswers) {
      setAllComplete(true);
    } else {
      setAllComplete(false);
    }
  }, [answers, checked]);

  const handleAnswerChange = (pronoun: string, value: string) => {
    setAnswers(prev => ({ ...prev, [pronoun]: value }));
    setError(''); // Clear any errors when user types
    // Clear check status when user types
    if (checked[pronoun] !== undefined) {
      setChecked(prev => ({ ...prev, [pronoun]: null }));
    }
  };

  const checkAnswer = async (pronoun: string) => {
    if (!answers[pronoun]?.trim()) {
      setError('Please enter a conjugation before checking');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate brief loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const userAnswer = answers[pronoun]?.trim().toLowerCase();
    const correctAnswer = currentConjugations[pronoun]?.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;
    
    setChecked(prev => ({ ...prev, [pronoun]: isCorrect }));
    
    // Update score
    const wasAlreadyChecked = checked[pronoun] !== undefined && checked[pronoun] !== null;
    if (!wasAlreadyChecked) {
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }));
    }
    
    setLoading(false);
  };

  const checkAll = async () => {
    const answersToCheck = PRONOUNS.filter(({ pronoun }) => answers[pronoun]?.trim());
    
    if (answersToCheck.length === 0) {
      setError('Please enter at least one conjugation to check');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate checking all answers with brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    answersToCheck.forEach(({ pronoun }) => {
      if (!checked[pronoun]) { // Only check if not already checked
        const userAnswer = answers[pronoun]?.trim().toLowerCase();
        const correctAnswer = currentConjugations[pronoun]?.toLowerCase();
        const isCorrect = userAnswer === correctAnswer;
        
        setChecked(prev => ({ ...prev, [pronoun]: isCorrect }));
        
        // Update score
        const wasAlreadyChecked = checked[pronoun] !== undefined && checked[pronoun] !== null;
        if (!wasAlreadyChecked) {
          setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
          }));
        }
      }
    });
    
    setLoading(false);
  };

  const showAnswers = () => {
    const newAnswers = { ...answers };
    const newChecked = { ...checked };
    
    PRONOUNS.forEach(({ pronoun }) => {
      newAnswers[pronoun] = currentConjugations[pronoun];
      newChecked[pronoun] = true;
    });
    
    setAnswers(newAnswers);
    setChecked(newChecked);
    setShowingAnswers(true);
    setError('');
  };

  const reset = () => {
    setAnswers({});
    setChecked({});
    setScore({ correct: 0, total: 0 });
    setError('');
    setShowingAnswers(false);
    setAllComplete(false);
    setLoading(false);
  };

  const getScoreColor = (score: number, total: number) => {
    if (total === 0) return 'text-gray-600';
    const percentage = (score / total) * 100;
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeedbackColor = (score: number, total: number) => {
    if (total === 0) return 'text-gray-600';
    const percentage = (score / total) * 100;
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeedbackMessage = (score: number, total: number) => {
    if (total === 0) return '';
    const percentage = (score / total) * 100;
    if (percentage === 100) return 'Perfect! Outstanding work!';
    if (percentage >= 85) return 'Excellent conjugation skills!';
    if (percentage >= 70) return 'Good work! Keep practicing!';
    return 'Keep practicing to improve!';
  };

  return (
    <div className={cn("bg-blue-50 border border-blue-200 rounded-lg p-4 my-4", className)}>
      {/* Header with icon */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex-shrink-0 h-10 w-10 rounded-full border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">Verb Conjugation Practice</h3>
          <p className="text-sm text-gray-600 mb-2">
            Practice conjugating: <span className="font-medium text-blue-600">"{currentVerb.infinitive}"</span> ({currentVerb.translation})
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Verb:</label>
          <select 
            value={selectedVerb}
            onChange={(e) => setSelectedVerb(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {Object.entries(VERBS).map(([key, verb]) => (
              <option key={key} value={key}>
                {verb.infinitive} ({verb.translation})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Tense:</label>
          <select 
            value={selectedTense}
            onChange={(e) => setSelectedTense(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {Object.entries(TENSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Score */}
        <div className={cn("font-medium", getScoreColor(score.correct, score.total))}>
          Score: {score.correct}/{score.total}
          {score.total > 0 && (
            <span className="ml-1">
              ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </div>
      </div>

      {/* Conjugation Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-center mb-4">
          <h4 className="font-medium text-gray-800">
            {TENSES[selectedTense as keyof typeof TENSES]} Tense
          </h4>
        </div>

        <div className="space-y-3">
          {PRONOUNS.map(({ pronoun, label }) => (
            <div key={pronoun} className="grid grid-cols-4 gap-3 items-center">
              {/* Pronoun */}
              <div className="text-right font-medium text-gray-700">
                {label}
              </div>

              {/* Input */}
              <div className="col-span-2 relative">
                <Input
                  value={answers[pronoun] || ''}
                  onChange={(e) => handleAnswerChange(pronoun, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      checkAnswer(pronoun);
                    }
                  }}
                  className={cn(
                    "text-center h-9",
                    checked[pronoun] === true && "border-green-500 bg-green-50",
                    checked[pronoun] === false && "border-red-500 bg-red-50"
                  )}
                  placeholder="conjugation..."
                />
                
                {/* Check icon */}
                {checked[pronoun] !== undefined && checked[pronoun] !== null && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {checked[pronoun] ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Check button */}
              <div>
                <Button
                  size="sm"
                  onClick={() => checkAnswer(pronoun)}
                  disabled={!answers[pronoun]?.trim() || loading}
                  className={cn(
                    "h-9 w-full text-xs",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  ) : (
                    'Check'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <Button 
          onClick={checkAll} 
          disabled={loading}
          className={cn(
            "bg-blue-600 text-white hover:bg-blue-700",
            loading && "opacity-50 cursor-not-allowed"
          )}
          size="sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              Checking...
            </>
          ) : (
            'Check All'
          )}
        </Button>
        <Button 
          onClick={showAnswers} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          Show Answers
        </Button>
        <Button 
          onClick={reset} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-gray-800"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-2 mt-2">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Checking conjugations...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-red-700">
            <XCircleIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Completion Feedback */}
      {allComplete && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
          <div className="text-center">
            <div className="mb-3">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <div className={cn("text-3xl font-bold", getFeedbackColor(score.correct, score.total))}>
                {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
              </div>
              <p className={cn("text-sm font-medium mt-1", getFeedbackColor(score.correct, score.total))}>
                {getFeedbackMessage(score.correct, score.total)}
              </p>
            </div>
            
            <div className="text-xs text-gray-500">
              Score: {score.correct}/{score.total} • All conjugations completed!
            </div>
          </div>
        </div>
      )}

      {/* Showing answers indicator */}
      {showingAnswers && !allComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">All correct answers are now shown</span>
          </div>
        </div>
      )}

      {/* Quick tip */}
      <div className="text-center text-xs text-gray-500 mt-3">
        💡 Press Enter after typing to check your answer quickly
      </div>
    </div>
  );
}