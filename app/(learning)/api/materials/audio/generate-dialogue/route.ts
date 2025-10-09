import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { 
  audioDialogueRequestSchema,
  dialogueContentSchema,
  materialsBackendResponseSchema,
  type AudioDialogueRequest,
  type DialogueContent,
  type MaterialsBackendResponse 
} from '@/lib/schemas/audio-dialogue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Azure OpenAI configuration
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

/**
 * Generate audio dialogue using AI SDK structured outputs + Materials Backend
 * POST /api/materials/audio/generate-dialogue
 * 
 * 1. Uses Azure OpenAI to generate dialogue content
 * 2. Sends to materials backend for audio synthesis
 * 3. Returns both dialogue data and audio URL
 */
export async function POST(request: NextRequest) {
  console.log('=== AUDIO DIALOGUE GENERATION START ===');
  console.log('[AUDIO DIALOGUE] Request timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    
    // Validate request using Zod schema
    const validationResult = audioDialogueRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid request format',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const {
      language,
      topic,
      conversation_style,
      cefr_level,
      duration_minutes,
      number_of_exchanges,
      speaker_1_role,
      speaker_2_role,
      speaker_1_voice,
      speaker_2_voice,
      speaker_1_instruction,
      speaker_2_instruction,
      pause_between_speakers,
      pause_between_exchanges,
      custom_instructions,
      key_vocabulary,
      target_structures
    }: AudioDialogueRequest = validationResult.data as any;
    
    console.log('[AUDIO DIALOGUE] Generating dialogue with parameters:', {
      language,
      topic,
      conversation_style,
      cefr_level,
      duration_minutes,
      number_of_exchanges,
      speaker_1_role,
      speaker_2_role
    });

    // Generate dialogue content using AI
    const prompt = buildDialoguePrompt(
      language,
      topic,
      conversation_style,
      cefr_level,
      duration_minutes,
      number_of_exchanges,
      speaker_1_role,
      speaker_2_role,
      speaker_1_instruction,
      speaker_2_instruction,
      custom_instructions,
      key_vocabulary,
      target_structures
    );
    
    console.log('[AUDIO DIALOGUE] Calling Azure OpenAI for dialogue generation...');
    
    // Generate structured output using AI SDK with Azure OpenAI
    const { object: dialogueData } = await generateObject({
      model: model,
      schema: dialogueContentSchema,
      prompt: prompt,
      temperature: 0.8, // Higher creativity for dialogue
    });

    // Override the generated audio settings with user preferences
    dialogueData.speaker_1_voice = speaker_1_voice;
    dialogueData.speaker_2_voice = speaker_2_voice;
    dialogueData.pause_between_speakers = pause_between_speakers;
    dialogueData.pause_between_exchanges = pause_between_exchanges;
    dialogueData.filename = `dialogue_${topic.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.opus`;

    console.log('[AUDIO DIALOGUE] Successfully generated dialogue:', {
      speaker_1_lines: dialogueData.speaker_1_lines.length,
      speaker_2_lines: dialogueData.speaker_2_lines.length,
      total_exchanges: Math.max(dialogueData.speaker_1_lines.length, dialogueData.speaker_2_lines.length),
      filename: dialogueData.filename
    });

    // Validate the generated dialogue content
    const dialogueValidation = dialogueContentSchema.safeParse(dialogueData);
    if (!dialogueValidation.success) {
      console.error('[AUDIO DIALOGUE] Generated dialogue validation failed:', dialogueValidation.error);
      return NextResponse.json({
        error: 'Generated dialogue format validation failed',
        details: dialogueValidation.error.errors
      }, { status: 500 });
    }

    // Send to materials backend for audio generation
    let audioResult: MaterialsBackendResponse | undefined;
    try {
      console.log('[AUDIO DIALOGUE] Sending to materials backend for audio synthesis...');
      
      const materialsBackendUrl = process.env.MATERIALS_BACKEND_URL || 'http://materials-backend-api.eastus.azurecontainer.io:8000';
      const audioResponse = await fetch(`${materialsBackendUrl}/generate/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dialogueData)
      });

      if (audioResponse.ok) {
        const audioData = await audioResponse.json();
        console.log('[AUDIO DIALOGUE] Raw materials backend response:', JSON.stringify(audioData, null, 2));
        audioResult = {
          success: true,
          public_url: audioData.public_url,
          transcript: audioData.transcript,
          error: null
        };
        console.log('[AUDIO DIALOGUE] Audio generated successfully:', {
          success: audioResult.success,
          has_url: !!audioResult.public_url,
          has_transcript: !!audioResult.transcript
        });
      } else {
        const errorText = await audioResponse.text();
        console.warn('[AUDIO DIALOGUE] Materials backend error:', audioResponse.status, errorText);
        audioResult = {
          success: false,
          error: `Materials backend error: ${errorText}`
        };
      }
    } catch (audioError) {
      console.warn('[AUDIO DIALOGUE] Error calling materials backend:', audioError);
      audioResult = {
        success: false,
        error: `Failed to generate audio: ${audioError instanceof Error ? audioError.message : 'Unknown error'}`
      };
    }

    // Calculate estimated duration
    const totalLines = dialogueData.speaker_1_lines.length + dialogueData.speaker_2_lines.length;
    const avgWordsPerLine = 8; // Estimate
    const wordsPerMinute = 150; // Average speaking rate
    const estimatedDurationSeconds = Math.round((totalLines * avgWordsPerLine / wordsPerMinute) * 60);

    return NextResponse.json({
      success: true,
      dialogue_data: dialogueData,
      audio_result: audioResult,
      metadata: {
        generated_at: new Date().toISOString(),
        generation_method: 'ai_sdk_structured_azure',
        model_used: 'azure/o4-mini',
        language,
        cefr_level,
        topic,
        conversation_style,
        total_exchanges: Math.max(dialogueData.speaker_1_lines.length, dialogueData.speaker_2_lines.length),
        estimated_duration_seconds: estimatedDurationSeconds
      }
    });

  } catch (error) {
    console.error('[AUDIO DIALOGUE] Error generating dialogue:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'Rate limit exceeded. Please try again later.',
          retry_after: 60
        }, { status: 429 });
      }
      
      if (error.message.includes('context length')) {
        return NextResponse.json({
          error: 'Request too complex. Try reducing dialogue length or simplifying instructions.',
          suggestion: 'Reduce number_of_exchanges or simplify custom_instructions'
        }, { status: 413 });
      }
    }

    return NextResponse.json({
      error: 'Failed to generate audio dialogue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Build a comprehensive prompt for dialogue generation
 */
function buildDialoguePrompt(
  language: string,
  topic: string,
  conversationStyle: string,
  cefrLevel: string,
  durationMinutes: number,
  numberOfExchanges: number,
  speaker1Role: string,
  speaker2Role: string,
  speaker1Instruction?: string,
  speaker2Instruction?: string,
  customInstructions?: string,
  keyVocabulary?: string[],
  targetStructures?: string[]
): string {
  return `Generate a realistic ${language} conversation for language learning at CEFR ${cefrLevel} level.

CONVERSATION REQUIREMENTS:
- Topic: ${topic}
- Style: ${conversationStyle}
- CEFR Level: ${cefrLevel} (${getCefrDescription(cefrLevel)})
- Duration: ~${durationMinutes} minutes
- Number of exchanges: ${numberOfExchanges}
- Speaker 1: ${speaker1Role}
- Speaker 2: ${speaker2Role}

SPEAKER INSTRUCTIONS:
- Speaker 1 (${speaker1Role}): ${speaker1Instruction || 'Speak naturally and appropriately for the situation'}
- Speaker 2 (${speaker2Role}): ${speaker2Instruction || 'Respond naturally and appropriately for the situation'}

LANGUAGE REQUIREMENTS FOR ${cefrLevel}:
${getLanguageGuidelines(cefrLevel)}

${keyVocabulary ? `KEY VOCABULARY TO INCLUDE: ${keyVocabulary.join(', ')}` : ''}
${targetStructures ? `TARGET STRUCTURES TO USE: ${targetStructures.join(', ')}` : ''}

CONTENT GUIDELINES:
1. Create authentic, natural ${language} conversation
2. Use appropriate vocabulary and grammar for ${cefrLevel} level
3. Make each speaker's lines feel natural for their role
4. Include cultural context relevant to ${language}-speaking contexts
5. Ensure the conversation flows naturally with realistic responses
6. Balance the number of lines between speakers (should be roughly equal)
7. Keep individual lines conversational length (5-20 words typically)

CONVERSATION STYLE "${conversationStyle}" CHARACTERISTICS:
${getConversationStyleGuidelines(conversationStyle)}

${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ''}

Generate exactly ${numberOfExchanges} exchanges (back-and-forth) between the speakers. Each speaker should have roughly the same number of lines. The conversation should feel complete and natural.

IMPORTANT: Return the dialogue in the exact format specified:
- speaker_1_lines: Array of all lines for speaker 1
- speaker_2_lines: Array of all lines for speaker 2  
- conversation_style: "${conversationStyle}"
- speaker_1_instruction and speaker_2_instruction: Clear speaking directions
- filename: Will be set automatically

Create a realistic, engaging conversation that ${language} language learners at ${cefrLevel} level can understand and learn from.`;
}

/**
 * Get CEFR level description
 */
function getCefrDescription(cefrLevel: string): string {
  const descriptions = {
    'A1': 'Beginner - basic vocabulary and simple sentences',
    'A2': 'Elementary - familiar topics with simple language',
    'B1': 'Intermediate - clear standard language on familiar topics',
    'B2': 'Upper Intermediate - complex texts on concrete and abstract topics',
    'C1': 'Advanced - wide range of demanding texts with implicit meaning',
    'C2': 'Proficient - virtually all forms of written language'
  };
  return descriptions[cefrLevel as keyof typeof descriptions] || 'Intermediate level';
}

/**
 * Get specific language guidelines for each CEFR level
 */
function getLanguageGuidelines(cefrLevel: string): string {
  const guidelines = {
    'A1': '- Simple present tense, basic vocabulary\n- Short sentences with simple connectors\n- Concrete, everyday topics\n- Very high frequency words only',
    'A2': '- Present/past tenses, some future forms\n- Compound sentences with basic connectors\n- Familiar situations and personal topics\n- High frequency vocabulary',
    'B1': '- Various tenses including conditionals\n- Complex sentences with relative clauses\n- Abstract concepts in familiar contexts\n- Extended vocabulary with some idiomatic expressions',
    'B2': '- Full range of tenses and modal verbs\n- Complex grammatical structures\n- Abstract topics and specialized fields\n- Wide vocabulary including colloquialisms',
    'C1': '- Sophisticated grammar and syntax\n- Implicit meanings and cultural references\n- Complex abstract and technical topics\n- Extensive vocabulary with nuanced expressions',
    'C2': '- All grammatical forms including literary devices\n- Subtle distinctions and implied meanings\n- Any topic including highly specialized content\n- Complete vocabulary range with stylistic variations'
  };
  return guidelines[cefrLevel as keyof typeof guidelines] || guidelines['B1'];
}

/**
 * Get conversation style specific guidelines
 */
function getConversationStyleGuidelines(style: string): string {
  const styleGuides = {
    'friends_chatting': 'Casual, relaxed tone. Use informal language, contractions, and friendly expressions.',
    'business_meeting': 'Professional, formal tone. Use business vocabulary and polite expressions.',
    'customer_service': 'Polite, helpful tone. Customer asks questions, service person provides assistance.',
    'family_dinner': 'Warm, familiar tone. Family members sharing news and casual conversation.',
    'classroom_discussion': 'Educational tone. Teacher and student or student-to-student academic discussion.',
    'job_interview': 'Formal, professional. Interviewer asks questions, candidate responds professionally.',
    'shopping': 'Customer-vendor interaction. Questions about products, prices, and purchases.',
    'restaurant': 'Dining situation. Ordering food, discussing menu, server-customer interaction.',
    'doctor_visit': 'Medical consultation. Patient describes symptoms, doctor provides advice.',
    'phone_call': 'Telephone conversation style. Clear, direct communication with appropriate greetings/closings.'
  };
  return styleGuides[style as keyof typeof styleGuides] || 'Natural, contextually appropriate conversation.';
}
