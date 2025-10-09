'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LessonAudioPlayer from './LessonAudioPlayer';
import LessonMultipleChoice from './LessonMultipleChoice';

// Types for the listening_exercises table structure
interface MessageGroup {
  message_speaker: string;
  group_identifier: string;
  message_transcript: string;
  questions_in_group: Question[];
}

interface Question {
  question_stem: string;
  question_number: number;
  options: Option[];
}

interface Option {
  letter: string;
  text_caption: string;
  image_description?: string;
  image_url?: string;
  is_correct: boolean;
  explanation: string;
}

interface QuestionData {
  message_groups: MessageGroup[];
  audio_introduction_M1?: string;
  overall_instructions_text?: string;
}

interface ListeningExerciseData {
  id: number;
  course_name: string;
  chapter_id: string;
  exercise_id: string;
  audio_url: string;
  transcript: string;
  audio_title: string;
  questions: QuestionData;
  exercise_type: string;
  task_id?: string;
}

interface ListeningExerciseTaskProps {
  taskId: string;
  userId: string;
  onComplete?: (data: {
    totalScore: number;
    maxScore: number;
    exerciseResults: any[];
    audioPlayCount: number;
  }) => void;
}

export default function ListeningExerciseTask({
  taskId,
  userId,
  onComplete,
}: ListeningExerciseTaskProps) {
  const [exerciseData, setExerciseData] = useState<ListeningExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  const [questionResults, setQuestionResults] = useState<any[]>([]);
  const [allCompleted, setAllCompleted] = useState(false);

  // Fetch exercise data from database
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        const { data, error } = await supabase
          .from('listening_exercises')
          .select('*')
          .eq('task_id', taskId)
          .single();

        if (error) throw error;

        // Parse the questions JSONB field
        const parsedData = {
          ...data,
          questions: typeof data.questions === 'string' 
            ? JSON.parse(data.questions) 
            : data.questions
        };

        console.log('Parsed exercise data:', parsedData);
        console.log('Questions structure:', parsedData.questions);

        setExerciseData(parsedData);
      } catch (err) {
        console.error('Error fetching exercise data:', err);
        setError('Failed to load exercise data');
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [taskId]);

  const handleQuestionComplete = (questionNumber: number, result: any) => {
    const newResults = questionResults.filter(r => r.questionNumber !== questionNumber);
    newResults.push({ questionNumber, ...result });
    setQuestionResults(newResults);
    
    const newCompleted = new Set(completedQuestions);
    newCompleted.add(questionNumber);
    setCompletedQuestions(newCompleted);

    // Check if all questions are completed
    if (exerciseData) {
      const totalQuestions = exerciseData.questions?.message_groups?.reduce(
        (sum, group) => sum + group.questions_in_group.length,
        0
      ) || 0;

      if (newCompleted.size === totalQuestions) {
        completeExercise(newResults);
      }
    }
  };

  const completeExercise = async (results: any[]) => {
    setAllCompleted(true);
    
    const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    const maxScore = results.length; // 1 point per question
    
    try {
      // Save the exercise completion to database
      const { error } = await supabase
        .from('listening_scores')
        .insert({
          user_id: userId,
          exercise_id: taskId,
          score: totalScore,
          max_score: maxScore,
          audio_play_count: audioPlayCount,
          completed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving exercise score:', error);
      }

      if (onComplete) {
        onComplete({
          totalScore,
          maxScore,
          exerciseResults: results,
          audioPlayCount,
        });
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const handleAudioPlayCountUpdate = (count: number) => {
    setAudioPlayCount(count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading exercise...</div>
      </div>
    );
  }

  if (error || !exerciseData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">{error || 'Exercise not found'}</div>
      </div>
    );
  }

  const totalQuestions = exerciseData.questions?.message_groups?.reduce(
    (sum, group) => sum + group.questions_in_group.length,
    0
  ) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Title and Instructions */}
      <h1 className="text-2xl font-bold mb-2">{exerciseData.audio_title}</h1>
      {exerciseData.questions.overall_instructions_text && (
        <p className="text-gray-600 mb-6">
          {exerciseData.questions.overall_instructions_text}
        </p>
      )}

      {/* Audio Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Audio</h2>
        <div className="mb-4">
          <LessonAudioPlayer
            audioUrl={exerciseData.audio_url}
            sectionId={exerciseData.exercise_id}
            userId={userId}
            maxPlays={3}
            onPlayCountUpdate={handleAudioPlayCountUpdate}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Listen carefully and answer the questions below</span>
          <span>Plays: {audioPlayCount}/3</span>
        </div>
        
        {/* Transcript */}
        {exerciseData.transcript && (audioPlayCount >= 2 || allCompleted) && (
          <div className="mt-4">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </button>
            
            {showTranscript && (
              <div className="mt-3 p-4 bg-gray-50 border-l-4 border-blue-500">
                <h4 className="font-medium text-gray-800 mb-2">Transcript</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{exerciseData.transcript}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Progress: {completedQuestions.size} of {totalQuestions} completed
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  completedQuestions.has(index + 1)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(completedQuestions.size / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions by Message Group */}
      <div className="space-y-8">
        <h2 className="text-xl font-semibold mb-6">Questions</h2>
        {exerciseData.questions?.message_groups?.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-6">
            {/* Group Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">
                {group.group_identifier} - {group.message_speaker}
              </h3>
              <p className="text-gray-700 italic">"{group.message_transcript}"</p>
            </div>

            {/* Questions in Group */}
            {group.questions_in_group?.map((question) => {
              const isCompleted = completedQuestions.has(question.question_number);
              const correctOption = question.options?.find(opt => opt.is_correct);
              
              return (
                <div 
                  key={question.question_number}
                  className={`p-4 border-l-4 ${
                    isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">{question.question_stem}</h4>
                    {isCompleted && (
                      <span className="text-green-600 text-sm">✓ Completed</span>
                    )}
                  </div>
                  
                  <LessonMultipleChoice
                    exerciseId={`${taskId}_q${question.question_number}`}
                    sectionId={exerciseData.exercise_id}
                    lessonId={exerciseData.chapter_id}
                    userId={userId}
                    question=""
                    options={question.options?.map(opt => opt.text_caption) || []}
                    correctAnswer={correctOption?.text_caption || ''}
                    points={1}
                    explanation={correctOption?.explanation}
                    onComplete={(result) => 
                      handleQuestionComplete(question.question_number, result)
                    }
                  />
                </div>
              );
            })}
          </div>
        )) || (
          <div className="text-center py-8">
            <p className="text-gray-600">No questions available for this exercise.</p>
          </div>
        )}
      </div>

      {/* Completion Summary */}
      {allCompleted && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Exercise Completed!</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {questionResults.reduce((sum, r) => sum + r.pointsEarned, 0)}
              </div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {questionResults.filter(r => r.isCorrect).length}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(questionResults.reduce((sum, r) => sum + r.timeTaken, 0) / 60)}m
              </div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {audioPlayCount}
              </div>
              <div className="text-sm text-gray-600">Plays</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}