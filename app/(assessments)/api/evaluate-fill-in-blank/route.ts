import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import crypto from 'crypto';


export const dynamic = "force-dynamic";
// Create Azure client
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

// Use the Azure model
const model = azure('gpt-5-nano');

const FillInTheBlankEvaluationSchema = z.object({
  is_correct: z.boolean()
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const body = await req.json();
    console.log('Received request:', {
      requestId,
      ...body
    });

    const { user_answer, correct_answer, answer_explanation, assignmentId, userEmail } = body;

    // Validate required fields
    if (!user_answer || !correct_answer || !assignmentId || !userEmail) {
      console.log('Missing required fields:', {
        requestId,
        user_answer,
        correct_answer,
        assignmentId,
        userEmail
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `Evaluate this fill-in-the-blank answer:

Correct Answer: "${correct_answer}"
User's Answer: "${user_answer}"
Answer Explanation: "${answer_explanation}"

Consider:
1. The meaning and intent of the answer
2. Alternative correct phrasings
3. Whether the answer demonstrates understanding of the concept

Respond with a JSON object containing only:
is_correct: Boolean indicating if the answer demonstrates correct understanding`;

    const { object: evaluation } = await generateObject({
      model: model,
      schema: FillInTheBlankEvaluationSchema,
      prompt: prompt,
    });

    const response = {
      ...evaluation,
      requestId
    };

    console.log('Sending response:', {
      requestId,
      response
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error evaluating fill-in-the-blank answer:', {
      error,
      requestId
    });
    return NextResponse.json(
      { error: 'Internal Server Error', requestId },
      { status: 500 }
    );
  }
} 