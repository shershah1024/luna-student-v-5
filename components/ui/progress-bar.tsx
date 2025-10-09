'use client';

import React from 'react';

interface ProgressBarProps {
  totalMilestones: number;
  completedMilestones: number[];
  className?: string;
}

export function ProgressBar({ totalMilestones, completedMilestones = [], className = '' }: ProgressBarProps) {
  // Define a color palette for the progress segments
  const segmentColors = [
    'bg-blue-500',    // Blue
    'bg-green-500',   // Green
    'bg-yellow-500',  // Yellow
    'bg-purple-500',  // Purple
    'bg-pink-500',    // Pink
    'bg-indigo-500',  // Indigo
    'bg-red-500',     // Red
    'bg-teal-500',    // Teal
    'bg-orange-500',  // Orange
    'bg-cyan-500',    // Cyan
  ];

  // Generate segments for the progress bar
  const segments = Array.from({ length: totalMilestones }, (_, i) => {
    const isCompleted = completedMilestones.includes(i + 1);
    const colorIndex = i % segmentColors.length;
    const bgColor = isCompleted ? segmentColors[colorIndex] : 'bg-gray-200';
    
    return {
      id: i + 1,
      isCompleted,
      color: bgColor,
      label: `Milestone ${i + 1}`,
    };
  });

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          Progress: {completedMilestones.length} of {totalMilestones} milestones
        </span>
        <span className="text-sm font-medium text-gray-500">
          {Math.round((completedMilestones.length / totalMilestones) * 100)}%
        </span>
      </div>
      
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
        {segments.map((segment, index) => (
          <div 
            key={segment.id}
            className={`h-full transition-all duration-500 ${segment.color} ${index !== segments.length - 1 ? 'border-r-2 border-white' : ''}`}
            style={{ width: `${100 / totalMilestones}%` }}
            title={`${segment.label} ${segment.isCompleted ? '✓' : '✗'}`}
          />
        ))}
      </div>
      
      <div className="flex justify-between mt-1">
        {segments.map((segment) => (
          <span 
            key={`label-${segment.id}`} 
            className={`text-xs ${segment.isCompleted ? 'font-semibold text-gray-800' : 'text-gray-500'}`}
          >
            {segment.id}
          </span>
        ))}
      </div>
    </div>
  );
}
