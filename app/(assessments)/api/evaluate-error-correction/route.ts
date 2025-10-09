// app/api/evaluate-error-correction/route.ts
// AI-powered evaluation endpoint for error correction questions

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
  originalSentence: z.string(), // Sentence with errors
  errorsCount: z.number().optional(),
  errorPositions: z.array(z.object({
    incorrect: z.string(),
    correct: z.string(),
    position: z.string().optional(),
  })).optional(),
  grammarRule: z.string().optional(),
  maxPoints: z.number().default(3),
});

// Schema for structured output from OpenAI
const EvaluationResultSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number(),
  isCorrect: z.boolean(),
  feedback: z.string(),
  explanation: z.string().optional(),
  missedErrors: z.array(z.object({
    error: z.string(),
    correction: z.string(),
  })).optional(),
  incorrectCorrections: z.array(z.object({
    attempted: z.string(),
    correct: z.string(),
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
      originalSentence,
      errorsCount,
      errorPositions,
      grammarRule,
      maxPoints
    } = validationResult.data;

    console.log(`[EVALUATE-ERROR-CORRECTION] Evaluating error correction answer`);

    // Build evaluation prompt for error correction
    const systemPrompt = `You are an expert language teacher evaluating error correction exercises.
    Be fair but accurate. Give partial credit when appropriate based on errors identified and corrected.
    Focus on whether grammatical errors were correctly identified and fixed.`;

    const evaluationPrompt = `
    The student was asked to correct grammatical errors in this sentence:

    Original sentence with errors: ${originalSentence}
    ${errorsCount ? `Number of errors to find: ${errorsCount}` : ''}

    Correct sentence: ${correctAnswer}
    Student's corrected sentence: ${userAnswer}

    Evaluate if the student:
    1. Identified all grammatical errors
    2. Corrected them appropriately
    3. Didn't introduce new errors

    Give partial credit if some errors were correctly fixed even if not all were found.

    Maximum points: ${maxPoints}

    Provide:
    1. A score (0 to ${maxPoints}, can use decimals)
    2. Whether it's fully correct (true only if all errors fixed)
    3. Brief feedback for the student
    4. List any missed errors or incorrect corrections`;

    // Call Azure OpenAI for evaluation using generateObject
    const { object: result } = await generateObject({
      model,
      schema: EvaluationResultSchema,
      schemaName: 'ErrorCorrectionEvaluation',
      schemaDescription: 'Evaluation result for error correction answer',
      system: systemPrompt,
      prompt: evaluationPrompt,
      temperature: 0.3, // Lower temperature for more consistent evaluation
    });

    if (!result) {
      throw new Error('Failed to generate evaluation result');
    }

    console.log(`[EVALUATE-ERROR-CORRECTION] Evaluation complete:`, {
      score: result.score,
      maxScore: result.maxScore,
      isCorrect: result.isCorrect
    });

    return NextResponse.json({
      success: true,
      evaluation: result
    });

  } catch (error) {
    console.error('[EVALUATE-ERROR-CORRECTION] Error:', error);

    // Provide a default evaluation on error
    return NextResponse.json({
      success: false,
      evaluation: {
        score: 0,
        maxScore: 3,
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