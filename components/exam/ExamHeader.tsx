'use client';

import React from 'react';
import { useExamStore } from '@/lib/stores/examStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Users, BarChart3, Pause, Play } from 'lucide-react';

export default function ExamHeader() {
  const { 
    currentExam, 
    currentSession, 
    currentTest, 
    currentSkill,
    getOverallProgress,
    getTestProgress,
    pauseTest,
    resumeTest 
  } = useExamStore();

  if (!currentExam || !currentSession) {
    return null;
  }

  const overallProgress = getOverallProgress();
  const testProgress = currentTest ? getTestProgress() : 0;
  const isPaused = currentSession.status === 'paused';

  const handlePauseResume = () => {
    if (isPaused) {
      resumeTest();
    } else {
      pauseTest();
    }
  };

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Exam Info */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentExam.title}
              </h1>
              <p className="text-sm text-gray-600">
                {currentExam.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                {currentExam.difficulty_level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {currentExam.estimated_duration_minutes}min
              </Badge>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-4">
            {currentTest && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {currentTest.title}
                </div>
                <div className="text-xs text-gray-500">
                  {currentSkill?.toUpperCase()} • {testProgress}% complete
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {overallProgress}% Overall
              </span>
            </div>

            {/* Pause/Resume */}
            {currentTest && (
              <Button
                onClick={handlePauseResume}
                variant={isPaused ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}