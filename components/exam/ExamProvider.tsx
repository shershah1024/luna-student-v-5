'use client';

import React, { useEffect } from 'react';
import { useExamStore } from '@/lib/stores/examStore';

interface ExamProviderProps {
  children: React.ReactNode;
  examId: string;
}

export default function ExamProvider({ children, examId }: ExamProviderProps) {
  const initializeExam = useExamStore((state) => state.initializeExam);
  const clearSession = useExamStore((state) => state.clearSession);

  useEffect(() => {
    // Initialize exam when component mounts
    // For demo purposes, use a demo user ID
    const userId = 'demo_user_' + Math.random().toString(36).substring(7);
    initializeExam(examId, userId);

    // Cleanup when component unmounts
    return () => {
      clearSession();
    };
  }, [examId, initializeExam, clearSession]);

  return <>{children}</>;
}