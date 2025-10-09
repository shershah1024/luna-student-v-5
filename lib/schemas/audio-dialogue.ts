import { z } from 'zod';

/**
 * Audio dialogue generation schemas for materials backend integration
 */

// Voice options available
export const voiceSchema = z.enum([
  'nova', 'echo', 'alloy', 'onyx', 'shimmer', 'fable'
]);

// Conversation styles (from materials backend API)
export const conversationStyleSchema = z.enum([
  'casual_friendly', 'formal_professional', 'informal_relaxed', 'enthusiastic', 'calm_measured', 
  'academic_lecture', 'tutorial_explanation', 'student_discussion', 'teacher_student', 'study_group', 
  'business_meeting', 'presentation', 'interview', 'customer_service', 'negotiation', 
  'friends_chatting', 'family_conversation', 'small_talk', 'storytelling', 'debate', 
  'news_report', 'documentary', 'podcast_discussion', 'radio_show', 'audiobook_narration', 
  'phone_call', 'consultation', 'advice_giving', 'support_call', 'booking_reservation', 
  'comedy_banter', 'dramatic_dialogue', 'game_show', 'sports_commentary', 'travel_guide'
]);

// Audio dialogue generation request schema
export const audioDialogueRequestSchema = z.object({
  // Content generation parameters
  language: z.string().min(1).default('German'),
  topic: z.string().min(1, "Topic is required"),
  conversation_style: conversationStyleSchema,
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  duration_minutes: z.number().min(1).max(10).default(2),
  number_of_exchanges: z.number().min(2).max(20).default(6),
  
  // Speaker configuration
  speaker_1_role: z.string().default("Person A"),
  speaker_2_role: z.string().default("Person B"), 
  speaker_1_voice: voiceSchema.default("nova"),
  speaker_2_voice: voiceSchema.default("echo"),
  
  // Audio generation settings
  speaker_1_instruction: z.string().optional(),
  speaker_2_instruction: z.string().optional(),
  pause_between_speakers: z.number().min(0).max(3).default(0.5),
  pause_between_exchanges: z.number().min(0).max(5).default(1.0),
  
  // Optional customization
  custom_instructions: z.string().optional(),
  key_vocabulary: z.array(z.string()).optional(),
  target_structures: z.array(z.string()).optional()
});

// Generated dialogue content schema (for AI generation)
export const dialogueContentSchema = z.object({
  speaker_1_lines: z.array(z.string()).min(1),
  speaker_2_lines: z.array(z.string()).min(1),
  speaker_1_voice: voiceSchema,
  speaker_2_voice: voiceSchema,
  conversation_style: conversationStyleSchema,
  speaker_1_instruction: z.string(),
  speaker_2_instruction: z.string(), 
  pause_between_speakers: z.number(),
  pause_between_exchanges: z.number(),
  filename: z.string()
});

// Materials backend response schema (your expected format)
export const materialsBackendResponseSchema = z.object({
  success: z.boolean().optional(),
  public_url: z.string().url().optional(), 
  transcript: z.string().optional(),
  error: z.string().nullable().optional()
}).passthrough(); // Allow additional fields

// Complete audio dialogue response schema
export const audioDialogueResponseSchema = z.object({
  success: z.boolean(),
  dialogue_data: dialogueContentSchema,
  audio_result: materialsBackendResponseSchema.optional(),
  metadata: z.object({
    generated_at: z.string(),
    generation_method: z.string(),
    model_used: z.string(),
    language: z.string().optional(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    topic: z.string(),
    conversation_style: conversationStyleSchema,
    total_exchanges: z.number(),
    estimated_duration_seconds: z.number()
  }).optional()
});

// Request for materials backend audio generation
export const materialsAudioRequestSchema = z.object({
  speaker_1_lines: z.array(z.string()),
  speaker_2_lines: z.array(z.string()),
  speaker_1_voice: voiceSchema,
  speaker_2_voice: voiceSchema,
  conversation_style: conversationStyleSchema,
  speaker_1_instruction: z.string(),
  speaker_2_instruction: z.string(),
  pause_between_speakers: z.number(),
  pause_between_exchanges: z.number(),
  filename: z.string()
});

// Type exports
export type Voice = z.infer<typeof voiceSchema>;
export type ConversationStyle = z.infer<typeof conversationStyleSchema>;
export type AudioDialogueRequest = z.infer<typeof audioDialogueRequestSchema>;
export type DialogueContent = z.infer<typeof dialogueContentSchema>;
export type MaterialsBackendResponse = z.infer<typeof materialsBackendResponseSchema>;
export type AudioDialogueResponse = z.infer<typeof audioDialogueResponseSchema>;
export type MaterialsAudioRequest = z.infer<typeof materialsAudioRequestSchema>;
