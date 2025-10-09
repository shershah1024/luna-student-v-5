import { z } from 'zod';

export const monologueVoiceSchema = z.enum([
  'nova', 'echo', 'alloy', 'onyx', 'shimmer', 'fable'
]);

export const monologueStyleSchema = z.enum([
  'casual_friendly', 'formal_professional', 'informal_relaxed', 'enthusiastic', 'calm_measured',
  'storytelling', 'news_report', 'documentary', 'podcast_discussion', 'radio_show', 'audiobook_narration'
]);

export const monologueContentSchema = z.object({
  lines: z.array(z.string()).min(1),
  voice: monologueVoiceSchema.default('nova'),
  conversation_style: monologueStyleSchema.default('storytelling'),
  instruction: z.string().default('Speak clearly and naturally for learners'),
  pause_between_sentences: z.number().default(0.3),
  filename: z.string()
});

export type MonologueContent = z.infer<typeof monologueContentSchema>;

