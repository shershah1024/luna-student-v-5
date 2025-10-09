'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseLayoutProps {
  children: React.ReactNode;
  taskId?: string;
}

/**
 * Shared layout component for all exercise types
 * Provides consistent animation and structure across different exercise routes
 */
export default function ExerciseLayout({ children, taskId }: ExerciseLayoutProps) {
  return (
    <div className="h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={taskId || 'exercise'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1] // Custom easing for smooth feel
          }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}