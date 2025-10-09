// app/api/evaluate-sentence-transformation/route.ts
// AI-powered evaluation endpoint for sentence transformation questions

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

// Schema for evaluation request (simplified for sentence transformation only)
const EvaluationRequestSchema = z.object({
  userAnswer: z.string(),
  correctAnswer: z.string(),
  acceptableVariations: z.array(z.string()).optional(),
  originalSentence: z.string(),
  instruction: z.string(),
  grammarRule: z.string().optional(),
  maxPoints: z.number().default(2),
});

// Schema for structured output from OpenAI
const EvaluationResultSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number(),
  isCorrect: z.boolean(),
  feedback: z.string(),
  explanation: z.string().optional(),
  corrections: z.array(z.object({
    error: z.string(),
    correction: z.string(),
  })).optional(),
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
      acceptableVariations,
      originalSentence,
      instruction,
      grammarRule,
      maxPoints
    } = validationResult.data;

    console.log(`[EVALUATE-SENTENCE-TRANSFORMATION] Evaluating sentence transformation answer`);

    // Build evaluation prompt for sentence transformation
    const systemPrompt = `You are an expert language teacher evaluating sentence transformation exercises.
    Be fair but accurate. Give partial credit when appropriate.
    Focus on whether the grammar point being tested is correctly applied.`;

    const evaluationPrompt = `
    The student was asked to transform a sentence according to these instructions:

    Original sentence: ${originalSentence}
    Instruction: ${instruction || 'Transform the sentence as directed'}

    Expected answer: ${correctAnswer}
    ${acceptableVariations?.length ? `Also acceptable: ${acceptableVariations.join(', ')}` : ''}
    Student's answer: ${userAnswer}

    Evaluate if the transformation is grammatically correct and follows the instruction.
    Consider minor spelling differences or punctuation as acceptable if the grammar is correct.

    Maximum points: ${maxPoints}

    Provide:
    1. A score (0 to ${maxPoints}, can use decimals like 1.5)
    2. Whether it's correct (true if full points, false otherwise)
    3. Brief feedback for the student
    4. If there are errors, list specific corrections`;

    // Call Azure OpenAI for evaluation using generateObject
    const { object: result } = await generateObject({
      model,
      schema: EvaluationResultSchema,
      schemaName: 'SentenceTransformationEvaluation',
      schemaDescription: 'Evaluation result for sentence transformation answer',
      system: systemPrompt,
      prompt: evaluationPrompt,
      temperature: 0.3, // Lower temperature for more consistent evaluation
    });

    if (!result) {
      throw new Error('Failed to generate evaluation result');
    }

    console.log(`[EVALUATE-SENTENCE-TRANSFORMATION] Evaluation complete:`, {
      score: result.score,
      maxScore: result.maxScore,
      isCorrect: result.isCorrect
    });

    return NextResponse.json({
      success: true,
      evaluation: result
    });

  } catch (error) {
    console.error('[EVALUATE-SENTENCE-TRANSFORMATION] Error:', error);

    // Provide a default evaluation on error
    return NextResponse.json({
      success: false,
      evaluation: {
        score: 0,
        maxScore: 2,
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