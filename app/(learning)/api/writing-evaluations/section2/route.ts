import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';


export const dynamic = "force-dynamic";
export const maxDuration = 300;
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

const GrammarErrorSchema = z.object({
  error: z.string().describe('The incorrect text or phrase from the text'),
  correction: z.string().describe('The corrected version'),
  explanation: z.string().describe('Brief explanation of the grammar rule or reason for correction')
});

const TELCA1Section2EvaluationSchema = z.object({
  overall_evaluation: z.string().describe('Summarize the writing performance according to TELC A1 Section 2 assessment criteria. Focus on basic communicative writing competency.'),
  aufgabenerfuellung_score: z.number().describe('Task completion score: 3 = fully completed and comprehensible, 1.5 = partially completed due to linguistic/content deficiencies, 0 = not completed and/or incomprehensible'),
  aufgabenerfuellung_feedback: z.string().describe('Detailed feedback on task completion'),
  kommunikative_gestaltung_score: z.number().describe('Communicative design score: 1 = text type appropriate, 0.5 = atypical or missing phrases, 0 = no text-type specific phrases'),
  kommunikative_gestaltung_feedback: z.string().describe('Detailed feedback on communicative text design'),
  grammar_errors: z.array(GrammarErrorSchema).describe('List of specific grammar errors found in the text with corrections and explanations'),
  total_score: z.number().describe('The total score (aufgabenerfuellung + kommunikative_gestaltung)'),
  max_total_score: z.number().describe('Maximum possible score (4 points for Section 2)'),
  final_feedback: z.string().describe('Constructive feedback for improvement, addressing the learner directly'),
  section_type: z.number().describe('Should be 2 for Section 2'),
});

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[TELC A1 Section 2 Evaluation] Received request at', new Date().toISOString());

  try {
    const requestBody = await req.json();
    const { question_data, learner_response, test_id: bodyTestId } = requestBody;

    // Authenticate user
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[TELC A1 Section 2 Evaluation] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const test_id = req.nextUrl.searchParams.get('test_id') || bodyTestId || null;
    console.log('[TELC A1 Section 2 Evaluation] Authenticated user', { userId, test_id });
    
    // Validate required data
    if (!question_data || !learner_response) {
      console.error('[TELC A1 Section 2 Evaluation] Validation failed');
      throw new Error('Missing required data');
    }
    
    // Save the response to the database first
    try {
      // Save response to writing_scores table with the new standardized structure
      const respData = {
        user_id: userId,
        test_id,
        course: 'telc_a1',
        section: 2,
        task_type: 'message',
        prompt: question_data,
        response: learner_response
      };
      
      const { error: respError } = await supabase.from('writing_scores').insert(respData);
      
      if (respError) {
        console.error('[TELC A1 Section 2 Evaluation] Error saving response data:', respError);
        throw new Error(`Failed to save response data: ${respError.message}`);
      }
      
      console.log('[TELC A1 Section 2 Evaluation] Successfully saved response data');
    } catch (dbError) {
      console.error('[TELC A1 Section 2 Evaluation] Database error when saving response:', dbError);
      // Continue with evaluation even if saving response fails
    }

    const prompt = `You are an expert TELC A1 German examiner. Evaluate the following Section 2 writing task according to the official TELC A1 assessment criteria. Address the student directly as a teacher.

    TELC A1 SECTION 2 EVALUATION CRITERIA (Basic Level - Short Message):

    1. ERFÜLLUNG DER AUFGABENSTELLUNG (Task Completion - max 3 points):
    - 3 points: Task fully completed and comprehensible
    - 1.5 points: Task partially completed due to linguistic and content deficiencies
    - 0 points: Task not completed and/or incomprehensible

    2. KOMMUNIKATIVE GESTALTUNG DES TEXTS (Communicative Text Design - max 1 point):
    - 1 point: Text type appropriate
    - 0.5 points: Atypical or missing phrases, e.g., no greeting
    - 0 points: No text-type specific phrases

    SCORING SYSTEM:
    - Maximum total: 4 points (3 + 1)
    - This contributes to the overall 10-point writing assessment
    - Focus on basic communicative competency at A1 level

    A1 LEVEL EXPECTATIONS:
    - Very basic writing skills
    - Simple everyday vocabulary
    - Basic sentence structures
    - Essential communicative functions (greeting, asking, informing)
    - Text type awareness (message, note, postcard, etc.)
    - Comprehensibility more important than grammatical accuracy

    EVALUATION FOCUS:
    - Can the learner communicate basic information effectively?
    - Does the text fulfill the communicative purpose?
    - Are appropriate text conventions used (greeting, closing, etc.)?
    - Is the message comprehensible despite errors?

    IMPORTANT: All explanations and feedback must be in English only.

    Question Data: ${question_data}

    Learner's Response:
    ${learner_response}`;

    console.log('[TELC A1 Section 2 Evaluation] Sending prompt to AI model for evaluation');
    
    const startEvalTime = Date.now();
    const { object: evaluation } = await generateObject({
      model: model,
      schema: TELCA1Section2EvaluationSchema,
      prompt: prompt,
      temperature: 0.7
    });
    
    const evalDuration = Date.now() - startEvalTime;
    console.log('[TELC A1 Section 2 Evaluation] Received evaluation from AI model after', evalDuration, 'ms');
    
    // Calculate total score
    evaluation.total_score = evaluation.aufgabenerfuellung_score + evaluation.kommunikative_gestaltung_score;
    evaluation.max_total_score = 4; // 3 + 1
    evaluation.section_type = 2;
    
    // Update the evaluation data to the writing_scores table
    try {
      const evalData = {
        score: evaluation.total_score,
        total_score: evaluation.max_total_score,
        evaluation_data: {
          aufgabenerfuellung_score: evaluation.aufgabenerfuellung_score,
          aufgabenerfuellung_feedback: evaluation.aufgabenerfuellung_feedback,
          kommunikative_gestaltung_score: evaluation.kommunikative_gestaltung_score,
          kommunikative_gestaltung_feedback: evaluation.kommunikative_gestaltung_feedback,
          grammar_errors: evaluation.grammar_errors,
          overall_evaluation: evaluation.overall_evaluation,
          final_feedback: evaluation.final_feedback
        }
      };
      
      // Update the record we just inserted with the evaluation results
      const { error: evalError } = await supabase
        .from('writing_scores')
        .update(evalData)
        .eq('user_id', userId)
        .eq('test_id', test_id)
        .eq('course', 'telc_a1')
        .eq('section', 2);
      
      if (evalError) {
        console.error('[TELC A1 Section 2 Evaluation] Error updating evaluation data:', evalError);
      }
    } catch (evalDbError) {
      console.error('[TELC A1 Section 2 Evaluation] Database error when saving evaluation:', evalDbError);
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('[TELC A1 Section 2 Evaluation] Total processing time:', totalDuration, 'ms');

    return NextResponse.json(evaluation);
  } catch (error) {
    const errorType = error instanceof Error ? error.constructor.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[TELC A1 Section 2 Evaluation] Process failed', { errorType, errorMessage });
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: errorMessage,
        type: errorType
      }, 
      { status: 500 }
    );
  }
}