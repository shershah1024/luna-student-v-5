import { z } from "zod"

// Base schema for all assignments
const BaseAssignmentSchema = z.object({
  save_assignment: z.boolean().default(true),
  assignment_title: z.string().optional(),
})

// Chatbot Assignment Schema
export const ChatbotAssignmentSchema = BaseAssignmentSchema.extend({
  topic: z.string().min(1, "Topic is required"),
  background: z.string().optional(),
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  language_focus: z.string().min(1, "Language focus is required"),
  conversation_goals: z.string().min(1, "Conversation goals are required"),
  character_role: z.string().optional(),
  conversation_length: z.string().optional(),
})

// Writing Assignment Schema
export const WritingAssignmentSchema = BaseAssignmentSchema.extend({
  task_type: z.string().min(1, "Task type is required"),
  topic: z.string().min(1, "Topic is required"),
  word_count: z.string().min(1, "Word count is required"),
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  writing_focus: z.string().min(1, "Writing focus is required"),
  assessment_criteria: z.string().optional(),
  specific_requirements: z.string().optional(),
  text_format: z.string().optional(),
  time_limit: z.string().optional(),
  max_score_per_parameter: z.number().int().min(5).max(20).optional(),
})

// Speaking Assignment Schema
export const SpeakingAssignmentSchema = BaseAssignmentSchema.extend({
  task_type: z.string().min(1, "Task type is required"),
  topic: z.string().min(1, "Topic is required"),
  duration: z.string().min(1, "Duration is required"),
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  speaking_focus: z.string().min(1, "Speaking focus is required"),
  evaluation_criteria: z.string().optional(),
  preparation_time: z.string().optional(),
  interaction_type: z.string().optional(),
  visual_support: z.string().optional(),
  specific_requirements: z.string().optional(),
})

// Debate Assignment Schema
export const DebateAssignmentSchema = BaseAssignmentSchema.extend({
  debate_topic: z.string().min(1, "Debate topic is required"),
  student_position: z.string().min(1, "Student position is required"),
  ai_position: z.string().min(1, "AI position is required"),
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  debate_format: z.string().optional(),
  time_limit: z.string().optional(),
  preparation_time: z.string().optional(),
  argument_focus: z.string().optional(),
  evaluation_criteria: z.string().optional(),
  background_context: z.string().optional(),
})

// Storytelling Assignment Schema
export const StorytellingAssignmentSchema = BaseAssignmentSchema.extend({
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  language_focus: z.string().min(1, "Language focus is required"),
  story_theme: z.string().optional(),
  genre: z.string().optional(),
  story_length: z.string().optional(),
  creative_constraints: z.string().optional(),
})

// Pronunciation Assignment Schema
export const PronunciationAssignmentSchema = BaseAssignmentSchema.extend({
  theme: z.string().min(1, "Theme is required"),
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  word_count: z.number().min(3).max(25),
  focus_sounds: z.string().optional(),
  pronunciation_focus: z.string().optional(),
  target_learners: z.string().optional(),
  specific_vocabulary: z.string().optional(),
})

// Audio Dialogue Assignment Schema
export const AudioDialogueAssignmentSchema = BaseAssignmentSchema.extend({
  topic: z.string().min(1, "Topic is required"),
  additional_details: z.string().optional(),
  language: z.string().min(1).default('German'),
  cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A2"),
})

// Listening Quiz (dialogue + questions) Schema
export const ListeningQuizAssignmentSchema = BaseAssignmentSchema.extend({
  // Dialogue basics
  topic: z.string().min(1, "Topic is required"),
  language: z.string().min(1).default('German'),
  cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("A1"),
  conversation_style: z.enum([
    'friends_chatting', 'customer_service', 'business_meeting', 'restaurant', 'shopping', 'phone_call'
  ]).default('friends_chatting'),
  number_of_exchanges: z.number().min(2).max(20).default(6),
  speaker_1_role: z.string().default('Speaker A'),
  speaker_2_role: z.string().default('Speaker B'),
  speaker_1_voice: z.enum(['nova','echo','alloy','onyx','shimmer','fable']).default('nova'),
  speaker_2_voice: z.enum(['nova','echo','alloy','onyx','shimmer','fable']).default('echo'),
  // Questions
  total_points: z.number().min(1).max(100).default(20),
  include_mcq: z.boolean().default(true),
  include_true_false: z.boolean().default(true),
  include_short_answer: z.boolean().default(false),
})

// Vocabulary Tutor Assignment Schema
export const VocabularyTutorAssignmentSchema = BaseAssignmentSchema.extend({
  topic: z.string().min(1, "Topic is required"),
  difficulty_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  word_count: z.number().min(5).max(30),
  focus_areas: z.array(z.string()).min(1, "At least one focus area is required"),
})

// Export type definitions
export type ChatbotAssignmentForm = z.infer<typeof ChatbotAssignmentSchema>
export type WritingAssignmentForm = z.infer<typeof WritingAssignmentSchema>
export type SpeakingAssignmentForm = z.infer<typeof SpeakingAssignmentSchema>
export type DebateAssignmentForm = z.infer<typeof DebateAssignmentSchema>
export type StorytellingAssignmentForm = z.infer<typeof StorytellingAssignmentSchema>
export type PronunciationAssignmentForm = z.infer<typeof PronunciationAssignmentSchema>
export type AudioDialogueAssignmentForm = z.infer<typeof AudioDialogueAssignmentSchema>
export type VocabularyTutorAssignmentForm = z.infer<typeof VocabularyTutorAssignmentSchema>
export type ListeningQuizAssignmentForm = z.infer<typeof ListeningQuizAssignmentSchema>

// Assignment type constants
export const ASSIGNMENT_TYPES = [
  "chatbot",
  "writing", 
  "speaking",
  "debate",
  "storytelling",
  "pronunciation",
  "audio-dialogue",
  "vocabulary-tutor"
] as const

export type AssignmentType = typeof ASSIGNMENT_TYPES[number]

// CEFR levels constant
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const
