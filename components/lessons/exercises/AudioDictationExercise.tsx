'use client';

import { useState } from 'react';
import LessonAudioPlayer from './LessonAudioPlayer';
import { supabase } from '@/lib/supabase';

interface AudioDictationExerciseProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  instructions: string;
  audioUrl: string;
  expectedText: string;
  points?: number;
  maxAudioPlays?: number;
  showCorrectText?: boolean;
  onComplete?: (data: {
    isCorrect: boolean;
    similarityScore: number;
    timeTaken: number;
    pointsEarned: number;
  }) => void;
}

export default function AudioDictationExercise({
  exerciseId,
  sectionId,
  lessonId,
  userId,
  instructions,
  audioUrl,
  expectedText,
  points = 2,
  maxAudioPlays = 5,
  showCorrectText = true,
  onComplete,
}: AudioDictationExerciseProps) {
  const [startTime] = useState(Date.now());
  const [userText, setUserText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [similarityScore, setSimilarityScore] = useState(0);

  // Calculate text similarity (simple Levenshtein distance)
  const calculateSimilarity = (text1: string, text2: string): number => {
    const str1 = text1.toLowerCase().trim();
    const str2 = text2.toLowerCase().trim();
    
    if (str1 === str2) return 1;
    
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };

  const handleSubmit = async () => {
    if (submitted) return;
    
    setSubmitted(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    const similarity = calculateSimilarity(userText, expectedText);
    setSimilarityScore(similarity);
    
    const isCorrect = similarity >= 0.8; // 80% similarity threshold
    const pointsEarned = Math.round(similarity * points);

    // Save response to database
    try {
      const { error } = await supabase
        .from('lesson_exercise_responses')
        .insert({
          user_id: userId,
          exercise_id: exerciseId,
          response: { 
            user_text: userText,
            expected_text: expectedText,
            similarity_score: similarity,
            audio_plays_used: audioPlayCount
          },
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken: timeTaken,
          hint_used: false,
        });

      if (error) {
        console.error('Error saving response:', error);
      }

      // Notify parent component
      if (onComplete) {
        onComplete({
          isCorrect,
          similarityScore: similarity,
          timeTaken,
          pointsEarned,
        });
      }
    } catch (error) {
      console.error('Error saving exercise response:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.9) return 'Excellent!';
    if (score >= 0.8) return 'Good!';
    if (score >= 0.7) return 'Okay';
    if (score >= 0.5) return 'Needs improvement';
    return 'Try again';
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">{instructions}</p>
        <p className="text-sm text-blue-600 mt-2">
          Listen carefully and write exactly what you hear.
        </p>
      </div>

      {/* Audio Player */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <LessonAudioPlayer
          audioUrl={audioUrl}
          sectionId={sectionId}
          userId={userId}
          maxPlays={maxAudioPlays}
          onPlayCountUpdate={setAudioPlayCount}
        />
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Write what you heard:
        </label>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          disabled={submitted}
          className={`w-full p-4 border rounded-lg resize-none ${
            submitted
              ? 'bg-gray-100 cursor-not-allowed'
              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          }`}
          rows={4}
          placeholder="Type your dictation here..."
        />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Characters: {userText.length}
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitted || !userText.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              submitted || !userText.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Results */}
      {submitted && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold mb-3">Results</h4>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Accuracy: </span>
                <span className={getScoreColor(similarityScore)}>
                  {Math.round(similarityScore * 100)}% - {getScoreText(similarityScore)}
                </span>
              </p>
              <p>
                <span className="font-medium">Points Earned: </span>
                {Math.round(similarityScore * points)} / {points}
              </p>
              <p>
                <span className="font-medium">Audio Plays Used: </span>
                {audioPlayCount} / {maxAudioPlays}
              </p>
            </div>
          </div>

          {/* Show correct text if enabled and accuracy is low */}
          {showCorrectText && similarityScore < 0.8 && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Correct Text:</h4>
              <p className="text-yellow-700">{expectedText}</p>
            </div>
          )}

          {/* Comparison */}
          <details className="bg-gray-50 p-4 rounded-lg">
            <summary className="cursor-pointer font-medium text-gray-700">
              Compare Your Answer
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Your answer:</p>
                <p className="p-2 bg-white rounded border">{userText}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expected:</p>
                <p className="p-2 bg-white rounded border">{expectedText}</p>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}