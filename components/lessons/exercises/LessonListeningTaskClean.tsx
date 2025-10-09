/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import LessonAudioPlayer from './LessonAudioPlayer';
import LessonMultipleChoice from './LessonMultipleChoice';
import LessonFillInBlanks from './LessonFillInBlanks';
import LessonMatchingExercise from './LessonMatchingExercise';
import TrueFalseQuestion from './TrueFalseQuestion';
import OrderingExercise from './OrderingExercise';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Volume2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ListeningExercise {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'matching' | 'true_false' | 'ordering';
  content: any;
  points?: number;
  explanation?: string;
}

interface LessonListeningTaskCleanProps {
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

export default function LessonListeningTaskClean({
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
}: LessonListeningTaskCleanProps) {
  const [exerciseResults, setExerciseResults] = useState<any[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptUnlocked, setTranscriptUnlocked] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  const handleExerciseComplete = (exerciseId: string, result: any) => {
    // Update results
    const newResults = exerciseResults.filter(r => r.exerciseId !== exerciseId);
    newResults.push({ exerciseId, ...result });
    setExerciseResults(newResults);
    
    // Mark as completed
    const newCompleted = new Set(completedExercises);
    newCompleted.add(exerciseId);
    setCompletedExercises(newCompleted);

    // Check if all exercises are completed
    if (newCompleted.size === exercises.length) {
      completeTask(newResults);
    }
  };

  const completeTask = async (results: any[]) => {
    setAllCompleted(true);
    
    const totalScore = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    const maxScore = exercises.reduce((sum, ex) => sum + (ex.points || 1), 0);
    
    // Save section score
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
      <Card 
        key={exercise.id}
        className={`mb-6 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Question {index + 1}</span>
            {isCompleted && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exerciseComponent}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          {instructions && (
            <p className="text-gray-600 mt-2">{instructions}</p>
          )}
        </CardHeader>
      </Card>

      {/* Audio Player */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audio</CardTitle>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Listen carefully and answer the questions below
            </span>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
              Plays: {audioPlayCount}/{maxAudioPlays}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <LessonAudioPlayer
            audioUrl={audioUrl}
            sectionId={sectionId}
            userId={userId}
            maxPlays={maxAudioPlays}
            onPlayCountUpdate={handleAudioPlayCountUpdate}
          />
          
          {/* Transcript */}
          {transcript && (audioPlayCount >= showTranscriptAfter || allCompleted) && (
            <>{!transcriptUnlocked && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-3">
                📄 Transcript is now available - click "Show Transcript" to view it
              </div>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTranscript(!showTranscript);
                  setTranscriptUnlocked(true);
                }}
                className="mb-3"
              >
                <div className="mr-2">
                  {showTranscript ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
                {showTranscript ? 'Hide' : 'Show'} Transcript
              </Button>
              
              {showTranscript && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-2">Transcript</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{transcript}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Progress: {completedExercises.size} of {exercises.length} questions completed
            </span>
            <div className="flex gap-2">
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
        </CardContent>
      </Card>

      {/* All Questions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Questions</h3>
        {exercises.map((exercise, index) => renderExercise(exercise, index))}
      </div>

      {/* Completion Summary */}
      {allCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Listening Task Completed!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {exerciseResults.reduce((sum, r) => sum + r.pointsEarned, 0)}
                </div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {exerciseResults.filter(r => r.isCorrect).length}/{exercises.length}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(exerciseResults.reduce((sum, r) => sum + r.timeTaken, 0) / 60)}m
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
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