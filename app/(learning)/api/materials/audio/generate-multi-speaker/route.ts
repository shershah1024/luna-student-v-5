import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { 
  multiSpeakerDialogueRequestSchema,
  multiSpeakerDialogueContentSchema,
  convertToLegacyFormat,
  type MultiSpeakerDialogueRequest,
  type MultiSpeakerDialogueContent
} from '@/lib/schemas/multi-speaker-dialogue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Azure OpenAI configuration
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

/**
 * Generate multi-speaker audio dialogue (2-6 speakers)
 * POST /api/materials/audio/generate-multi-speaker
 * 
 * 1. Uses Azure OpenAI to generate multi-speaker dialogue content
 * 2. Converts to legacy format for materials backend compatibility
 * 3. Sends to materials backend for audio synthesis
 * 4. Returns both dialogue data and audio URL
 */
export async function POST(request: NextRequest) {
  console.log('=== MULTI-SPEAKER DIALOGUE GENERATION START ===');
  console.log('[MULTI-SPEAKER] Request timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    
    // Validate request using Zod schema
    const validationResult = multiSpeakerDialogueRequestSchema.safeParse(body);
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
      speakers,
      pause_between_speakers,
      pause_between_exchanges,
      scenario,
      custom_instructions,
      key_vocabulary,
      target_structures,
      balanced_speaking,
      natural_interruptions,
      emotional_range
    }: MultiSpeakerDialogueRequest = validationResult.data as any;
    
    console.log('[MULTI-SPEAKER] Generating dialogue with parameters:', {
      language,
      topic,
      conversation_style,
      cefr_level,
      duration_minutes,
      number_of_exchanges,
      total_speakers: speakers.length,
      speaker_roles: speakers.map(s => s.role),
      speaker_voices: speakers.map(s => s.voice)
    });

    // Build the detailed prompt for AI generation
    const prompt = buildMultiSpeakerPrompt(
      language,
      topic,
      conversation_style,
      cefr_level,
      duration_minutes,
      number_of_exchanges,
      speakers,
      scenario,
      custom_instructions,
      key_vocabulary,
      target_structures,
      balanced_speaking,
      natural_interruptions,
      emotional_range
    );
    
    console.log('[MULTI-SPEAKER] Calling Azure OpenAI for dialogue generation...');
    
    // Generate structured output using AI SDK with Azure OpenAI
    const { object: dialogueData } = await generateObject({
      model: model,
      schema: multiSpeakerDialogueContentSchema,
      prompt: prompt,
      temperature: 0.8, // Higher creativity for dialogue
    });

    // Override the generated settings with user preferences
    dialogueData.pause_between_speakers = pause_between_speakers;
    dialogueData.pause_between_exchanges = pause_between_exchanges;
    dialogueData.filename = `multi_dialogue_${topic.toLowerCase().replace(/\s+/g, '_')}_${speakers.length}speakers_${Date.now()}.opus`;

    console.log('[MULTI-SPEAKER] Successfully generated dialogue:', {
      total_speakers: dialogueData.speakers.length,
      lines_per_speaker: dialogueData.speakers.map(s => ({ role: s.role, lines: s.lines.length })),
      total_exchanges: dialogueData.total_exchanges,
      filename: dialogueData.filename
    });

    // Validate the generated dialogue content
    const dialogueValidation = multiSpeakerDialogueContentSchema.safeParse(dialogueData);
    if (!dialogueValidation.success) {
      console.error('[MULTI-SPEAKER] Generated dialogue validation failed:', dialogueValidation.error);
      return NextResponse.json({
        error: 'Generated dialogue format validation failed',
        details: dialogueValidation.error.errors
      }, { status: 500 });
    }

    // Convert to legacy format for materials backend (currently only supports 2 speakers)
    let audioResult;
    if (speakers.length <= 2) {
      try {
        console.log('[MULTI-SPEAKER] Converting to legacy format and sending to materials backend...');
        
        const legacyFormat = convertToLegacyFormat(dialogueData);
        
        const materialsBackendUrl = process.env.MATERIALS_BACKEND_URL || 'http://materials-backend-api.eastus.azurecontainer.io:8000';
        const audioResponse = await fetch(`${materialsBackendUrl}/generate/conversation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(legacyFormat)
        });

        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          console.log('[MULTI-SPEAKER] Raw materials backend response:', JSON.stringify(audioData, null, 2));
          audioResult = {
            success: true,
            public_url: audioData.public_url,
            transcript: audioData.transcript,
            error: null
          };
          console.log('[MULTI-SPEAKER] Audio generated successfully:', {
            success: audioResult.success,
            has_url: !!audioResult.public_url,
            has_transcript: !!audioResult.transcript
          });
        } else {
          const errorText = await audioResponse.text();
          console.warn('[MULTI-SPEAKER] Materials backend error:', audioResponse.status, errorText);
          audioResult = {
            success: false,
            error: `Materials backend error: ${errorText}`
          };
        }
      } catch (audioError) {
        console.warn('[MULTI-SPEAKER] Error calling materials backend:', audioError);
        audioResult = {
          success: false,
          error: `Failed to generate audio: ${audioError instanceof Error ? audioError.message : 'Unknown error'}`
        };
      }
    } else {
      console.log('[MULTI-SPEAKER] Skipping audio generation - materials backend only supports 2 speakers currently');
      audioResult = {
        success: false,
        error: `Audio generation not supported for ${speakers.length} speakers. Materials backend currently supports max 2 speakers.`
      };
    }

    // Calculate estimated duration and voice distribution
    const totalLines = dialogueData.speakers.reduce((sum, speaker) => sum + speaker.lines.length, 0);
    const avgWordsPerLine = 8;
    const wordsPerMinute = 150;
    const estimatedDurationSeconds = Math.round((totalLines * avgWordsPerLine / wordsPerMinute) * 60);

    const voiceDistribution = dialogueData.speakers.reduce((dist, speaker) => {
      dist[speaker.speaker_id] = speaker.lines.length;
      return dist;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      dialogue_data: dialogueData,
      audio_result: audioResult,
      metadata: {
        generated_at: new Date().toISOString(),
        generation_method: 'ai_sdk_structured_azure_multi_speaker',
        model_used: 'azure/o4-mini',
        language,
        cefr_level,
        topic,
        conversation_style,
        total_speakers: speakers.length,
        total_exchanges: dialogueData.total_exchanges,
        estimated_duration_seconds: estimatedDurationSeconds,
        voice_distribution: voiceDistribution
      }
    });

  } catch (error) {
    console.error('[MULTI-SPEAKER] Error generating dialogue:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'Rate limit exceeded. Please try again later.',
          retry_after: 60
        }, { status: 429 });
      }
      
      if (error.message.includes('context length')) {
        return NextResponse.json({
          error: 'Request too complex. Try reducing number of speakers or dialogue length.',
          suggestion: 'Reduce number_of_exchanges, speakers, or simplify custom_instructions'
        }, { status: 413 });
      }
    }

    return NextResponse.json({
      error: 'Failed to generate multi-speaker dialogue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Build a comprehensive prompt for multi-speaker dialogue generation
 */
function buildMultiSpeakerPrompt(
  language: string,
  topic: string,
  conversationStyle: string,
  cefrLevel: string,
  durationMinutes: number,
  numberOfExchanges: number,
  speakers: Array<{ role: string; voice: string; instruction?: string; personality?: string }>,
  scenario?: string,
  customInstructions?: string,
  keyVocabulary?: string[],
  targetStructures?: string[],
  balancedSpeaking?: boolean,
  naturalInterruptions?: boolean,
  emotionalRange?: string
): string {
  const speakerList = speakers.map((s, i) => 
    `- Speaker ${i + 1} (ID: speaker_${i + 1}): ${s.role} - Voice: ${s.voice}${s.personality ? ` - Personality: ${s.personality}` : ''}${s.instruction ? ` - Instruction: ${s.instruction}` : ''}`
  ).join('\n');

  return `Generate a realistic ${language} conversation for language learning at CEFR ${cefrLevel} level with ${speakers.length} speakers.

CONVERSATION REQUIREMENTS:
- Topic: ${topic}
- Style: ${conversationStyle}
- CEFR Level: ${cefrLevel} (${getCefrDescription(cefrLevel)})
- Duration: ~${durationMinutes} minutes
- Number of exchanges: ${numberOfExchanges}
- Total Speakers: ${speakers.length}
${scenario ? `- Scenario: ${scenario}` : ''}

SPEAKERS:
${speakerList}

LANGUAGE REQUIREMENTS FOR ${cefrLevel}:
${getLanguageGuidelines(cefrLevel)}

${keyVocabulary ? `KEY VOCABULARY TO INCLUDE: ${keyVocabulary.join(', ')}` : ''}
${targetStructures ? `TARGET STRUCTURES TO USE: ${targetStructures.join(', ')}` : ''}

CONTENT GUIDELINES:
1. Create authentic, natural ${language} conversation
2. Use appropriate vocabulary and grammar for ${cefrLevel} level
3. Make each speaker's lines feel natural for their role and personality
4. Include cultural context relevant to ${language}-speaking contexts
5. Ensure the conversation flows naturally with realistic responses
6. ${balancedSpeaking ? 'Balance the number of lines roughly equally between all speakers' : 'Allow natural variation in speaker participation'}
7. Keep individual lines conversational length (5-20 words typically)
8. ${naturalInterruptions ? 'Include natural interruptions and overlapping dialogue where appropriate' : 'Maintain clear turn-taking between speakers'}
9. Emotional range: ${emotionalRange} - adjust speaker expressions accordingly

CONVERSATION STYLE "${conversationStyle}" CHARACTERISTICS:
${getConversationStyleGuidelines(conversationStyle)}

MULTI-SPEAKER DYNAMICS:
- Create distinct personalities for each speaker
- Show realistic group interaction patterns
- Include natural conversation flow with topic transitions
- Use appropriate ${language} conversation fillers and expressions
- Consider cultural context for group conversations in ${language}-speaking contexts

${customInstructions ? `ADDITIONAL INSTRUCTIONS: ${customInstructions}` : ''}

IMPORTANT OUTPUT FORMAT:
Return the dialogue in this exact format:
- speakers: Array of speaker objects with speaker_id, role, voice, instruction, and lines
- speaker_id format: "speaker_1", "speaker_2", etc.
- turn_order: Array showing the sequence of speakers (e.g., ["speaker_1", "speaker_2", "speaker_1", "speaker_3"])
- total_exchanges: Total number of conversational exchanges
- conversation_style: "${conversationStyle}"
- pause_between_speakers and pause_between_exchanges: Will be set automatically

Create a realistic, engaging ${speakers.length}-speaker conversation that ${language} language learners at ${cefrLevel} level can understand and learn from.`;
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
    'family_conversation': 'Warm, familiar tone. Family members sharing news and casual conversation.',
    'academic_lecture': 'Educational, formal tone. Clear explanations and academic vocabulary.',
    'student_discussion': 'Collaborative, learning-focused. Students sharing ideas and asking questions.',
    'teacher_student': 'Educational interaction. Teacher guides, student responds and asks questions.',
    'presentation': 'Formal, informative tone. Clear structure and professional delivery.',
    'interview': 'Formal, professional. Interviewer asks questions, interviewee responds.',
    'negotiation': 'Strategic, professional. Multiple parties discussing terms and agreements.',
    'debate': 'Argumentative, structured. Participants present and defend different viewpoints.',
    'phone_call': 'Clear, direct communication with appropriate greetings and closings.',
    'travel_guide': 'Informative, engaging tone. Guide provides information, tourists ask questions.'
  };
  return styleGuides[style as keyof typeof styleGuides] || 'Natural, contextually appropriate conversation for multiple speakers.';
}
