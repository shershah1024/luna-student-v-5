// app/api/evaluate-verb-conjugation/route.ts
// AI-powered evaluation endpoint for verb conjugation questions

import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';

// Initialize Azure OpenAI
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});
const model = azure('o4-mini');

// Schema for evaluation request
const EvaluationRequestSchema = z.object({
  userAnswer: z.string(),
  correctAnswer: z.string(),
  verb: z.string(), // Base form of verb
  tense: z.string(), // e.g., "present perfect", "past continuous"
  subject: z.string(), // e.g., "he", "they", "the students"
  sentenceContext: z.string().optional(), // Optional context sentence
  grammarRule: z.string().optional(),
  maxPoints: z.number().default(1),
});

// Schema for structured output from OpenAI
const EvaluationResultSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number(),
  isCorrect: z.boolean(),
  feedback: z.string(),
  explanation: z.string().optional(),
  spellingNote: z.string().optional(), // Note about spelling variations
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = EvaluationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      userAnswer,
      correctAnswer,
      verb,
      tense,
      subject,
      sentenceContext,
      grammarRule,
      maxPoints
    } = validationResult.data;

    console.log(`[EVALUATE-VERB-CONJUGATION] Evaluating verb conjugation answer`);

    // Build evaluation prompt for verb conjugation
    const systemPrompt = `You are an expert language teacher evaluating verb conjugation exercises.
    Be fair but accurate. Accept minor spelling variations if phonetically similar.
    Focus on whether the verb is correctly conjugated for the given tense and subject.`;

    const evaluationPrompt = `
    The student was asked to conjugate a verb:

    Verb (base form): ${verb}
    Tense: ${tense}
    Subject: ${subject}
    ${sentenceContext ? `Context sentence: ${sentenceContext}` : ''}

    Correct conjugation: ${correctAnswer}
    Student's answer: ${userAnswer}

    Evaluate if the conjugation is correct for the given tense and subject.
    Accept minor spelling variations if the answer is phonetically similar and clearly shows understanding.
    For example, accept common spelling mistakes that don't change the grammatical form.

    Maximum points: ${maxPoints}

    Provide:
    1. A score (0 or ${maxPoints})
    2. Whether it's correct
    3. Brief feedback for the student
    4. Note any spelling variations you accepted`;

    // Call Azure OpenAI for evaluation using generateObject
    const { object: result } = await generateObject({
      model,
      schema: EvaluationResultSchema,
      schemaName: 'VerbConjugationEvaluation',
      schemaDescription: 'Evaluation result for verb conjugation answer',
      system: systemPrompt,
      prompt: evaluationPrompt,
      temperature: 0.3, // Lower temperature for more consistent evaluation
    });

    if (!result) {
      throw new Error('Failed to generate evaluation result');
    }

    console.log(`[EVALUATE-VERB-CONJUGATION] Evaluation complete:`, {
      score: result.score,
      maxScore: result.maxScore,
      isCorrect: result.isCorrect
    });

    return NextResponse.json({
      success: true,
      evaluation: result
    });

  } catch (error) {
    console.error('[EVALUATE-VERB-CONJUGATION] Error:', error);

    // Provide a default evaluation on error
    return NextResponse.json({
      success: false,
      evaluation: {
        score: 0,
        maxScore: 1,
        isCorrect: false,
        feedback: 'Unable to evaluate your answer at this time. Please try again.',
        explanation: error instanceof Error ? error.message : 'Evaluation error'
      }
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}