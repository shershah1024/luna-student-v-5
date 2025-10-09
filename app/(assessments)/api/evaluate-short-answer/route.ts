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

const ShortAnswerEvaluationSchema = z.object({
  is_correct: z.boolean(),
  feedback: z.string().describe('Brief feedback explaining why the answer is correct or incorrect'),
  score: z.number().min(0).max(1).describe('Partial credit score from 0 to 1')
});

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const body = await req.json();
    console.log('Received short answer evaluation request:', {
      requestId,
      ...body
    });

    const { user_answer, correct_answer, question, context, assignmentId, userEmail } = body;

    // Validate required fields
    if (!user_answer || !correct_answer || !question || !assignmentId || !userEmail) {
      console.log('Missing required fields:', {
        requestId,
        user_answer: !!user_answer,
        correct_answer: !!correct_answer,
        question: !!question,
        assignmentId,
        userEmail
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `Evaluate this short answer response:

Question: "${question}"
Expected Answer: "${correct_answer}"
Student's Answer: "${user_answer}"
${context ? `Context: "${context}"` : ''}

As a language learning instructor, evaluate if the student's answer demonstrates correct understanding. Consider:

1. **Semantic Accuracy**: Does the answer convey the correct meaning?
2. **Language Level**: Accept answers appropriate for the student's level
3. **Alternative Phrasings**: Accept valid synonyms and alternative expressions
4. **Partial Credit**: Award partial credit for answers that are partially correct
5. **Minor Errors**: Don't penalize minor spelling or grammar mistakes if the meaning is clear

Scoring Guidelines:
- 1.0: Fully correct answer that demonstrates complete understanding
- 0.8-0.9: Mostly correct with minor issues that don't affect meaning
- 0.5-0.7: Partially correct, shows some understanding but missing key elements
- 0.2-0.4: Limited understanding, major issues but some correct elements
- 0.0-0.1: Incorrect or no understanding demonstrated

Provide encouraging, constructive feedback that helps the student learn.`;

    const { object: evaluation } = await generateObject({
      model: model,
      schema: ShortAnswerEvaluationSchema,
      prompt: prompt,
    });

    const response = {
      ...evaluation,
      requestId
    };

    console.log('Sending short answer evaluation response:', {
      requestId,
      is_correct: evaluation.is_correct,
      score: evaluation.score
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error evaluating short answer:', {
      error,
      requestId
    });
    return NextResponse.json(
      { error: 'Internal Server Error', requestId },
      { status: 500 }
    );
  }
}