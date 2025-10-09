/* eslint-disable */
'use client';

import { useState } from 'react';
import LessonAudioPlayer from './LessonAudioPlayer';
import LessonMultipleChoice from './LessonMultipleChoice';
import LessonFillInBlanks from './LessonFillInBlanks';
import LessonMatchingExercise from './LessonMatchingExercise';
import TrueFalseQuestion from './TrueFalseQuestion';
import OrderingExercise from './OrderingExercise';
import { supabase } from '@/lib/supabase';

interface ListeningExercise {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'matching' | 'true_false' | 'ordering';
  content: any;
  points?: number;
  explanation?: string;
}

interface LessonListeningTaskProps {
  sectionId: string;
  lessonId: string;
  userId: string;
  title: string;
  instructions?: string;
  audioUrl: string;
  transcript?: string;
  exercises: ListeningExercise[];
  maxAudioPlays?: number;
  showTranscriptAfter?: number;
  onComplete?: (data: {
    totalScore: number;
    maxScore: number;
    exerciseResults: any[];
    audioPlayCount: number;
  }) => void;
}

export default function LessonListeningTask({
  sectionId,
  lessonId,
  userId,
  title,
  instructions,
  audioUrl,
  transcript,
  exercises,
  maxAudioPlays = 3,
  showTranscriptAfter = 1,
  onComplete,
}: LessonListeningTaskProps) {
  const [exerciseResults, setExerciseResults] = useState<any[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptUnlocked, setTranscriptUnlocked] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  const handleExerciseComplete = (exerciseId: string, result: any) => {
    const newResults = exerciseResults.filter(r => r.exerciseId !== exerciseId);
    newResults.push({ exerciseId, ...result });
    setExerciseResults(newResults);
    
    const newCompleted = new Set(completedExercises);
    newCompleted.add(exerciseId);
    setCompletedExercises(newCompleted);

    if (newCompleted.size === exercises.length) {
      completeTask(newResults);
    }
  };

  const completeTask = async (results: any[]) => {
    setAllCompleted(true);
    
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
          time_spent: results.reduce((sum, r) => sum + r.timeTaken, 0),
          feedback: { 
            exercise_results: results,
            audio_play_count: audioPlayCount
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
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleAudioPlayCountUpdate = (count: number) => {
    setAudioPlayCount(count);
  };

  const renderExercise = (exercise: ListeningExercise, index: number) => {
    const isCompleted = completedExercises.has(exercise.id);
    
    const commonProps = {
      exerciseId: exercise.id,
      sectionId,
      lessonId,
      userId,
      points: exercise.points,
      explanation: exercise.explanation,
      onComplete: (result: any) => handleExerciseComplete(exercise.id, result),
    };

    let exerciseComponent;
    switch (exercise.type) {
      case 'multiple_choice':
        exerciseComponent = (
          <LessonMultipleChoice
            {...commonProps}
            question={exercise.content.question}
            options={exercise.content.options}
            correctIndex={exercise.content.correctIndex}
            correctAnswer={exercise.content.correctAnswer}
          />
        );
        break;
      
      case 'fill_in_blank':
        exerciseComponent = (
          <LessonFillInBlanks
            {...commonProps}
            text={exercise.content.text}
            answers={exercise.content.answers}
            hints={exercise.content.hints}
          />
        );
        break;
      
      case 'matching':
        exerciseComponent = (
          <LessonMatchingExercise
            {...commonProps}
            instructions={exercise.content.instructions}
            leftItems={exercise.content.leftItems}
            rightItems={exercise.content.rightItems}
            correctPairs={exercise.content.correctPairs}
          />
        );
        break;
      
      case 'true_false':
        exerciseComponent = (
          <TrueFalseQuestion
            {...commonProps}
            statement={exercise.content.statement}
            correctAnswer={exercise.content.correctAnswer}
            referenceText={exercise.content.referenceText}
          />
        );
        break;
      
      case 'ordering':
        exerciseComponent = (
          <OrderingExercise
            {...commonProps}
            instructions={exercise.content.instructions}
            items={exercise.content.items}
            correctOrder={exercise.content.correctOrder}
          />
        );
        break;
      
      default:
        exerciseComponent = null;
    }

    return (
      <div 
        key={exercise.id}
        className={`mb-8 p-4 border-l-4 ${isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Question {index + 1}</h3>
          {isCompleted && (
            <span className="text-green-600 text-sm">✓ Completed</span>
          )}
        </div>
        {exerciseComponent}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      {instructions && (
        <p className="text-gray-600 mb-6">{instructions}</p>
      )}

      {/* Audio Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Audio</h2>
        <div className="mb-4">
          <LessonAudioPlayer
            audioUrl={audioUrl}
            sectionId={sectionId}
            userId={userId}
            maxPlays={maxAudioPlays}
            onPlayCountUpdate={handleAudioPlayCountUpdate}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Listen carefully and answer the questions below</span>
          <span>Plays: {audioPlayCount}/{maxAudioPlays}</span>
        </div>
        
        {/* Transcript */}
        {transcript && (audioPlayCount >= showTranscriptAfter || allCompleted) && (
          <>{!transcriptUnlocked && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              📄 Transcript is now available
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={() => {
                setShowTranscript(!showTranscript);
                setTranscriptUnlocked(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </button>
            
            {showTranscript && (
              <div className="mt-3 p-4 bg-gray-50 border-l-4 border-blue-500">
                <h4 className="font-medium text-gray-800 mb-2">Transcript</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Progress: {completedExercises.size} of {exercises.length} completed
          </span>
          <div className="flex gap-1">
            {exercises.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  completedExercises.has(exercises[index].id)
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
            style={{ width: `${(completedExercises.size / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Questions</h2>
        {exercises.map((exercise, index) => renderExercise(exercise, index))}
      </div>

      {/* Completion Summary */}
      {allCompleted && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Task Completed!</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {exerciseResults.reduce((sum, r) => sum + r.pointsEarned, 0)}
              </div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {exerciseResults.filter(r => r.isCorrect).length}/{exercises.length}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(exerciseResults.reduce((sum, r) => sum + r.timeTaken, 0) / 60)}m
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