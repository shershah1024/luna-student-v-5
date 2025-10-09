import React from 'react';
import { Trophy, Target, TrendingUp, BookOpen, Clock } from 'lucide-react';

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showCenter?: boolean;
  theme?: 'default' | 'white';
}

export default function CircularProgress({ 
  completed, 
  total, 
  size = 120,
  strokeWidth = 8,
  className = '',
  showCenter = true,
  theme = 'default'
}: CircularProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getProgressLevel = (percentage: number) => {
    if (theme === 'white') {
      if (percentage === 100) return { label: 'Master', color: '#ffffff', bgColor: '#ffffff20', icon: Trophy };
      if (percentage >= 75) return { label: 'Advanced', color: '#ffffff', bgColor: '#ffffff20', icon: Target };
      if (percentage >= 50) return { label: 'Intermediate', color: '#ffffff', bgColor: '#ffffff20', icon: TrendingUp };
      if (percentage >= 25) return { label: 'Beginner', color: '#ffffff', bgColor: '#ffffff20', icon: BookOpen };
      return null;
    } else {
      if (percentage === 100) return { label: 'Master', color: '#10b981', bgColor: '#dcfce7', icon: Trophy };
      if (percentage >= 75) return { label: 'Advanced', color: '#3b82f6', bgColor: '#dbeafe', icon: Target };
      if (percentage >= 50) return { label: 'Intermediate', color: '#f59e0b', bgColor: '#fef3c7', icon: TrendingUp };
      if (percentage >= 25) return { label: 'Beginner', color: '#f97316', bgColor: '#fed7aa', icon: BookOpen };
      return null;
    }
  };

  const level = getProgressLevel(percentage);
  const LevelIcon = level?.icon;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme === 'white' ? '#ffffff40' : '#e5e7eb'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={level?.color || (theme === 'white' ? '#ffffff' : '#ef4444')}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center content */}
        {showCenter && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {level && LevelIcon && (
              <div 
                className="rounded-full p-2 mb-1"
                style={{ backgroundColor: level.bgColor }}
              >
                <LevelIcon 
                  className="w-6 h-6" 
                  style={{ color: level.color }}
                />
              </div>
            )}
            <div className={`text-2xl font-bold ${theme === 'white' ? 'text-white' : 'text-gray-900'} ${!level ? 'mt-3' : ''}`}>
              {percentage}%
            </div>
            <div className={`text-xs text-center ${theme === 'white' ? 'text-white/80' : 'text-gray-500'}`}>
              {completed}/{total}
            </div>
          </div>
        )}
      </div>
      
      {/* Level label */}
      {level && (
        <div className="mt-3 text-center">
          <div 
            className="text-sm font-medium px-3 py-1 rounded-full"
            style={{ 
              color: level.color,
              backgroundColor: level.bgColor
            }}
          >
            {level.label}
          </div>
        </div>
      )}
    </div>
  );
}