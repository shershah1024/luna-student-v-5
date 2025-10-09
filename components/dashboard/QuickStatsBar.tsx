'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Clock, 
  Target, 
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';

interface Achievement {
  type: string;
  key: string;
  name: string;
  description: string;
  value?: number;
  earned_at: string;
}

interface QuickStatsBarProps {
  weeklyTimeSpent: number; // in minutes
  completedLessons: number;
  totalLessons: number;
  currentStreak: number;
  longestStreak: number;
  totalAchievements: number;
  streakActiveToday: boolean;
  recentAchievements: Achievement[];
}

const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ 
  weeklyTimeSpent,
  completedLessons,
  totalLessons,
  currentStreak,
  longestStreak,
  totalAchievements,
  streakActiveToday,
  recentAchievements
}) => {
  const stats = [
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`,
      color: streakActiveToday ? 'text-orange-600' : 'text-gray-600',
      bgColor: streakActiveToday ? 'bg-orange-50' : 'bg-gray-50',
      show: true
    },
    {
      icon: Clock,
      label: 'This Week',
      value: weeklyTimeSpent >= 60 ? `${Math.floor(weeklyTimeSpent / 60)}h ${weeklyTimeSpent % 60}m` : `${weeklyTimeSpent}m`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      show: true
    },
    {
      icon: Target,
      label: 'Best Streak',
      value: `${longestStreak} day${longestStreak !== 1 ? 's' : ''}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      show: longestStreak > 0
    },
    {
      icon: Award,
      label: 'Achievements',
      value: `${totalAchievements}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      show: true
    }
  ];

  const visibleStats = stats.filter(stat => stat.show);

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak': return Flame;
      case 'lessons': return Target;
      case 'activity': return Award;
      default: return Award;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'streak': return 'text-orange-600 bg-orange-50';
      case 'lessons': return 'text-blue-600 bg-blue-50';
      case 'activity': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-lg transition-all duration-300 border border-orange-100/50 h-full">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-xl" />
      
      <div className="relative z-10">
        {/* Current Streak Highlight */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {currentStreak}
            </div>
            <div className="text-xs text-gray-600">day streak</div>
          </div>
        </div>
        
        {/* Other Stats */}
        <div className="space-y-2 mb-3">
          {visibleStats.filter(stat => stat.icon !== Flame).map((stat, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${stat.bgColor} shadow-sm`}>
                {React.createElement(stat.icon, {
                  className: `h-3 w-3 ${stat.color}`
                })}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-sm font-semibold ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="pt-3 border-t border-orange-200/50">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Recent</div>
              {recentAchievements.slice(0, 2).map((achievement, index) => {
                const IconComponent = getAchievementIcon(achievement.type);
                const colorClasses = getAchievementColor(achievement.type);
                
                return (
                  <div key={index} className={`flex items-center gap-2 p-2 rounded-xl border ${colorClasses} bg-white/50 backdrop-blur-sm`}>
                    <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <IconComponent className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{achievement.name}</div>
                      <div className="text-xs text-gray-500">{formatDate(achievement.earned_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Lessons progress indicator - modern */}
        {completedLessons > 0 && (
          <div className="mt-3 pt-3 border-t border-orange-200/50">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span className="font-medium">Lessons Progress</span>
              <span className="font-bold text-orange-600">{completedLessons}/{totalLessons}</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStatsBar;