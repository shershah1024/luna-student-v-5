'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Circle, 
  Play, 
  Pause,
  RotateCcw,
  BookOpen,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';

interface ListeningExercise {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'matching' | 'true_false' | 'ordering';
  content: any;
  points?: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface LessonListeningTaskA1A2Props {
  sectionId: string;
  lessonId: string;
  userId: string;
  title: string;
  description?: string;
  instructions?: string;
  audioUrl: string;
  transcript?: string;
  exercises: ListeningExercise[];
  level: 'A1' | 'A2';
  maxAudioPlays?: number;
  showTranscriptAfter?: number;
  theme?: string;
  estimatedTime?: number;
  onComplete?: (data: {
    totalScore: number;
    maxScore: number;
    exerciseResults: any[];
    audioPlayCount: number;
    completionTime: number;
  }) => void;
}

// Level-specific instruction templates
const LEVEL_INSTRUCTIONS = {
  A1: {
    audioTitle: "🎧 Listen to the Audio",
    audioDescription: "You will hear German audio. Listen carefully and answer the questions.",
    questionsTitle: "📝 Answer the Questions", 
    questionsDescription: "Choose the best answer for each question. Take your time!",
    transcriptTitle: "📄 Read the Text",
    transcriptDescription: "The written version of what you heard.",
    completionTitle: "🎉 Great Job!",
    completionDescription: "You completed all the listening questions!",
    playInstruction: "Click the play button to listen",
    maxPlaysWarning: "You can listen {count} more times",
    transcriptAvailable: "Transcript available after {count} plays",
    progressText: "Question {current} of {total}",
  },
  A2: {
    audioTitle: "🎧 Audio Listening",
    audioDescription: "Listen to the German audio passage and prepare to answer questions.",
    questionsTitle: "📝 Comprehension Questions",
    questionsDescription: "Answer the questions based on what you heard.",
    transcriptTitle: "📄 Audio Transcript", 
    transcriptDescription: "The written text of the audio for reference.",
    completionTitle: "🎉 Listening Task Complete!",
    completionDescription: "Excellent work on completing this listening exercise!",
    playInstruction: "Use the audio player to listen to the passage",
    maxPlaysWarning: "Remaining plays: {count}",
    transcriptAvailable: "Transcript unlocked after {count} plays",
    progressText: "Progress: {current}/{total} questions",
  }
};

export default function LessonListeningTaskA1A2({
  sectionId,
  lessonId,
  userId,
  title,
  description,
  instructions,
  audioUrl,
  transcript,
  exercises,
  level,
  maxAudioPlays = level === 'A1' ? 4 : 3,
  showTranscriptAfter = 1,
  theme = 'Everyday Conversation',
  estimatedTime = 10,
  onComplete,
}: LessonListeningTaskA1A2Props) {
  const { user } = useUser();
  const [exerciseResults, setExerciseResults] = useState<any[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptUnlocked, setTranscriptUnlocked] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const instructions_template = LEVEL_INSTRUCTIONS[level];

  // Initialize audio element
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('play', () => setIsAudioPlaying(true));
      audio.addEventListener('pause', () => setIsAudioPlaying(false));
      audio.addEventListener('ended', () => setIsAudioPlaying(false));
      setAudioElement(audio);
      
      return () => {
        audio.pause();
        audio.removeEventListener('play', () => setIsAudioPlaying(true));
        audio.removeEventListener('pause', () => setIsAudioPlaying(false));
        audio.removeEventListener('ended', () => setIsAudioPlaying(false));
      };
    }
  }, [audioUrl]);

  const handlePlayAudio = () => {
    if (!audioElement) return;
    
    if (audioPlayCount >= maxAudioPlays) {
      alert(`You have reached the maximum number of plays (${maxAudioPlays})`);
      return;
    }

    if (isAudioPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
      setAudioPlayCount(prev => prev + 1);
    }
  };

  const handleExerciseComplete = (exerciseId: string, result: any) => {
    const newResults = exerciseResults.filter(r => r.exerciseId !== exerciseId);
    newResults.push({ exerciseId, ...result });
    setExerciseResults(newResults);
    
    const newCompleted = new Set(completedExercises);
    newCompleted.add(exerciseId);
    setCompletedExercises(newCompleted);

    // Auto-advance to next question for A1 level
    if (level === 'A1' && currentExerciseIndex < exercises.length - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(prev => prev + 1);
      }, 1500);
    }

    if (newCompleted.size === exercises.length) {
      completeTask(newResults);
    }
  };

  const completeTask = async (results: any[]) => {
    setAllCompleted(true);
    const completionTime = Date.now() - startTime.getTime();
    
    const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    const maxScore = exercises.reduce((sum, ex) => sum + (ex.points || 1), 0);
    
    try {
      const { error } = await supabase
        .from('lesson_section_scores')
        .insert({
          user_id: userId,
          section_id: sectionId,
          score: totalScore,
          max_score: maxScore,
          time_spent: Math.round(completionTime / 1000),
          feedback: { 
            exercise_results: results,
            audio_play_count: audioPlayCount,
            level,
            completion_time: completionTime
          },
        });

      if (error) {
        console.error('Error saving section score:', error);
      }

      if (onComplete) {
        onComplete({
          totalScore,
          maxScore,
          exerciseResults: results,
          audioPlayCount,
          completionTime: Math.round(completionTime / 1000),
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const renderExercise = (exercise: ListeningExercise, isActive: boolean) => {
    const isCompleted = completedExercises.has(exercise.id);

    switch (exercise.type) {
      case 'multiple_choice':
        return renderMultipleChoice(exercise, isActive);
      case 'true_false':
        return renderTrueFalse(exercise, isActive);
      case 'fill_in_blank':
        return renderFillInBlank(exercise, isActive);
      default:
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">Exercise type "{exercise.type}" is not supported yet.</p>
          </div>
        );
    }
  };

  const renderMultipleChoice = (exercise: ListeningExercise, isActive: boolean) => {
    const { question, options, correctIndex } = exercise.content;
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const isCompleted = completedExercises.has(exercise.id);

    const handleAnswerSelect = (index: number) => {
      if (showResult || isCompleted) return;
      
      setSelectedAnswer(index);
      setShowResult(true);
      
      const isCorrect = index === correctIndex;
      const result = {
        isCorrect,
        pointsEarned: isCorrect ? (exercise.points || 1) : 0,
        timeTaken: Math.round((Date.now() - startTime.getTime()) / 1000),
        selectedAnswer: index,
        correctAnswer: correctIndex,
      };
      
      setTimeout(() => {
        handleExerciseComplete(exercise.id, result);
      }, 1000);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{question}</h3>
        <div className="space-y-3">
          {options.map((option: string, index: number) => {
            let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ";
            
            if (showResult || isCompleted) {
              if (index === correctIndex) {
                buttonClass += "border-green-500 bg-green-50 text-green-800";
              } else if (index === selectedAnswer && index !== correctIndex) {
                buttonClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                buttonClass += "border-gray-200 bg-gray-50 text-gray-500";
              }
            } else if (selectedAnswer === index) {
              buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
            } else {
              buttonClass += "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult || isCompleted}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-3 font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {showResult && index === correctIndex && (
                    <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {showResult && exercise.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Lightbulb className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Explanation:</p>
                <p className="text-sm text-blue-700 mt-1">{exercise.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrueFalse = (exercise: ListeningExercise, isActive: boolean) => {
    const { statement, correctAnswer } = exercise.content;
    const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
    const [showResult, setShowResult] = useState(false);
    const isCompleted = completedExercises.has(exercise.id);

    const handleAnswerSelect = (answer: boolean) => {
      if (showResult || isCompleted) return;
      
      setSelectedAnswer(answer);
      setShowResult(true);
      
      const isCorrect = answer === correctAnswer;
      const result = {
        isCorrect,
        pointsEarned: isCorrect ? (exercise.points || 1) : 0,
        timeTaken: Math.round((Date.now() - startTime.getTime()) / 1000),
        selectedAnswer: answer,
        correctAnswer,
      };
      
      setTimeout(() => {
        handleExerciseComplete(exercise.id, result);
      }, 1000);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{statement}</h3>
        <div className="space-y-3">
          {[
            { value: true, label: level === 'A1' ? '✓ True (Richtig)' : '✓ True' },
            { value: false, label: level === 'A1' ? '✗ False (Falsch)' : '✗ False' }
          ].map((option) => {
            let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ";
            
            if (showResult || isCompleted) {
              if (option.value === correctAnswer) {
                buttonClass += "border-green-500 bg-green-50 text-green-800";
              } else if (option.value === selectedAnswer && option.value !== correctAnswer) {
                buttonClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                buttonClass += "border-gray-200 bg-gray-50 text-gray-500";
              }
            } else if (selectedAnswer === option.value) {
              buttonClass += "border-blue-500 bg-blue-50 text-blue-800";
            } else {
              buttonClass += "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50";
            }

            return (
              <button
                key={option.value.toString()}
                onClick={() => handleAnswerSelect(option.value)}
                disabled={showResult || isCompleted}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {option.value ? '✓' : '✗'}
                  </span>
                  <span className="font-medium">{option.label}</span>
                  {showResult && option.value === correctAnswer && (
                    <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {showResult && exercise.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Lightbulb className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Explanation:</p>
                <p className="text-sm text-blue-700 mt-1">{exercise.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFillInBlank = (exercise: ListeningExercise, isActive: boolean) => {
    const { text, answers } = exercise.content;
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(answers.length).fill(''));
    const [showResult, setShowResult] = useState(false);
    const isCompleted = completedExercises.has(exercise.id);

    const handleSubmit = () => {
      if (showResult || isCompleted) return;
      
      setShowResult(true);
      
      const correctCount = userAnswers.filter((answer, index) => 
        answer.toLowerCase().trim() === answers[index].toLowerCase().trim()
      ).length;
      
      const isCorrect = correctCount === answers.length;
      const result = {
        isCorrect,
        pointsEarned: isCorrect ? (exercise.points || 1) : Math.round((correctCount / answers.length) * (exercise.points || 1)),
        timeTaken: Math.round((Date.now() - startTime.getTime()) / 1000),
        userAnswers,
        correctAnswers: answers,
        correctCount,
      };
      
      setTimeout(() => {
        handleExerciseComplete(exercise.id, result);
      }, 1500);
    };

    const handleInputChange = (index: number, value: string) => {
      const newAnswers = [...userAnswers];
      newAnswers[index] = value;
      setUserAnswers(newAnswers);
    };

    // Split text by blank placeholders
    const textParts = text.split(/\[BLANK\]/g);
    
    return (
      <div className="space-y-4">
        <div className="text-lg leading-relaxed">
          {textParts.map((part, index) => (
            <span key={index}>
              {part}
              {index < answers.length && (
                <input
                  type="text"
                  value={userAnswers[index] || ''}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  disabled={showResult || isCompleted}
                  className={`mx-2 px-3 py-1 border-2 rounded-md min-w-[120px] text-center font-medium ${
                    showResult || isCompleted
                      ? userAnswers[index]?.toLowerCase().trim() === answers[index]?.toLowerCase().trim()
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : 'border-gray-300 focus:border-blue-500 focus:outline-none'
                  }`}
                  placeholder={level === 'A1' ? 'Type here...' : '...'}
                />
              )}
            </span>
          ))}
        </div>
        
        {!showResult && !isCompleted && (
          <Button 
            onClick={handleSubmit}
            disabled={userAnswers.some(answer => !answer.trim())}
            className="mt-4"
          >
            Submit Answers
          </Button>
        )}
        
        {showResult && (
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-800 mb-2">Correct answers:</p>
              <div className="space-y-1">
                {answers.map((answer, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">Blank {index + 1}:</span> {answer}
                  </div>
                ))}
              </div>
            </div>
            
            {exercise.explanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Explanation:</p>
                    <p className="text-sm text-blue-700 mt-1">{exercise.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const currentExercise = exercises[currentExerciseIndex];
  const progress = (completedExercises.size / exercises.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <Card className="border-2 border-blue-100">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                {title}
              </CardTitle>
              {description && (
                <p className="text-gray-600 mb-3">{description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Level {level}
                </Badge>
                <div className="flex items-center text-gray-600">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {theme}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  ~{estimatedTime} min
                </div>
                <div className="flex items-center text-gray-600">
                  <Target className="h-4 w-4 mr-1" />
                  {exercises.length} questions
                </div>
              </div>
            </div>
          </div>
          {instructions && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{instructions}</p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Audio Player */}
      <Card className="border-2 border-green-100">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Volume2 className="h-5 w-5 mr-2 text-green-600" />
            {instructions_template.audioTitle}
          </CardTitle>
          <p className="text-sm text-gray-600">{instructions_template.audioDescription}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePlayAudio}
                disabled={audioPlayCount >= maxAudioPlays}
                variant={isAudioPlaying ? "destructive" : "default"}
                size="lg"
                className="flex items-center gap-2"
              >
                {isAudioPlaying ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause Audio
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    {audioPlayCount === 0 ? 'Start Listening' : 'Play Again'}
                  </>
                )}
              </Button>
              
              <div className="text-right text-sm">
                <div className="text-gray-600">
                  {instructions_template.maxPlaysWarning.replace('{count}', String(maxAudioPlays - audioPlayCount))}
                </div>
                <div className="font-medium text-lg">
                  {audioPlayCount}/{maxAudioPlays} plays
                </div>
              </div>
            </div>
            
            {audioPlayCount === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 {instructions_template.playInstruction}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      {transcript && (audioPlayCount >= showTranscriptAfter || allCompleted) && (
        <>
          {!transcriptUnlocked && (
            <Card className="border-2 border-blue-100">
              <CardContent className="py-4">
                <div className="flex items-center text-blue-700">
                  <BookOpen className="h-5 w-5 mr-2" />
                  <span className="text-sm">Transcript is now available - click "Show" below to view it</span>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  {instructions_template.transcriptTitle}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowTranscript(!showTranscript);
                    setTranscriptUnlocked(true);
                  }}
                >
                  {showTranscript ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600">{instructions_template.transcriptDescription}</p>
            </CardHeader>
            {showTranscript && (
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {instructions_template.progressText.replace('{current}', String(currentExerciseIndex + 1)).replace('{total}', String(exercises.length))}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-center mt-3 gap-2">
            {exercises.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  completedExercises.has(exercises[index].id)
                    ? 'bg-green-500 scale-110'
                    : index === currentExerciseIndex
                    ? 'bg-blue-500 scale-110'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {!allCompleted && currentExercise && (
        <Card className="border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Circle className={`h-5 w-5 mr-2 ${completedExercises.has(currentExercise.id) ? 'text-green-600' : 'text-orange-600'}`} />
              {instructions_template.questionsTitle}
            </CardTitle>
            <p className="text-sm text-gray-600">{instructions_template.questionsDescription}</p>
          </CardHeader>
          <CardContent>
            {renderExercise(currentExercise, true)}
          </CardContent>
        </Card>
      )}

      {/* Navigation for A2 level */}
      {level === 'A2' && !allCompleted && exercises.length > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
                disabled={currentExerciseIndex === 0}
              >
                ← Previous Question
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentExerciseIndex(prev => Math.min(exercises.length - 1, prev + 1))}
                disabled={currentExerciseIndex === exercises.length - 1}
              >
                Next Question →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Summary */}
      {allCompleted && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 text-xl">
              {instructions_template.completionTitle}
            </CardTitle>
            <p className="text-green-700">{instructions_template.completionDescription}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {exerciseResults.reduce((sum, r) => sum + r.pointsEarned, 0)}
                </div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {exerciseResults.filter(r => r.isCorrect).length}/{exercises.length}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(exerciseResults.reduce((sum, r) => sum + r.timeTaken, 0) / 60)}m
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {audioPlayCount}
                </div>
                <div className="text-sm text-gray-600">Audio Plays</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}