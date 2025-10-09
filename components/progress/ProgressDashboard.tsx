import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Target, Trophy, TrendingUp, CheckCircle } from 'lucide-react';
import CircularProgress from './CircularProgress';

interface ProgressData {
  totalTasks: number;
  completedCount: number;
  completedTasks: string[];
  progressPercentage: number;
}

interface ProgressDashboardProps {
  progress: ProgressData | null;
  courseId: string;
  loading?: boolean;
}

export default function ProgressDashboard({ 
  progress, 
  courseId,
  loading = false 
}: ProgressDashboardProps) {
  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  const { totalTasks, completedCount, progressPercentage } = progress;
  
  const getProgressLevel = (percentage: number) => {
    if (percentage === 100) return { label: 'Master', color: 'bg-green-500', icon: Trophy };
    if (percentage >= 75) return { label: 'Advanced', color: 'bg-blue-500', icon: Target };
    if (percentage >= 50) return { label: 'Intermediate', color: 'bg-yellow-500', icon: TrendingUp };
    if (percentage >= 25) return { label: 'Beginner', color: 'bg-orange-500', icon: BookOpen };
    return { label: 'Getting Started', color: 'bg-red-500', icon: Clock };
  };

  const level = getProgressLevel(progressPercentage);
  const LevelIcon = level.icon;

  return (
    <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {/* Circular Progress */}
        <CircularProgress 
          completed={completedCount} 
          total={totalTasks}
          size={140}
          strokeWidth={10}
        />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalTasks - completedCount}</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{progressPercentage}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        {/* Motivational Message */}
        {progressPercentage > 0 && (
          <div className="pt-2 border-t border-gray-100 w-full">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-center">
                {progressPercentage === 100 
                  ? `Congratulations! You've completed all ${totalTasks} exercises!`
                  : progressPercentage >= 50
                  ? `Great progress! You're more than halfway through.`
                  : `Good start! Keep going to build momentum.`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}