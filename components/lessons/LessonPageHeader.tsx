'use client';

import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import CircularProgress from '@/components/progress/CircularProgress';

interface ProgressData {
  totalTasks: number;
  completedCount: number;
  completedTasks: string[];
  progressPercentage: number;
}

interface LessonPageHeaderProps {
  title: string;
  subtitle?: string;
  courseId: string;
  level?: string;
  icon: ReactNode;
  badgeText?: string;
  badges?: Array<{
    icon?: ReactNode;
    text: string;
  }>;
  decorativeNumber?: string | number;
  progress?: ProgressData | null;
}

const courseColorSchemes = {
  'goethe-a1': {
    gradient: 'from-blue-600 via-blue-700 to-blue-800',
    badgeColor: 'bg-blue-800',
    accentColor: 'bg-yellow-400',
  },
  'goethe-a2': {
    gradient: 'from-green-600 via-green-700 to-green-800',
    badgeColor: 'bg-green-800',
    accentColor: 'bg-yellow-400',
  },
  'goethe-b1': {
    gradient: 'from-purple-600 via-purple-700 to-purple-800',
    badgeColor: 'bg-purple-800',
    accentColor: 'bg-yellow-400',
  },
  'goethe-b2': {
    gradient: 'from-indigo-600 via-indigo-700 to-indigo-800',
    badgeColor: 'bg-indigo-800',
    accentColor: 'bg-yellow-400',
  },
  'goethe-c1': {
    gradient: 'from-pink-600 via-pink-700 to-pink-800',
    badgeColor: 'bg-pink-800',
    accentColor: 'bg-yellow-400',
  },
  'telc-a1': {
    gradient: 'from-orange-600 via-orange-700 to-orange-800',
    badgeColor: 'bg-orange-800',
    accentColor: 'bg-yellow-400',
  },
  'telc-a2': {
    gradient: 'from-teal-600 via-teal-700 to-teal-800',
    badgeColor: 'bg-teal-800',
    accentColor: 'bg-yellow-400',
  },
  'telc-b1': {
    gradient: 'from-cyan-600 via-cyan-700 to-cyan-800',
    badgeColor: 'bg-cyan-800',
    accentColor: 'bg-yellow-400',
  },
  'telc-b2': {
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-800',
    badgeColor: 'bg-emerald-800',
    accentColor: 'bg-yellow-400',
  },
  default: {
    gradient: 'from-red-600 via-red-700 to-red-800',
    badgeColor: 'bg-red-800',
    accentColor: 'bg-yellow-400',
  },
};

export default function LessonPageHeader({
  title,
  subtitle,
  courseId,
  level,
  icon,
  badgeText,
  badges = [],
  decorativeNumber,
  progress,
}: LessonPageHeaderProps) {
  const colorScheme = courseColorSchemes[courseId as keyof typeof courseColorSchemes] || courseColorSchemes.default;

  return (
    <div className="flex items-center gap-6 mb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        {title}
      </h1>
      
      <div className="ml-auto">
        {progress ? (
          <CircularProgress 
            completed={progress.completedCount} 
            total={progress.totalTasks}
            size={90}
            strokeWidth={6}
            showCenter={true}
            theme="default"
          />
        ) : (
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}