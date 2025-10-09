// app/api/listening/generate-questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

// Azure OpenAI model
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});
const model = azure('o4-mini');

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Question type schemas for different question types
const MultipleChoiceSchema = z.object({
  question_number: z.number(),
  type: z.literal('multiple_choice'),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct_index: z.number().min(0).max(3),
  correct_answer: z.string(),
  points: z.number(),
  explanation: z.string(),
});

const TrueFalseSchema = z.object({
  question_number: z.number(),
  type: z.literal('true_false'),
  question: z.string(),
  correct_answer: z.enum(['true', 'false']),
  points: z.number(),
  explanation: z.string(),
});

const ShortAnswerSchema = z.object({
  question_number: z.number(),
  type: z.literal('short_answer'),
  question: z.string(),
  correct_answer: z.string(),
  points: z.number(),
  explanation: z.string(),
});

const MatchingPairSchema = z.object({
  left: z.string(),
  right: z.string(),
});

const MatchingSchema = z.object({
  question_number: z.number(),
  type: z.literal('match_the_following'),
  question: z.string(),
  pairs: z.array(MatchingPairSchema).min(3),
  correct_answer: z.string(), // JSON string of correct matches
  points: z.number(),
  explanation: z.string(),
});

const SentenceReorderingSchema = z.object({
  question_number: z.number(),
  type: z.literal('sentence_reordering'),
  question: z.string(),
  sentences: z.array(z.string()).min(3),
  correct_answer: z.string(), // JSON string of correct order indices
  points: z.number(),
  explanation: z.string(),
});

const FillInBlanksSchema = z.object({
  question_number: z.number(),
  type: z.literal('fill_in_the_blanks'),
  question: z.string(),
  blanks: z.array(z.object({
    text: z.string(),
  })).min(1),
  correct_answer: z.string(), // JSON string of correct answers array
  points: z.number(),
  explanation: z.string(),
});

// Union schema for all question types
const AnyQuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceSchema,
  TrueFalseSchema,
  ShortAnswerSchema,
  MatchingSchema,
  SentenceReorderingSchema,
  FillInBlanksSchema,
]);

// Simple schema that validates structure but doesn't enforce exact question numbers
const QuestionsResponseSchema = z.object({
  questions: z.array(AnyQuestionSchema),
  total_points: z.number(),
  validation: z.object({
    points_match: z.boolean(),
    computed_total: z.number(),
  }),
});

/**
 * Generates actual questions based on a question plan
 * POST /api/listening/generate-questions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [GENERATE-QUESTIONS] Starting question generation from plan');
    
    const body = await request.json();
    const { task_id, transcript, question_plan, topic, language = 'Spanish', level = 'A1' } = body;
    
    if (!task_id || !transcript || !question_plan || !Array.isArray(question_plan.questions)) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, transcript, question_plan' },
        { status: 400 }
      );
    }
    
    console.log('📊 [GENERATE-QUESTIONS] Input:', { 
      task_id,
      transcript_length: transcript.length,
      plan_questions: question_plan.questions.length,
      target_points: question_plan.total_points
    });
    
    // Create detailed instructions for each planned question
    const questionInstructions = question_plan.questions.map((planItem: any) => 
      `Question ${planItem.question_number}: ${planItem.type} (${planItem.points} points) - ${planItem.rationale}`
    ).join('\n');
    
    const { object: result } = await generateObject({
      model,
      schema: QuestionsResponseSchema,
      system: [
        'You are a listening comprehension question generator.',
        'Generate questions based STRICTLY on the provided transcript and question plan.',
        '',
        'CRITICAL RULES:',
        '- Follow the EXACT question plan (number, type, points) provided',
        '- Create questions ONLY from content in the transcript',
        '- Each question must be appropriate for the specified CEFR level',
        '- Provide clear, unambiguous correct answers',
        '- Write helpful explanations that reference the transcript',
        '',
        'QUESTION TYPE GUIDELINES:',
        '- Multiple Choice: 4 options, only one correct, plausible distractors',
        '- True/False: Clear statements that can be definitively verified from transcript',
        '- Short Answer: Expect 1-3 word responses that are clearly stated in transcript',
        '- Matching: 3-4 pairs, create logical connections from transcript content',
        '- Sentence Reordering: 3-5 sentences that appear in transcript in specific order',
        '- Fill in Blanks: Use actual phrases from transcript, 1-2 blanks per question',
        '',
        'LANGUAGE REQUIREMENTS:',
        `- Questions in ${language}`,
        `- CEFR Level: ${level}`,
        '- Use vocabulary and grammar appropriate for the level',
      ].join('\n'),
      prompt: [
        `Generate listening comprehension questions following this exact plan:`,
        '',
        questionInstructions,
        '',
        `Topic: ${topic || 'General conversation'}`,
        `Language: ${language}`,
        `Level: ${level}`,
        `Target Total Points: ${question_plan.total_points}`,
        '',
        'TRANSCRIPT:',
        transcript,
        '',
        'Generate exactly the questions specified in the plan above.',
      ].join('\n'),
    });
    
    console.log('✅ [GENERATE-QUESTIONS] Questions generated:', {
      total_questions: result.questions.length,
      computed_total: result.validation.computed_total,
      points_match: result.validation.points_match
    });
    
    // Validate the results match the plan
    if (!result.validation.points_match) {
      console.error('❌ [GENERATE-QUESTIONS] Point validation failed!');
      return NextResponse.json({
        error: 'Generated questions do not match target points',
        validation: result.validation,
        generated: result
      }, { status: 400 });
    }
    
    // Save to database
    try {
      console.log('💾 [GENERATE-QUESTIONS] Saving to database...');
      
      // Prepare rows for database insertion
      const rows = result.questions.map((q: any) => ({
        task_id,
        question_number: q.question_number,
        question_type: q.type,
        points: q.points,
        metadata: { explanation: q.explanation },
        body: q as Record<string, any>,
        answer: q.correct_answer ?? null
      }));
      
      const { data, error } = await supabase
        .from('task_questions')
        .insert(rows)
        .select('id');
      
      if (error) {
        console.error('❌ [GENERATE-QUESTIONS] Database error:', error);
        return NextResponse.json({
          error: 'Failed to save questions to database',
          details: error.message,
          generated_questions: result.questions.length,
          total_points: result.validation.computed_total,
          validation: result.validation,
          questions_summary: result.questions.map((q: any) => ({
            question_number: q.question_number,
            type: q.type,
            points: q.points,
            question: q.question.substring(0, 100) + '...'
          }))
        }, { status: 500 });
      }
      
      console.log('✅ [GENERATE-QUESTIONS] Saved to database:', data?.length, 'questions');
      
      return NextResponse.json({
        success: true,
        task_id,
        generated_questions: result.questions.length,
        total_points: result.validation.computed_total,
        validation: result.validation,
        questions_summary: result.questions.map((q: any) => ({
          question_number: q.question_number,
          type: q.type,
          points: q.points,
          question: q.question.substring(0, 100) + '...'
        })),
        database_records: data?.length || 0,
      });
      
    } catch (dbError) {
      console.error('💥 [GENERATE-QUESTIONS] Database insertion error:', dbError);
      return NextResponse.json({
        error: 'Database insertion failed',
        details: (dbError as Error).message,
        generated_questions: result // Still return the generated questions
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('💥 [GENERATE-QUESTIONS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions', details: (error as Error).message },
      { status: 500 }
    );
  }
}