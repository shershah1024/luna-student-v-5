// Export all lesson exercise components
export { default as LessonMultipleChoice } from './LessonMultipleChoice';
export { default as LessonFillInBlanks } from './LessonFillInBlanks';
export { default as LessonMatchingExercise } from './LessonMatchingExercise';
export { default as TrueFalseQuestion } from './TrueFalseQuestion';
export { default as OrderingExercise } from './OrderingExercise';
export { default as LessonReadingTask } from './LessonReadingTask';
export { default as LessonListeningTask } from './LessonListeningTask';
export { default as LessonListeningTaskA1A2 } from './LessonListeningTaskA1A2';
export { default as LessonListeningTaskClean } from './LessonListeningTaskClean';
export { default as LessonListeningTaskSimple } from './LessonListeningTaskSimple';
export { default as LessonAudioPlayer } from './LessonAudioPlayer';
export { default as AudioDictationExercise } from './AudioDictationExercise';

// Export types
export type ExerciseType = 'multiple_choice' | 'fill_in_blank' | 'matching' | 'true_false' | 'ordering' | 'dictation';

export interface ExerciseResult {
  exerciseId: string;
  isCorrect: boolean;
  timeTaken: number;
  pointsEarned: number;
  details?: any;
}

export interface LessonExerciseProps {
  exerciseId: string;
  sectionId: string;
  lessonId: string;
  userId: string;
  points?: number;
  timeLimit?: number;
  explanation?: string;
  onComplete?: (result: ExerciseResult) => void;
}