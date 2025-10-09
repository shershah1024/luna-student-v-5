import React from 'react';
import { CheckCircle, Target } from 'lucide-react';

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
  showStats?: boolean;
}

export default function ProgressBar({ 
  completed, 
  total, 
  className = '',
  showStats = true 
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {showStats && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="h-4 w-4" />
            <span>{completed} of {total} completed</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Target className="h-4 w-4" />
            <span>{percentage}%</span>
          </div>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            percentage === 100 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : percentage >= 75
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : percentage >= 50
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
              : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {percentage === 100 && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          <span>Course completed! 🎉</span>
        </div>
      )}
    </div>
  );
}