"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Mic,
  RotateCcw,
  Award,
  Play,
  Target,
  Headphones,
  MicIcon,
  Zap,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assessPronunciationFast } from "@/lib/fast-pronunciation-helper";
import { toast } from 'sonner';

interface Word {
  word: string;
  definition: string;
  difficulty?: string;
}

interface PronunciationExerciseData {
  id: number;
  course_name: string;
  chapter_id: string;
  exercise_id: string;
  words: Word[];
  exercise_type: string;
  task_id: string;
}

interface PronunciationFlashcardProps {
  taskId: string;
  userId: string;
  words?: Word[];
  pronunciationConcept?: string;
  onComplete?: (score: number, isGood: boolean) => void;
}

// Intro screen component
function PronunciationIntroScreen({ 
  onStart, 
  wordCount,
  pronunciationConcept
}: { 
  onStart: () => void; 
  wordCount: number;
  pronunciationConcept?: string;
}) {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    {
      icon: Headphones,
      title: "Listen First",
      description: "Click the audio button to hear the correct pronunciation",
      color: "text-blue-600 bg-blue-50 border-blue-200"
    },
    {
      icon: MicIcon,
      title: "Record Yourself", 
      description: "Tap the microphone and speak clearly into your device",
      color: "text-purple-600 bg-purple-50 border-purple-200"
    },
    {
      icon: Target,
      title: "Get Fast Feedback",
      description: "Our AI analyzes your pronunciation instantly with our new fast system",
      color: "text-green-600 bg-green-50 border-green-200"
    },
    {
      icon: Zap,
      title: "Practice & Improve",
      description: "Repeat words until you achieve the pronunciation you want",
      color: "text-orange-600 bg-orange-50 border-orange-200"
    }
  ];

  // Cycle through tips automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-[#FDFBF9] z-50">
      <div className="w-full max-w-md mx-auto">
      {/* Main Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <Volume2 className="h-8 w-8 text-purple-600" />
          Pronunciation Practice
        </h1>
      </div>
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full">
            <Volume2 className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <p className="text-gray-600 text-lg mb-4">
          Perfect your German pronunciation with AI feedback
        </p>
        
        {pronunciationConcept && (
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-purple-200">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 font-semibold">Focus: {pronunciationConcept}</span>
            </div>
          </div>
        )}
        
        <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
          <span className="text-purple-700 font-semibold">{wordCount} words</span>
          <span className="text-purple-600">to practice</span>
        </div>
      </div>

      {/* Animated Tips */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          How it works:
        </h3>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`border rounded-lg p-4 ${tips[currentTip].color}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {React.createElement(tips[currentTip].icon, {
                  className: `h-6 w-6 ${tips[currentTip].color.split(' ')[0]}`
                })}
              </div>
              <div>
                <h4 className={`font-semibold mb-1 ${tips[currentTip].color.split(' ')[0]}`}>
                  {tips[currentTip].title}
                </h4>
                <p className="text-sm text-gray-700">
                  {tips[currentTip].description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Tip indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {tips.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentTip ? 'bg-purple-600 scale-125' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="text-center">
        <motion.button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <Play className="h-6 w-6" />
            Start Pronunciation Practice
          </div>
        </motion.button>
        
        <p className="text-sm text-gray-500 mt-3">
          Find a quiet place for the most accurate pronunciation assessment
        </p>
      </div>
      </div>
    </div>
  );
}

export default function PronunciationFlashcard({
  taskId,
  userId,
  words = [],
  pronunciationConcept,
  onComplete,
}: PronunciationFlashcardProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [scores, setScores] = useState<Record<number, number>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [practiceSessionEnded, setPracticeSessionEnded] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    score: number;
    feedback: string;
    pronunciation: string;
    processingTime?: number;
  } | null>(null);
  const [wordAudios, setWordAudios] = useState<Record<string, string>>({});
  const [loadingWordAudio, setLoadingWordAudio] = useState<
    Record<string, boolean>
  >({});
  const [error, setError] = useState<string>("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handlePronunciationComplete = async (score: number) => {
    const currentWord = words[currentWordIndex];

    // Generate feedback based on score
    const generateFeedback = (score: number) => {
      if (score >= 90) return "Excellent pronunciation! Perfect clarity and accuracy.";
      if (score >= 80) return "Great job! Your pronunciation is very clear.";
      if (score >= 70) return "Good pronunciation. Keep practicing for better clarity.";
      if (score >= 60) return "Fair pronunciation. Focus on the vowel sounds.";
      return "Keep practicing! Try to speak more clearly.";
    };

    // Set feedback
    setCurrentFeedback({
      score,
      feedback: generateFeedback(score),
      pronunciation: currentWord.word,
    });
    setShowFeedback(true);
    setIsProcessing(false);

    // Update local state
    setScores((prev) => ({ ...prev, [currentWordIndex]: score }));
    setCompletedWords((prev) => new Set([...Array.from(prev), currentWordIndex]));
    
    // Save individual word score immediately
    try {
      const response = await fetch('/api/pronunciation/save-lesson-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          course_name: 'telc_a1',
          words_attempted: [currentWord.word],
          word_scores: { [currentWord.word]: score },
          average_score: score,
          is_partial: true // Flag to indicate this is a partial save
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save pronunciation score for word:', currentWord.word);
      }
    } catch (error) {
      console.error('Error saving pronunciation score:', error);
    }

    // Don't auto-complete when all words are done - let users continue practicing
    // They can click "End Lesson" button when ready
  };

  const nextWord = () => {
    // Move to next word or completion screen
    if (currentWordIndex < words.length) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
    setIsRecording(false);
    setIsProcessing(false);
    setShowFeedback(false);
    setCurrentFeedback(null);
    setError("");
    audioChunks.current = [];
  };

  const prevWord = () => {
    // Allow cycling through words for continuous practice
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    } else {
      setCurrentWordIndex(words.length - 1); // Loop to last word
    }
    setIsRecording(false);
    setIsProcessing(false);
    setShowFeedback(false);
    setCurrentFeedback(null);
    setError("");
    audioChunks.current = [];
  };

  const resetExercise = () => {
    setCurrentWordIndex(0);
    setCompletedWords(new Set());
    setScores({});
    setIsRecording(false);
    setIsProcessing(false);
    setShowFeedback(false);
    setCurrentFeedback(null);
    setError("");
    audioChunks.current = [];
  };

  const startRecording = async () => {
    try {
      // Reset all states first
      setShowFeedback(false);
      setCurrentFeedback(null);
      setIsProcessing(false);
      setError("");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 48000,
      };

      const recorder = new MediaRecorder(stream, options);

      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, {
          type: options.mimeType,
        });

        await assessPronunciation(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Failed to setup recording. Please check your microphone access.");
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const assessPronunciation = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const currentWord = words[currentWordIndex];
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: audioBlob.type,
      });

      console.log("[PronunciationFlashcard] Using FastAPI assessment for:", currentWord.word);
      
      const result = await assessPronunciationFast(file, currentWord.word, "de-DE");
      
      console.log("[PronunciationFlashcard] FastAPI result:", {
        score: result.pronunciationScore,
        processingTime: result.processingTime,
        method: result.method
      });

      handlePronunciationComplete(result.pronunciationScore);
    } catch (err) {
      console.error("Error in pronunciation assessment:", err);
      setError(err instanceof Error ? err.message : "Assessment failed");
      setIsProcessing(false);
    }
  };

  const handleEndLesson = async () => {
    // Calculate average score from completed words
    const completedScores = Object.values(scores);
    const averageScore = completedScores.length > 0 
      ? completedScores.reduce((sum, s) => sum + s, 0) / completedScores.length
      : 0;
    
    // Save final scores if any words were practiced
    if (completedScores.length > 0) {
      try {
        const wordScoresMap: Record<string, number> = {};
        words.forEach((word, index) => {
          if (scores[index] !== undefined) {
            wordScoresMap[word.word] = scores[index];
          }
        });
        
        const response = await fetch('/api/pronunciation/save-lesson-scores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_id: taskId,
            course_name: 'telc_a1',
            words_attempted: Object.keys(wordScoresMap),
            word_scores: wordScoresMap,
            average_score: averageScore,
            is_partial: false // Final save when ending lesson
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to save final pronunciation scores');
        } else {
          console.log('Final pronunciation scores saved successfully');
        }
      } catch (error) {
        console.error('Error saving final pronunciation scores:', error);
      }
    }
    
    // Mark the session as ended
    setPracticeSessionEnded(true);
    
    // Show success notification before calling onComplete
    toast.success('Lesson completed successfully!');
    
    // Call onComplete with current average score
    if (onComplete) {
      const isGood = averageScore >= 70;
      onComplete(averageScore, isGood);
    }
  };

  const getWordAudio = async (word: string) => {
    if (wordAudios[word]) {
      // Play existing audio if already fetched
      try {
        const audio = new Audio(wordAudios[word]);
        await audio.play();
      } catch (error) {
        console.error(`Error playing cached audio for word '${word}':`, error);
      }
      return;
    }

    setLoadingWordAudio((prev) => ({ ...prev, [word]: true }));
    try {
      const response = await fetch("/api/generate-word-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          language: "de",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Audio generation failed:", response.status, errorText);
        throw new Error("Failed to generate word audio");
      }

      const { audioUrl } = await response.json();
      setWordAudios((prev) => ({ ...prev, [word]: audioUrl }));

      // Play the audio
      try {
        const audio = new Audio(audioUrl);
        await audio.play();
      } catch (playError) {
        console.error(`Error playing audio for word '${word}':`, playError);
      }
    } catch (error) {
      console.error(`Error getting audio for word '${word}':`, error);
    } finally {
      setLoadingWordAudio((prev) => ({ ...prev, [word]: false }));
    }
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any word audio blob URLs
      Object.values(wordAudios).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [wordAudios]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntro || practiceSessionEnded) return;
      
      if (e.key === 'ArrowLeft') {
        prevWord();
      } else if (e.key === 'ArrowRight') {
        nextWord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntro, practiceSessionEnded, currentWordIndex]);

  // Show intro screen first
  if (showIntro) {
    return (
      <PronunciationIntroScreen 
        onStart={() => setShowIntro(false)}
        wordCount={words.length}
        pronunciationConcept={pronunciationConcept}
      />
    );
  }

  const currentWord = words[currentWordIndex];
  const isCurrentWordCompleted = completedWords.has(currentWordIndex);
  const currentWordScore = scores[currentWordIndex];
  const allWordsCompleted = completedWords.size === words.length;
  const showCompletionScreen = currentWordIndex >= words.length;

  return (
    <div className="w-full max-w-lg mx-auto p-3 sm:p-4 pt-12 sm:pt-16">
      {/* Progress Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          {words.map((_, index) => (
            <div
              key={index}
              className={`relative transition-all duration-300 ${
                index === currentWordIndex
                  ? "w-4 h-4 sm:w-5 sm:h-5"
                  : "w-3 h-3 sm:w-4 sm:h-4"
              }`}
            >
              <div
                className={`w-full h-full rounded-full transition-all duration-300 ${
                  index === currentWordIndex
                    ? "bg-blue-600 shadow-lg shadow-blue-200"
                    : completedWords.has(index)
                      ? "bg-green-500 shadow-md shadow-green-200"
                      : "bg-gray-300"
                }`}
              />
              {index === currentWordIndex && (
                <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-30" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Completion Screen - shown as 11th screen */}
      {showCompletionScreen ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8 text-center"
        >
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <Award className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Excellent Work!
            </h2>
            <p className="text-gray-600 mb-4">
              You've completed all {words.length} words
            </p>
            
            {/* Score Summary */}
            {Object.keys(scores).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Average Score</p>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(
                    Object.values(scores).reduce((a, b) => a + b, 0) /
                    Object.values(scores).length
                  )}%
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleEndLesson}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <CheckCircle className="h-5 w-5 inline mr-2" />
              End Lesson
            </button>
            <button
              onClick={resetExercise}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-all duration-200 font-medium"
            >
              <RotateCcw className="h-5 w-5 inline mr-2" />
              Practice Again
            </button>
          </div>
        </motion.div>
      ) : (
      /* Main Card */
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWordIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-4 mb-3"
        >
          {/* Navigation Arrows on Card */}
          {currentWordIndex > 0 && (
            <button
              onClick={prevWord}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-gray-100 transition-all duration-200 active:scale-95 z-10 shadow-sm"
              aria-label="Previous word"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>
          )}
          {currentWordIndex < words.length && (
            <button
              onClick={nextWord}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-gray-100 transition-all duration-200 active:scale-95 z-10 shadow-sm"
              aria-label="Next word"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>
          )}

          {/* Word */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {currentWord.word}
              </h2>
            </div>
            <div className="max-w-xs mx-auto">
              <p className="text-sm text-gray-700 leading-relaxed px-6">
                {currentWord.definition}
              </p>
            </div>
            
            {/* Listen button */}
            <div className="mt-3">
              <button
                onClick={() => getWordAudio(currentWord.word)}
                disabled={loadingWordAudio[currentWord.word]}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Listen to pronunciation"
              >
                {loadingWordAudio[currentWord.word] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border border-blue-600 border-t-transparent"></div>
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Listen</span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Feedback Display */}
          {showFeedback && currentFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200"
            >
              {/* Overall Score */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${currentFeedback.score >= 80 ? "bg-green-100" : currentFeedback.score >= 60 ? "bg-yellow-100" : "bg-red-100"}`}>
                    <Award
                      className={`h-5 sm:h-6 w-5 sm:w-6 ${currentFeedback.score >= 80 ? "text-green-600" : currentFeedback.score >= 60 ? "text-yellow-600" : "text-red-600"}`}
                    />
                  </div>
                  <span
                    className={`text-3xl sm:text-4xl font-bold ${currentFeedback.score >= 80 ? "text-green-700" : currentFeedback.score >= 60 ? "text-yellow-700" : "text-red-700"}`}
                  >
                    {Math.round(currentFeedback.score)}%
                  </span>
                </div>
                <div className={`max-w-sm mx-auto p-3 rounded-lg ${currentFeedback.score >= 80 ? "bg-green-50 border border-green-200" : currentFeedback.score >= 60 ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"}`}>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">
                    {currentFeedback.feedback}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${currentFeedback.score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-3 rounded-full ${
                      currentFeedback.score >= 80
                        ? "bg-green-500"
                        : currentFeedback.score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
                
                {currentFeedback.processingTime && (
                  <p className="text-xs text-gray-400 mt-2">
                    ⚡ Assessed in {currentFeedback.processingTime}ms (FastAPI)
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Recording States */}
          <div className="text-center">
            {!isRecording && !isProcessing && !showFeedback && (
              <div>
                <div className="relative inline-block">
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-blue-700"
                  >
                    <Mic className="h-6 w-6 sm:h-8 sm:w-8" />
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-700 font-semibold">
                    Tap to record
                  </p>
                </div>
              </div>
            )}

            {isRecording && (
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="relative inline-block">
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-red-600 text-white shadow-lg hover:shadow-xl transition-all active:scale-95 hover:bg-red-700"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-sm"></div>
                  </button>
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40 pointer-events-none"></div>
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-30 scale-110 pointer-events-none"></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-center items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <p className="text-sm text-red-600 font-semibold">
                    Recording...
                  </p>
                </div>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="relative inline-block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-3 border-white border-t-transparent"></div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-20 scale-110 pointer-events-none"></div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-blue-600 font-semibold">
                    Analyzing...
                  </p>
                </div>
              </motion.div>
            )}

            {showFeedback && (
              <div>
                <button
                  onClick={startRecording}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
                >
                  <Mic className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Try again</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      )}

    </div>
  );
}