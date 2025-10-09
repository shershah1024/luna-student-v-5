'use client';

import { motion } from 'framer-motion';

interface WordProgressIndicatorProps {
  word: string;
  previousStatus: number;
  newStatus: number;
  continueConversation?: string;
}

const LEARNING_STATUS = {
  NOT_STARTED: 0,
  INTRODUCED: 1,
  PARTIALLY_LEARNED: 2,
  SECOND_CHANCE: 3,
  REVIEWING: 4,
  MASTERED: 5
} as const;

const STATUS_LABELS = {
  [LEARNING_STATUS.NOT_STARTED]: 'Not Started',
  [LEARNING_STATUS.INTRODUCED]: 'Just Learned',
  [LEARNING_STATUS.PARTIALLY_LEARNED]: 'Practicing',
  [LEARNING_STATUS.SECOND_CHANCE]: 'Getting Better',
  [LEARNING_STATUS.REVIEWING]: 'Almost There',
  [LEARNING_STATUS.MASTERED]: 'Mastered'
};

const getStatusColor = (status: number) => {
  switch (status) {
    case LEARNING_STATUS.NOT_STARTED: 
      return '#d1d5db'; // gray-300
    case LEARNING_STATUS.INTRODUCED: 
      return '#3b82f6'; // blue-500
    case LEARNING_STATUS.PARTIALLY_LEARNED: 
      return '#eab308'; // yellow-500
    case LEARNING_STATUS.SECOND_CHANCE: 
      return '#f97316'; // orange-500
    case LEARNING_STATUS.REVIEWING: 
      return '#a855f7'; // purple-500
    case LEARNING_STATUS.MASTERED: 
      return '#22c55e'; // green-500
    default: 
      return '#d1d5db'; // gray-300
  }
};

export default function WordProgressIndicator({ 
  word, 
  previousStatus, 
  newStatus, 
  continueConversation
}: WordProgressIndicatorProps) {
  const progressPercentage = (newStatus / LEARNING_STATUS.MASTERED) * 100;
  
  return (
    <div className="space-y-2">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200"
      >
        {/* Word */}
        <div className="text-sm font-medium text-gray-700 min-w-[60px]">
          {word}
        </div>
        
        {/* Progress Bar */}
        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: `${(previousStatus / LEARNING_STATUS.MASTERED) * 100}%` }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full"
            style={{ backgroundColor: getStatusColor(newStatus) }}
          />
        </div>
        
        {/* Encouraging Status Label */}
        <div className="text-xs font-medium" style={{ color: getStatusColor(newStatus) }}>
          {STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}
        </div>
      </motion.div>
      
      {/* Continue Conversation Message */}
      {continueConversation && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700"
        >
          {continueConversation}
        </motion.div>
      )}
    </div>
  );
}