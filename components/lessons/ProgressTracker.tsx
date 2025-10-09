'use client';

import { Clock, Target, TrendingUp, Award } from 'lucide-react';

interface ProgressTrackerProps {
  totalSections: number;
  completedSections: number;
  overallProgress: number;
  timeSpent: number; // in seconds
}

export default function ProgressTracker({
  totalSections,
  completedSections,
  overallProgress,
  timeSpent,
}: ProgressTrackerProps) {
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-red-500';
    if (progress >= 50) return 'bg-red-400';
    if (progress >= 25) return 'bg-red-300';
    return 'bg-gray-300';
  };

  const getProgressText = (progress: number): string => {
    if (progress >= 100) return 'Completed!';
    if (progress >= 75) return 'Almost there!';
    if (progress >= 50) return 'Halfway done!';
    if (progress >= 25) return 'Good progress!';
    return 'Just started';
  };

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">Your Progress</h3>
        </div>
        
        {/* Main Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/90 font-medium">Overall Progress</span>
            <span className="text-lg font-bold text-white">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-white/80 text-center font-medium">
            {getProgressText(overallProgress)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 bg-white space-y-5">
        {/* Sections Progress */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-semibold">Sections</span>
                <span className="text-sm font-bold text-gray-900">
                  {completedSections} / {totalSections}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalSections > 0 ? (completedSections / totalSections) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Time Spent */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-gray-700 font-semibold">Time Spent</span>
              <div className="text-lg font-bold text-gray-900">
                {formatTime(timeSpent)}
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badge */}
        {overallProgress >= 100 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold">
                  Lesson Complete! 🎉
                </div>
                <div className="text-xs text-green-100">
                  Great job finishing this lesson
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Indicators */}
        {overallProgress < 100 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Milestones</div>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((milestone) => (
                <div key={milestone} className="text-center">
                  <div
                    className={`h-3 rounded-full mb-1 ${
                      overallProgress >= milestone
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : overallProgress >= milestone - 10
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                        : 'bg-gray-200'
                    }`}
                    title={`${milestone}% milestone`}
                  />
                  <span className="text-xs text-gray-500 font-medium">{milestone}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Encouragement Message */}
      {overallProgress > 0 && overallProgress < 100 && (
        <div className="p-4 bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <p className="text-sm text-center font-medium">
            {overallProgress < 25 && "You're off to a great start! Keep going! 🚀"}
            {overallProgress >= 25 && overallProgress < 50 && "You're making excellent progress! 📚"}
            {overallProgress >= 50 && overallProgress < 75 && "More than halfway there! You've got this! 💪"}
            {overallProgress >= 75 && "Almost finished! You're doing amazing! ⭐"}
          </p>
        </div>
      )}
    </div>
  );
}