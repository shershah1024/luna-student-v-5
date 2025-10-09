import { z } from 'zod';

/**
 * Zod schemas for CEFR-aligned reading test generation
 * Based on the comprehensive reading test generation guide
 */

// CEFR Level validation
export const cefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// Text type validation
export const textTypeSchema = z.enum([
  'article', 'news', 'story', 'essay', 'report', 'tutorial', 'email',
  'advertisement', 'blog', 'dialogue', 'form', 'instruction'
]);

// Question type validation
export const questionTypeSchema = z.enum([
  'multiple_choice', 'true_false', 'short_answer', 'fill_in_blanks',
  'matching', 'checkbox', 'sequence', 'vocabulary', 'open_ended'
]);

// Reading Instructions Schema
export const readingInstructionsSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  text_type: textTypeSchema,
  cefr_level: cefrLevelSchema,
  language: z.string().optional(),
  word_count: z.number().min(50).max(2000).optional(),
  custom_instructions: z.string().optional(),
  target_audience: z.string().optional(),
  key_concepts: z.array(z.string()).optional()
});

// Question Instructions Schema
export const questionInstructionsSchema = z.object({
  total_points: z.number().min(1).max(100),
  question_types: z.array(questionTypeSchema).optional(),
  additional_instructions: z.string().optional()
});

// Multiple Choice Option Schema
export const multipleChoiceOptionSchema = z.object({
  option: z.string(),
  is_correct: z.boolean()
});

// Question Schemas
export const multipleChoiceQuestionSchema = z.object({
  question: z.string(),
  options: z.array(multipleChoiceOptionSchema).min(2).max(6),
  explanation: z.string(),
  points: z.number().min(1),
  type: z.literal('multiple_choice')
});

export const trueFalseQuestionSchema = z.object({
  question: z.string(),
  correct_answer: z.enum(['true', 'false', 'richtig', 'falsch']),
  explanation: z.string(),
  points: z.number().min(1),
  type: z.literal('true_false')
});

export const shortAnswerQuestionSchema = z.object({
  question: z.string(),
  correct_answer: z.string(),
  alternative_answers: z.array(z.string()).optional(),
  explanation: z.string(),
  points: z.number().min(1),
  type: z.literal('short_answer')
});

export const fillInBlankQuestionSchema = z.object({
  question: z.string(),
  text_with_blanks: z.string(),
  correct_answers: z.array(z.string()),
  options: z.array(z.string()).optional(), // For dropdown blanks
  explanation: z.string(),
  points: z.number().min(1),
  type: z.literal('fill_in_blanks')
});

export const matchingQuestionSchema = z.object({
  question: z.string(),
  left_items: z.array(z.string()),
  right_items: z.array(z.string()),
  correct_matches: z.array(z.object({
    left: z.string(),
    right: z.string()
  })),
  explanation: z.string(),
  points: z.number().min(1),
  type: z.literal('matching')
});

// Union type for all questions
export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  shortAnswerQuestionSchema,
  fillInBlankQuestionSchema,
  matchingQuestionSchema
]);

// Reading Text Schema (based on guide format)
export const readingTextSchema = z.object({
  title: z.string(),
  content: z.string().min(50, "Content must be at least 50 characters"),
  key_vocabulary: z.array(z.string()),
  main_concepts: z.array(z.string()),
  // Accept a broader range to tolerate model variability (some models emit 0-5 or 0-10).
  // Downstream consumers can normalize if needed.
  difficulty_score: z.number().min(0).max(10),
  reading_level: cefrLevelSchema,
  summary: z.string(),
  learning_objectives: z.array(z.string())
});

// Test Plan Schema
export const testPlanSchema = z.object({
  total_points: z.number().min(1),
  questions: z.array(z.object({
    question_number: z.number(),
    question_type: questionTypeSchema,
    focus_area: z.string(),
    points: z.number().min(1)
  }))
});

// Complete Reading Test Schema  
export const readingTestSchema = z.object({
  reading_text: readingTextSchema,
  questions: z.object({
    multiple_choice: z.array(multipleChoiceQuestionSchema).min(0).optional(),
    true_false: z.array(trueFalseQuestionSchema).min(0).optional(),
    short_answer: z.array(shortAnswerQuestionSchema).min(0).optional(),
    fill_in_blanks: z.array(fillInBlankQuestionSchema).min(0).optional(),
    matching: z.array(matchingQuestionSchema).min(0).optional()
  }).refine(data => {
    // Ensure at least one question type has questions
    const totalQuestions = Object.values(data).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    return totalQuestions > 0;
  }, { message: "At least one question type must have questions" }),
  plan: testPlanSchema
});

// Request Schema for Generate Test API
export const generateTestRequestSchema = z.object({
  reading_instructions: readingInstructionsSchema,
  question_instructions: questionInstructionsSchema
});

// Request Schema for Generate Passage API
export const generatePassageRequestSchema = readingInstructionsSchema;

// Type exports for TypeScript
export type CefrLevel = z.infer<typeof cefrLevelSchema>;
export type TextType = z.infer<typeof textTypeSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type ReadingInstructions = z.infer<typeof readingInstructionsSchema>;
export type QuestionInstructions = z.infer<typeof questionInstructionsSchema>;
export type ReadingText = z.infer<typeof readingTextSchema>;
export type Question = z.infer<typeof questionSchema>;
export type ReadingTest = z.infer<typeof readingTestSchema>;
export type GenerateTestRequest = z.infer<typeof generateTestRequestSchema>;
export type GeneratePassageRequest = z.infer<typeof generatePassageRequestSchema>;
