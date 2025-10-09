import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types for exam management
export interface ExamState {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  total_sections: number;
  estimated_duration_minutes: number;
  skills: ('reading' | 'listening' | 'writing' | 'speaking')[];
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface TestSection {
  id: string;
  test_id: string;
  skill: 'reading' | 'listening' | 'writing' | 'speaking';
  section_number: number;
  title: string;
  instructions: string;
  category_id: string;
  template_id: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  total_questions: number;
  max_score: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  completed_at?: string;
}

export interface UserResponse {
  question_id: string;
  response_text: string;
  response_data?: Record<string, any>;
  time_spent: number;
  is_correct?: boolean;
  score?: number;
}

export interface ExamSession {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  current_skill?: 'reading' | 'listening' | 'writing' | 'speaking';
  current_test_id?: string;
  overall_score?: number;
  status: 'active' | 'completed' | 'paused';
  responses: Record<string, UserResponse>;
  time_tracking: {
    total_time: number;
    skill_times: Record<string, number>;
    test_times: Record<string, number>;
  };
}

interface ExamStore {
  // Current exam session
  currentExam: ExamState | null;
  currentSession: ExamSession | null;
  currentTest: TestSection | null;
  
  // Navigation state
  currentSkill: 'reading' | 'listening' | 'writing' | 'speaking' | null;
  availableTests: TestSection[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeExam: (examId: string, userId: string) => Promise<void>;
  startTest: (testId: string, skill: string) => Promise<void>;
  submitResponse: (questionId: string, responseText: string, responseData?: Record<string, any>) => void;
  completeTest: () => Promise<void>;
  pauseTest: () => void;
  resumeTest: () => void;
  completeExam: () => Promise<void>;
  
  // Navigation
  navigateToSkill: (skill: 'reading' | 'listening' | 'writing' | 'speaking') => void;
  navigateToTest: (testId: string) => void;
  
  // Utility
  getTestProgress: () => number;
  getSkillProgress: (skill: string) => number;
  getOverallProgress: () => number;
  clearSession: () => void;
  
  // Time tracking
  startTimer: () => void;
  stopTimer: () => void;
  updateTimeSpent: (testId: string, timeSpent: number) => void;
}

export const useExamStore = create<ExamStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      currentExam: null,
      currentSession: null,
      currentTest: null,
      currentSkill: null,
      availableTests: [],
      isLoading: false,
      error: null,

