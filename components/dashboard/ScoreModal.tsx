'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: any;
  prepScore: number;
  calculateQuadrantScore: (data: any, period: 'today' | 'week' | 'month') => number;
  getEncouragingMessage: (score: number) => string;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ 
  isOpen, 
  onClose, 
  progressData, 
  prepScore,
  calculateQuadrantScore,
  getEncouragingMessage
}) => {
  if (!isOpen) return null;

  const getScoreBreakdown = (period: 'today' | 'week' | 'month') => {
    if (!progressData) return { lessons: 0, tests: 0, words: 0, total: 0 };
    
    let lessons = 0, tests = 0, words = 0;
    let maxLessons = 0, maxTests = 0, maxWords = 0;
    
    switch (period) {
      case 'today':
        lessons = progressData.completedLessonsToday || 0;
        tests = progressData.completedTestsToday || 0;
        words = progressData.learnedVocabularyToday || 0;
        maxLessons = 2;
        maxTests = 1;
        maxWords = 10;
        break;
      case 'week':
        lessons = progressData.completedLessons || 0;
        tests = progressData.completedTests || 0;
        words = progressData.learnedVocabulary || 0;
        maxLessons = 10;
        maxTests = 3;
        maxWords = 50;
        break;
      case 'month':
        lessons = progressData.completedLessonsMonth || 0;
        tests = progressData.completedTestsMonth || 0;
        words = progressData.learnedVocabularyMonth || 0;
        maxLessons = 30;
        maxTests = 10;
        maxWords = 200;
        break;
    }
    
    const lessonScore = Math.min((lessons / maxLessons) * 100, 100) * 0.4;
    const testScore = Math.min((tests / maxTests) * 100, 100) * 0.3;
    const wordScore = Math.min((words / maxWords) * 100, 100) * 0.3;
    
    return {
      lessons: { completed: lessons, max: maxLessons, score: Math.round(lessonScore) },
      tests: { completed: tests, max: maxTests, score: Math.round(testScore) },
      words: { completed: words, max: maxWords, score: Math.round(wordScore) },
      total: Math.round(lessonScore + testScore + wordScore)
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Activity Score Breakdown</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Today</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {calculateQuadrantScore(progressData, 'today')}
              </div>
              <p className="text-sm text-indigo-600 mb-4">
                {getEncouragingMessage(calculateQuadrantScore(progressData, 'today'))}
              </p>
              <div className="space-y-3">
                {(() => {
                  const breakdown = getScoreBreakdown('today');
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lessons ({breakdown.lessons.completed}/{breakdown.lessons.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.lessons.score} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tests ({breakdown.tests.completed}/{breakdown.tests.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.tests.score} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Words ({breakdown.words.completed}/{breakdown.words.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.words.score} pts</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs text-gray-500">40% lessons + 30% tests + 30% words</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Week Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {calculateQuadrantScore(progressData, 'week')}
              </div>
              <p className="text-sm text-indigo-600 mb-4">
                {getEncouragingMessage(calculateQuadrantScore(progressData, 'week'))}
              </p>
              <div className="space-y-3">
                {(() => {
                  const breakdown = getScoreBreakdown('week');
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lessons ({breakdown.lessons.completed}/{breakdown.lessons.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.lessons.score} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tests ({breakdown.tests.completed}/{breakdown.tests.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.tests.score} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Words ({breakdown.words.completed}/{breakdown.words.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.words.score} pts</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs text-gray-500">40% lessons + 30% tests + 30% words</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Month Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">This Month</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {calculateQuadrantScore(progressData, 'month')}
              </div>
              <p className="text-sm text-indigo-600 mb-4">
                {getEncouragingMessage(calculateQuadrantScore(progressData, 'month'))}
              </p>
              <div className="space-y-3">
                {(() => {
                  const breakdown = getScoreBreakdown('month');
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lessons ({breakdown.lessons.completed}/{breakdown.lessons.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.lessons.score} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tests ({breakdown.tests.completed}/{breakdown.tests.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.tests.score} pts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Words ({breakdown.words.completed}/{breakdown.words.max})</span>
                        <span className="text-sm font-medium text-gray-800">{breakdown.words.score} pts</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs text-gray-500">40% lessons + 30% tests + 30% words</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* All Time Score (Prep Score) */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Time (Prep Score)</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {prepScore}
              </div>
              <p className="text-sm text-indigo-600 mb-4">
                {getEncouragingMessage(prepScore)}
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  This comprehensive score considers:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Learning Progress (lessons & chapters)</li>
                  <li>• Language Skills (reading, listening, speaking, writing)</li>
                  <li>• Practice & Tests (attempts & improvements)</li>
                  <li>• Active Learning (vocabulary & pronunciation)</li>
                  <li>• Consistency (streaks & active days)</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  Speaking and listening are triple-weighted for better exam preparation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How Scores Are Calculated</h4>
            <p className="text-sm text-blue-800 mb-2">
              Each time period has target goals. Your score reflects your progress towards these goals:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• <strong>Daily:</strong> 2 lessons, 1 test, 10 words</li>
              <li>• <strong>Weekly:</strong> 10 lessons, 3 tests, 50 words</li>
              <li>• <strong>Monthly:</strong> 30 lessons, 10 tests, 200 words</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreModal;