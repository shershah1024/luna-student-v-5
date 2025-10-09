import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = "force-dynamic";
export const maxDuration = 300;
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

// Define schema for the AI response
const AnswerEvaluationSchema = z.object({
  evaluations: z.array(z.object({
    question_number: z.number().describe('The question number'),
    is_correct: z.boolean().describe('Whether the answer is correct'),
    score: z.number().describe('Score for this answer (1 for correct, 0 for incorrect)'),
    explanation: z.string().describe('Brief explanation of why this score was given')
  })),
  total_score: z.number().describe('The total score for all answers combined'),
  max_total_score: z.number().describe('The maximum possible total score for all answers combined'),
  summary: z.string().describe('A brief summary of the overall evaluation')
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[Writing Section1 Score] Processing request');

  try {
    // Parse request body
    const { question_data, answers, test_id } = await req.json();
    
    // Authenticate user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate required data
    if (!question_data || !answers || !test_id) {
      return NextResponse.json(
        { error: 'Missing required data' }, 
        { status: 400 }
      );
    }
    
    // Parse the data if needed
    const questions = typeof question_data === 'string' 
      ? JSON.parse(question_data) 
      : question_data;
    
    const userAnswers = typeof answers === 'string'
      ? JSON.parse(answers)
      : answers;
    
    // First, save the answers to the database to ensure we don't lose them
    try {
      const answersData = {
        user_id: userId,
        test_id,
        course: 'goethe_a1',
        section: 1, // Section 1 for writing
        task_type: 'form',
        response: JSON.stringify(userAnswers)
      };
      
      await supabase.from('writing_scores').insert(answersData);
    } catch (saveError) {
      console.error('[Writing Section1 Score] Error saving answers:', saveError);
      // Continue with evaluation even if saving fails
    }
    
    // Prepare data for AI evaluation
    const fieldsWithAnswers = questions.fields.map((field: any) => {
      const userAnswer = userAnswers[field.id_for_antwortbogen] || '';
      return {
        ...field,
        user_answer: userAnswer
      };
    });
    
    // Use AI to evaluate if the answers are correct
    console.log('[Writing Section1 Score] Preparing AI evaluation of answers');
    
    // Create a detailed prompt for the AI
    const prompt = `You are an expert German language evaluator for the Goethe A1 exam. Evaluate the following answers for a Section 1 writing exercise.

    Exercise Title: ${questions.title}
    
    ${questions.instructions_text ? `Instructions: ${questions.instructions_text.join('\n')}\n` : ''}
    ${questions.context_text ? `Context: ${questions.context_text}\n` : ''}
    
    For each question below, determine if the user's answer is correct. Consider the following:
    1. For fields with an expected answer, check if the user's answer matches or is semantically equivalent
    2. For single-choice questions, check if the selected option is correct
    3. For open-ended fields, evaluate if the answer is appropriate and relevant
    4. Be lenient with minor spelling errors, capitalization, or formatting differences
    
    IMPORTANT: All explanations and reasoning must be provided in English only. Do not use any German in your explanations.
    
    Questions and Answers:
    ${fieldsWithAnswers.filter((f: any) => f.is_blank).map((field: any, index: number) => {
      const expectedAnswer = field.correct_answer !== undefined ? 
        `Expected Answer: "${field.correct_answer}"` : 
        'Open-ended question (no specific expected answer)';
      
      return `Question ${index + 1}: ${field.label || 'Fill in the blank'}
      Type: ${field.type}
      User's Answer: "${field.user_answer || ''}"\n      ${expectedAnswer}\n`;
    }).join('\n')}
    
    For each question, provide:
    1. Whether the answer is correct (true/false)
    2. A score (1 for correct, 0 for incorrect)
    3. A brief explanation of your evaluation in English only
    
    Also provide the total score, maximum possible score, and a brief summary of the overall evaluation.
    
    Remember: All explanations, feedback, and reasoning must be in English, even when discussing German language concepts.`;
    
    console.log('[Writing Section1 Score] Sending prompt to AI model for evaluation');
    
    // Get AI evaluation
    const startEvalTime = Date.now();
    const { object: evaluation } = await generateObject({
      model: model,
      schema: AnswerEvaluationSchema,
      prompt: prompt,
    });
    
    const evalDuration = Date.now() - startEvalTime;
    console.log('[Writing Section1 Score] Received evaluation from AI model after', evalDuration, 'ms');
    console.log('[Writing Section1 Score] AI Evaluation response:', JSON.stringify(evaluation, null, 2));
    
    // Format the explanation from the AI evaluations
    const explanations = evaluation.evaluations.map((evalItem) => 
      `Q${evalItem.question_number}: ${evalItem.score} (${evalItem.explanation})`
    );
    
    // Create a simplified evaluation object that matches our expected format
    const formattedEvaluation = {
      score: evaluation.total_score,
      max_score: evaluation.max_total_score,
      explanation: explanations.join(', '),
      total_score: evaluation.total_score,
      max_total_score: evaluation.max_total_score,
      summary: evaluation.summary
    };
    
    console.log('[Writing Section1 Score] Formatted evaluation:', JSON.stringify(formattedEvaluation, null, 2));
    
    // Save the score to the database
    try {
      const scoreData = {
        score: evaluation.total_score,
        total_score: evaluation.max_total_score,
        evaluation_data: {
          evaluations: evaluation.evaluations,
          summary: evaluation.summary,
          explanation: formattedEvaluation.explanation
        }
      };
      
      // Update the record we just inserted with the evaluation results
      await supabase
        .from('writing_scores')
        .update(scoreData)
        .eq('user_id', userId)
        .eq('test_id', test_id)
        .eq('course', 'goethe_a1')
        .eq('section', 1);
    } catch (scoreError) {
      console.error('[Writing Section1 Score] Error saving score:', scoreError);
      // Continue with returning the evaluation even if saving fails
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('[Writing Section1 Score] Total processing time:', totalDuration, 'ms');
    
    // Return the evaluation results
    return NextResponse.json({
      score: evaluation.total_score,
      max_score: evaluation.max_total_score,
      explanation: formattedEvaluation.explanation, // Use the formatted explanation
      summary: evaluation.summary,
      percentage: evaluation.max_total_score > 0 
        ? Math.round((evaluation.total_score / evaluation.max_total_score) * 100) 
        : 0
    });
    
  } catch (error) {
    console.error('Error processing section 1 writing score request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
