import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { z } from 'zod';
import { dialogueContentSchema } from '@/lib/schemas/audio-dialogue';
import { monologueContentSchema } from '@/lib/schemas/monologue';
import { multiSpeakerDialogueContentSchema } from '@/lib/schemas/multi-speaker-dialogue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});
const model = azure('o4-mini');

const requestSchema = z.object({
  scenario: z.string().min(5, 'Please describe the scenario'),
  language: z.string().default('German'),
  cefr_level: z.enum(['A1','A2','B1','B2','C1','C2']).default('A1'),
  conversation_style: z.string().default('friends_chatting'),
  duration_minutes: z.number().min(1).max(10).default(2)
}).extend({
  mode: z.enum(['monologue','dialogue','group_4']).default('dialogue')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.errors }, { status: 400 });
    }
    const { scenario, language, cefr_level, conversation_style, duration_minutes, mode } = parsed.data;

    let resultData: any;
    if (mode === 'monologue') {
      const prompt = buildMonologuePrompt({ scenario, language, cefr_level, conversation_style, duration_minutes });
      const { object } = await generateObject({ model, schema: monologueContentSchema, prompt, temperature: 0.8 });
      object.filename = object.filename || `monologue_preview_${Date.now()}.opus`;
      resultData = object;
    } else if (mode === 'group_4') {
      const prompt = buildMultiPrompt({ scenario, language, cefr_level, conversation_style, duration_minutes, speakers: 4 });
      const { object } = await generateObject({ model, schema: multiSpeakerDialogueContentSchema, prompt, temperature: 0.8 });
      object.filename = object.filename || `group4_preview_${Date.now()}.opus`;
      resultData = object;
    } else {
      const prompt = buildDialoguePrompt({ scenario, language, cefr_level, conversation_style, duration_minutes });
      const { object } = await generateObject({ model, schema: dialogueContentSchema, prompt, temperature: 0.8 });
      // Ensure defaults for playback settings and voices (no audio yet)
      object.speaker_1_voice = object.speaker_1_voice || 'nova';
      object.speaker_2_voice = object.speaker_2_voice || 'echo';
      object.pause_between_speakers = object.pause_between_speakers ?? 0.5;
      object.pause_between_exchanges = object.pause_between_exchanges ?? 1.0;
      object.filename = object.filename || `dialogue_preview_${Date.now()}.opus`;
      resultData = object;
    }

    return NextResponse.json({
      success: true,
      mode,
      dialogue_data: resultData,
      metadata: {
        generated_at: new Date().toISOString(),
        cefr_level,
        conversation_style,
        duration_minutes
      }
    });
  } catch (error) {
    console.error('[listening/generate-conversation] Error:', error);
    return NextResponse.json({ error: 'Failed to generate conversation' }, { status: 500 });
  }
}

function buildDialoguePrompt(params: { scenario: string; language: string; cefr_level: string; conversation_style: string; duration_minutes: number }) {
  const { scenario, language, cefr_level, conversation_style, duration_minutes } = params;
  return `Generate a natural ${language} two-speaker conversation from the following scenario.

SCENARIO: ${scenario}
LEVEL: CEFR ${cefr_level}
STYLE: ${conversation_style}
TARGET AUDIO LENGTH: approximately ${duration_minutes} minutes

Requirements:
- Use vocabulary and grammar appropriate for CEFR ${cefr_level}
- Keep lines conversational (5–20 words)
- Alternate speakers naturally
- Reflect the scenario faithfully without adding extra context
- Calibrate line lengths and speaking pace so that the total spoken conversation will be close to ${duration_minutes} minutes when read aloud at a natural rate

Return exactly in the structured format with fields: speaker_1_lines, speaker_2_lines, conversation_style, speaker_1_instruction, speaker_2_instruction, speaker_1_voice, speaker_2_voice, pause_between_speakers, pause_between_exchanges, filename.`;
}

function buildMonologuePrompt(params: { scenario: string; language: string; cefr_level: string; conversation_style: string; duration_minutes: number }) {
  const { scenario, language, cefr_level, conversation_style, duration_minutes } = params;
  return `Generate a natural ${language} monologue based on the scenario.

SCENARIO: ${scenario}
LEVEL: CEFR ${cefr_level}
STYLE: ${conversation_style}
TARGET AUDIO LENGTH: approximately ${duration_minutes} minutes

Requirements:
- Use vocabulary and grammar appropriate for CEFR ${cefr_level}
- Single speaker; no dialogues
- Keep sentences 5–20 words; natural pacing
- Reflect the scenario faithfully
- Calibrate total length to be close to ${duration_minutes} minutes when read aloud

Return fields: lines (array), conversation_style, voice, instruction, pause_between_sentences, filename.`;
}

function buildMultiPrompt(params: { scenario: string; language: string; cefr_level: string; conversation_style: string; duration_minutes: number; speakers: number }) {
  const { scenario, language, cefr_level, conversation_style, duration_minutes, speakers } = params;
  return `Generate a natural ${language} conversation among ${speakers} speakers from the scenario.

SCENARIO: ${scenario}
LEVEL: CEFR ${cefr_level}
STYLE: ${conversation_style}
TARGET AUDIO LENGTH: approximately ${duration_minutes} minutes

Requirements:
- Use vocabulary and grammar appropriate for CEFR ${cefr_level}
- Distinct roles for each speaker; balanced participation
- Keep lines 5–20 words; natural turn-taking
- Calibrate total length to be close to ${duration_minutes} minutes when read aloud

Return multi-speaker format with: speakers (speaker_id, role, voice, instruction, lines), turn_order, total_exchanges, conversation_style, pause_between_speakers, pause_between_exchanges, filename.`;
}
