'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Target, 
  Star, 
  Award,
  Clock,
  Zap
} from 'lucide-react';

interface Achievement {
  type: string;
  key: string;
  name: string;
  description: string;
  value?: number;
  earned_at: string;
}

interface AchievementsSectionProps {
  totalAchievements: number;
  recentAchievements: Achievement[];
  currentStreak: number;
  longestStreak: number;
}

const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  totalAchievements,
  recentAchievements,
  currentStreak,
  longestStreak
}) => {
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return Flame;
      case 'lessons':
        return BookOpen;
      case 'vocabulary':
        return Target;
      case 'test_score':
        return Star;
      case 'time_spent':
        return Clock;
      case 'activity':
        return Zap;
      default:
        return Award;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'streak':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'lessons':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'vocabulary':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'test_score':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'time_spent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'activity':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-md h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-4 w-4 text-yellow-600" />
          Achievements
          <Badge variant="secondary" className="ml-auto text-xs">
            {totalAchievements}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Streak Summary - compact */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {currentStreak} Day Streak
                </div>
                <div className="text-xs text-gray-600">
                  Best: {longestStreak} days
                </div>
              </div>
            </div>
            <Badge 
              variant={currentStreak > 0 ? "default" : "secondary"}
              className={`text-xs ${currentStreak > 0 ? "bg-orange-600" : ""}`}
            >
              {currentStreak > 0 ? "Active" : "Start!"}
            </Badge>
          </div>

          {/* Recent Achievements - compact */}
          {recentAchievements.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-xs uppercase tracking-wide">Recent</h3>
              <div className="space-y-2">
                {recentAchievements.slice(0, 3).map((achievement, index) => {
                  const IconComponent = getAchievementIcon(achievement.type);
                  const colorClasses = getAchievementColor(achievement.type);
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg border ${colorClasses}`}
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full">
                        <IconComponent className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">
                          {achievement.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {formatDate(achievement.earned_at)}
                        </div>
                      </div>
                      {achievement.value && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {achievement.value}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No achievements yet - compact */}
          {totalAchievements === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <div className="text-sm font-medium">No achievements yet</div>
              <div className="text-xs">Complete lessons to earn achievements!</div>
            </div>
          )}

          {/* Achievement milestones preview - compact */}
          {totalAchievements > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 text-center">
                Keep learning to unlock more! 🎯
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsSection;

//trying a build