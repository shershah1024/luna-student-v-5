import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { 
  generateTestRequestSchema, 
  readingTestSchema,
  type GenerateTestRequest,
  type ReadingTest 
} from '@/lib/schemas/reading-test';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Azure OpenAI configuration
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

/**
 * Generate complete reading test using AI SDK structured outputs
 * POST /api/reading/generate-with-ai
 * 
 * Uses OpenAI GPT-4 with structured outputs to generate CEFR-aligned reading tests
 * Ensures consistent format matching the comprehensive guide requirements
 */
export async function POST(request: NextRequest) {
  console.log('=== AI SDK READING TEST GENERATION START ===');
  console.log('[AI SDK] Request timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    
    // Validate request using Zod schema
    const validationResult = generateTestRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid request format',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { reading_instructions, question_instructions }: GenerateTestRequest = validationResult.data;
    
    console.log('[AI SDK] Generating reading test with parameters:', {
      topic: reading_instructions.topic,
      text_type: reading_instructions.text_type,
      cefr_level: reading_instructions.cefr_level,
      total_points: question_instructions.total_points,
      question_types: question_instructions.question_types?.length || 'default'
    });

    // Build the detailed prompt for AI generation
    const prompt = buildReadingTestPrompt(reading_instructions, question_instructions);
    
    console.log('[AI SDK] Calling OpenAI with structured output schema...');
    
    // Generate structured output using AI SDK with Azure OpenAI
    const { object: readingTest } = await generateObject({
      model: model,
      schema: readingTestSchema,
      prompt: prompt,
    });

    console.log('[AI SDK] Successfully generated reading test:', {
      title: readingTest.reading_text.title,
      reading_level: readingTest.reading_text.reading_level,
      total_questions: Object.values(readingTest.questions)
        .reduce((total, questionArray) => total + (questionArray?.length || 0), 0),
      planned_points: readingTest.plan.total_points,
      difficulty_score: readingTest.reading_text.difficulty_score
    });

    // Validate the generated output matches our schema
    const outputValidation = readingTestSchema.safeParse(readingTest);
    if (!outputValidation.success) {
      console.error('[AI SDK] Generated output validation failed:', outputValidation.error);
      return NextResponse.json({
        error: 'Generated test format validation failed',
        details: outputValidation.error.errors
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: readingTest,
      metadata: {
        generated_at: new Date().toISOString(),
        generation_method: 'ai_sdk_structured_azure',
        model_used: 'azure/gpt-4o-mini',
        cefr_level: reading_instructions.cefr_level,
        topic: reading_instructions.topic,
        text_type: reading_instructions.text_type,
        total_questions: Object.values(readingTest.questions)
          .reduce((total, questionArray) => total + (questionArray?.length || 0), 0),
        requested_points: question_instructions.total_points
      }
    });

  } catch (error) {
    console.error('[AI SDK] Error generating reading test:', error);
    
    if (error instanceof Error) {
      // Check for specific AI SDK errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'Rate limit exceeded. Please try again later.',
          retry_after: 60
        }, { status: 429 });
      }
      
      if (error.message.includes('context length')) {
        return NextResponse.json({
          error: 'Request too complex. Try reducing word count or simplifying instructions.',
          suggestion: 'Reduce word_count or simplify custom_instructions'
        }, { status: 413 });
      }
    }

    return NextResponse.json({
      error: 'Failed to generate reading test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Build a comprehensive prompt for reading test generation
 */
function buildReadingTestPrompt(
  readingInstructions: GenerateTestRequest['reading_instructions'],
  questionInstructions: GenerateTestRequest['question_instructions']
): string {
  const {
    topic,
    text_type,
    cefr_level,
    word_count = getDefaultWordCount(cefr_level),
    custom_instructions,
    target_audience,
    key_concepts
  } = readingInstructions;

  const {
    total_points,
    question_types = ['multiple_choice', 'true_false'],
    additional_instructions
  } = questionInstructions;

  return `Generate a complete CEFR ${cefr_level} reading test about "${topic}" as a ${text_type}.

READING TEXT REQUIREMENTS:
- CEFR Level: ${cefr_level} (${getCefrDescription(cefr_level)})
- Topic: ${topic}
- Text Type: ${text_type}
- Target Word Count: ${word_count} words
- Target Audience: ${target_audience || 'General language learners'}
${key_concepts ? `- Key Concepts to Include: ${key_concepts.join(', ')}` : ''}
${custom_instructions ? `- Special Instructions: ${custom_instructions}` : ''}
 - difficulty_score must be a float between 0 and 1 (inclusive), where 0 = very easy and 1 = very difficult

The reading text must:
1. Use vocabulary and grammar appropriate for ${cefr_level} level
2. Be engaging and authentic for the topic
3. Include cultural context relevant to German-speaking countries
4. Have clear structure with logical flow
5. Include the specified key concepts naturally

QUESTIONS REQUIREMENTS:
- Total Points: ${total_points}
- Question Types: ${question_types.join(', ')}
- Generate a balanced mix of question types
- Questions should test comprehension at ${cefr_level} level
- Include detailed explanations for each answer
- Distribute points logically across questions

${additional_instructions ? `Additional Instructions: ${additional_instructions}` : ''}

QUALITY STANDARDS:
- Questions must directly relate to the text content
- Avoid trick questions or ambiguous wording
- Provide clear, helpful explanations
- Ensure cultural sensitivity and inclusivity
- Use age-appropriate language and themes

Generate the complete test following the exact schema format provided.`;
}

/**
 * Get default word count based on CEFR level
 */
function getDefaultWordCount(cefrLevel: string): number {
  const wordCounts = {
    'A1': 100,
    'A2': 150,
    'B1': 250,
    'B2': 400,
    'C1': 600,
    'C2': 800
  };
  return wordCounts[cefrLevel as keyof typeof wordCounts] || 250;
}

/**
 * Get CEFR level description for prompt context
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
