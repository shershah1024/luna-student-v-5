import { z } from 'zod';

/**
 * Multi-speaker audio dialogue generation schemas
 * Supports 2-6 speakers with OpenAI TTS voices
 */

// Updated OpenAI TTS voice options (2025)
export const openaiVoiceSchema = z.enum([
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 
  'onyx', 'nova', 'sage', 'shimmer', 'verse'
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

// Individual speaker configuration
export const speakerConfigSchema = z.object({
  role: z.string().min(1, "Speaker role is required"),
  voice: openaiVoiceSchema,
  instruction: z.string().optional(),
  personality: z.string().optional() // e.g., "cheerful", "professional", "shy"
});

// Multi-speaker dialogue generation request schema
export const multiSpeakerDialogueRequestSchema = z.object({
  // Content generation parameters
  language: z.string().min(1).default('German'),
  topic: z.string().min(1, "Topic is required"),
  conversation_style: conversationStyleSchema,
  cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  duration_minutes: z.number().min(1).max(10).default(3),
  number_of_exchanges: z.number().min(3).max(30).default(8),
  
  // Speaker configuration (2-6 speakers)
  speakers: z.array(speakerConfigSchema).min(2).max(6),
  
  // Audio generation settings
  pause_between_speakers: z.number().min(0).max(3).default(0.5),
  pause_between_exchanges: z.number().min(0).max(5).default(1.0),
  
  // Optional customization
  scenario: z.string().optional(), // Specific scenario description
  custom_instructions: z.string().optional(),
  key_vocabulary: z.array(z.string()).optional(),
  target_structures: z.array(z.string()).optional(),
  
  // Advanced options
  balanced_speaking: z.boolean().default(true), // Equal lines per speaker
  natural_interruptions: z.boolean().default(false), // Allow overlapping speech
  emotional_range: z.enum(['neutral', 'expressive', 'dramatic']).default('neutral')
});

// Generated multi-speaker dialogue content schema
export const multiSpeakerDialogueContentSchema = z.object({
  speakers: z.array(z.object({
    speaker_id: z.string(),
    role: z.string(),
    voice: openaiVoiceSchema,
    instruction: z.string(),
    lines: z.array(z.string()).min(1)
  })).min(2).max(6),
  conversation_style: conversationStyleSchema,
  pause_between_speakers: z.number(),
  pause_between_exchanges: z.number(),
  filename: z.string(),
  turn_order: z.array(z.string()), // Sequence of speaker turns
  total_exchanges: z.number()
});

// Materials backend response schema
export const materialsBackendResponseSchema = z.object({
  success: z.boolean().optional(),
  public_url: z.string().url().optional(), 
  transcript: z.string().optional(),
  error: z.string().nullable().optional()
}).passthrough();

// Complete multi-speaker dialogue response schema
export const multiSpeakerDialogueResponseSchema = z.object({
  success: z.boolean(),
  dialogue_data: multiSpeakerDialogueContentSchema,
  audio_result: materialsBackendResponseSchema.optional(),
  metadata: z.object({
    generated_at: z.string(),
    generation_method: z.string(),
    model_used: z.string(),
    language: z.string().optional(),
    cefr_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    topic: z.string(),
    conversation_style: conversationStyleSchema,
    total_speakers: z.number(),
    total_exchanges: z.number(),
    estimated_duration_seconds: z.number(),
    voice_distribution: z.record(z.string(), z.number()) // speaker_id -> line count
  }).optional()
});

// Legacy format conversion for materials backend
export const legacyDialogueFormatSchema = z.object({
  speaker_1_lines: z.array(z.string()),
  speaker_2_lines: z.array(z.string()),
  speaker_1_voice: openaiVoiceSchema,
  speaker_2_voice: openaiVoiceSchema,
  conversation_style: conversationStyleSchema,
  speaker_1_instruction: z.string(),
  speaker_2_instruction: z.string(),
  pause_between_speakers: z.number(),
  pause_between_exchanges: z.number(),
  filename: z.string()
});

// Type exports
export type OpenAIVoice = z.infer<typeof openaiVoiceSchema>;
export type ConversationStyle = z.infer<typeof conversationStyleSchema>;
export type SpeakerConfig = z.infer<typeof speakerConfigSchema>;
export type MultiSpeakerDialogueRequest = z.infer<typeof multiSpeakerDialogueRequestSchema>;
export type MultiSpeakerDialogueContent = z.infer<typeof multiSpeakerDialogueContentSchema>;
export type MultiSpeakerDialogueResponse = z.infer<typeof multiSpeakerDialogueResponseSchema>;
export type LegacyDialogueFormat = z.infer<typeof legacyDialogueFormatSchema>;

// Helper function to convert multi-speaker to legacy 2-speaker format
export function convertToLegacyFormat(
  multiSpeakerData: MultiSpeakerDialogueContent
): LegacyDialogueFormat {
  const speaker1 = multiSpeakerData.speakers[0];
  const speaker2 = multiSpeakerData.speakers[1];
  
  return {
    speaker_1_lines: speaker1.lines,
    speaker_2_lines: speaker2.lines,
    speaker_1_voice: speaker1.voice,
    speaker_2_voice: speaker2.voice,
    conversation_style: multiSpeakerData.conversation_style,
    speaker_1_instruction: speaker1.instruction,
    speaker_2_instruction: speaker2.instruction,
    pause_between_speakers: multiSpeakerData.pause_between_speakers,
    pause_between_exchanges: multiSpeakerData.pause_between_exchanges,
    filename: multiSpeakerData.filename
  };
}