      // Initialize exam session
      initializeExam: async (examId: string, userId: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Fetch exam details
          const examResponse = await fetch(`/api/exams/${examId}`);
          if (!examResponse.ok) throw new Error('Failed to fetch exam');
          const examData = await examResponse.json();

          // Fetch available tests for this exam
          const testsResponse = await fetch(`/api/exams/${examId}/tests`);
          if (!testsResponse.ok) throw new Error('Failed to fetch tests');
          const testsData = await testsResponse.json();

          // Create or resume session
          const sessionResponse = await fetch(`/api/exams/${examId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
          });
          if (!sessionResponse.ok) throw new Error('Failed to create session');
          const sessionData = await sessionResponse.json();

          set((state) => {
            state.currentExam = examData;
            state.availableTests = testsData;
            state.currentSession = {
              id: sessionData.id,
              exam_id: examId,
              user_id: userId,
              started_at: new Date().toISOString(),
              status: 'active',
              responses: {},
              time_tracking: {
                total_time: 0,
                skill_times: {},
                test_times: {}
              }
            };
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error';
            state.isLoading = false;
          });
        }
      },

      // Start a specific test
      startTest: async (testId: string, skill: string) => {
        const { availableTests } = get();
        const test = availableTests.find(t => t.test_id === testId && t.skill === skill);
        
        if (!test) {
          set((state) => {
            state.error = 'Test not found';
          });
          return;
        }

        set((state) => {
          state.currentTest = { ...test, status: 'in_progress' };
          state.currentSkill = skill as any;
          state.error = null;
          
          if (state.currentSession) {
            state.currentSession.current_skill = skill as any;
            state.currentSession.current_test_id = testId;
          }
        });
      },

      // Submit a response
      submitResponse: (questionId: string, responseText: string, responseData?: Record<string, any>) => {
        set((state) => {
          if (!state.currentSession) return;
          
          const timeSpent = Date.now() - new Date(state.currentSession.started_at).getTime();
          
          state.currentSession.responses[questionId] = {
            question_id: questionId,
            response_text: responseText,
            response_data: responseData,
            time_spent: Math.floor(timeSpent / 1000)
          };
        });
      },

      // Complete current test
      completeTest: async () => {
        const { currentSession, currentTest } = get();
        if (!currentSession || !currentTest) return;

        set((state) => {
          state.isLoading = true;
        });

        try {
          // Submit test for scoring
          const responses = Object.values(currentSession.responses).filter(
            r => r.question_id.startsWith(currentTest.test_id)
          );

          const scoreResponse = await fetch('/api/reading/score-universal-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: currentSession.user_id,
              test_id: currentTest.test_id,
              session_id: currentSession.id,
              responses: responses,
              total_time_seconds: currentSession.time_tracking.total_time
            })
          });

          if (!scoreResponse.ok) throw new Error('Failed to score test');
          const scoreData = await scoreResponse.json();

          set((state) => {
            if (state.currentTest) {
              state.currentTest.status = 'completed';
              state.currentTest.score = scoreData.score;
              state.currentTest.completed_at = new Date().toISOString();
            }
            
            // Update session with scores
            if (state.currentSession) {
              Object.keys(state.currentSession.responses).forEach(questionId => {
                const questionResult = scoreData.question_breakdown?.find(
                  (q: any) => q.question_id === questionId
                );
                if (questionResult) {
                  state.currentSession!.responses[questionId].is_correct = questionResult.correct;
                  state.currentSession!.responses[questionId].score = questionResult.score;
                }
              });
            }
            
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to complete test';
            state.isLoading = false;
          });
        }
      },

      // Pause test
      pauseTest: () => {
        set((state) => {
          if (state.currentSession) {
            state.currentSession.status = 'paused';
          }
        });
      },

      // Resume test
      resumeTest: () => {
        set((state) => {
          if (state.currentSession) {
            state.currentSession.status = 'active';
          }
        });
      },

      // Complete entire exam
      completeExam: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set((state) => {
          if (state.currentSession) {
            state.currentSession.status = 'completed';
            state.currentSession.completed_at = new Date().toISOString();
          }
        });
      },

      // Navigation
      navigateToSkill: (skill) => {
        set((state) => {
          state.currentSkill = skill;
          state.currentTest = null;
        });
      },

      navigateToTest: (testId) => {
        const { availableTests } = get();
        const test = availableTests.find(t => t.test_id === testId);
        if (test) {
          set((state) => {
            state.currentTest = test;
            state.currentSkill = test.skill;
          });
        }
      },

      // Progress calculations
      getTestProgress: () => {
        const { currentSession, currentTest } = get();
        if (!currentSession || !currentTest) return 0;
        
        const testResponses = Object.values(currentSession.responses).filter(
          r => r.question_id.startsWith(currentTest.test_id)
        );
        
        return Math.round((testResponses.length / currentTest.total_questions) * 100);
      },

      getSkillProgress: (skill: string) => {
        const { availableTests, currentSession } = get();
        if (!currentSession) return 0;
        
        const skillTests = availableTests.filter(t => t.skill === skill);
        const completedTests = skillTests.filter(t => t.status === 'completed');
        
        return Math.round((completedTests.length / skillTests.length) * 100);
      },

      getOverallProgress: () => {
        const { availableTests } = get();
        if (!availableTests.length) return 0;
        
        const completedTests = availableTests.filter(t => t.status === 'completed');
        return Math.round((completedTests.length / availableTests.length) * 100);
      },

      // Utility
      clearSession: () => {
        set((state) => {
          state.currentExam = null;
          state.currentSession = null;
          state.currentTest = null;
          state.currentSkill = null;
          state.availableTests = [];
          state.error = null;
        });
      },

      // Time tracking
      startTimer: () => {
        // Implementation for timer start
      },

      stopTimer: () => {
        // Implementation for timer stop
      },

      updateTimeSpent: (testId: string, timeSpent: number) => {
        set((state) => {
          if (state.currentSession) {
            state.currentSession.time_tracking.test_times[testId] = timeSpent;
            state.currentSession.time_tracking.total_time = Object.values(
              state.currentSession.time_tracking.test_times
            ).reduce((sum, time) => sum + time, 0);
          }
        });
      }
    }))
  )
);