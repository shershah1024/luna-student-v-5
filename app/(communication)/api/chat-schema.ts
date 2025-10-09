import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const chatRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.string().default('gpt-4o-mini'),
  selectedVisibilityType: z.enum(['public', 'private']).default('private'),
  // Additional telc_a1 specific fields
  task_id: z.string().optional(),
  course_id: z.string().optional(),
  lesson_number: z.number().optional(),
  chatbot_type: z.enum(['vocabulary', 'grammar', 'roleplay', 'general']).optional(),
  enabled_tools: z.array(z.string()).optional(),
});

export type ChatRequestBody = z.infer<typeof chatRequestBodySchema>;