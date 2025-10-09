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
  error: z.string().describe('The incorrect text or phrase from the form'),
  correction: z.string().describe('The corrected version'),
  explanation: z.string().describe('Brief explanation of the grammar rule or reason for correction')
});

const TELCA1Section1EvaluationSchema = z.object({
  overall_evaluation: z.string().describe('Summarize the form completion performance according to TELC A1 Section 1 assessment criteria. Focus on basic form-filling competency.'),
  correct_answers: z.number().describe('Number of correctly filled form fields'),
  total_answers: z.number().describe('Total number of form fields that were attempted'),
  spelling_notes: z.string().describe('Notes about spelling variations that are acceptable (e.g., Donerstag for Donnerstag)'),
  grammar_errors: z.array(GrammarErrorSchema).describe('List of specific errors found in the form with corrections and explanations'),
  final_feedback: z.string().describe('Constructive feedback for improvement, addressing the learner directly'),
  section_type: z.number().describe('Should be 1 for Section 1'),
});

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[TELC A1 Section 1 Evaluation] Received request at', new Date().toISOString());

  try {
    const requestBody = await req.json();
    const { question_data, learner_response, test_id: bodyTestId } = requestBody;

    // Authenticate user
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[TELC A1 Section 1 Evaluation] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const test_id = req.nextUrl.searchParams.get('test_id') || bodyTestId || null;
    console.log('[TELC A1 Section 1 Evaluation] Authenticated user', { userId, test_id });
    
    // Validate required data
    if (!question_data || !learner_response) {
      console.error('[TELC A1 Section 1 Evaluation] Validation failed');
      throw new Error('Missing required data');
    }
    
    // Save the response to the database first
    try {
      // Save response to writing_scores table with the new standardized structure
      const respData = {
        user_id: userId,
        test_id,
        course: 'telc_a1',
        section: 1,
        task_type: 'form',
        prompt: question_data,
        response: learner_response
      };
      
      const { error: respError } = await supabase.from('writing_scores').insert(respData);
      
      if (respError) {
        console.error('[TELC A1 Section 1 Evaluation] Error saving response data:', respError);
        throw new Error(`Failed to save response data: ${respError.message}`);
      }
      
      console.log('[TELC A1 Section 1 Evaluation] Successfully saved response data');
    } catch (dbError) {
      console.error('[TELC A1 Section 1 Evaluation] Database error when saving response:', dbError);
      // Continue with evaluation even if saving response fails
    }

    const prompt = `You are an expert TELC A1 German examiner. Evaluate the following Section 1 form completion according to the official TELC A1 assessment criteria. Address the student directly as a teacher.

    TELC A1 SECTION 1 EVALUATION CRITERIA (Basic Level - Form Completion):

    ASSESSMENT APPROACH:
    - Evaluators check entries and mark them with (+) for correct and (-) for incorrect on answer sheet S30
    - Spelling errors are generally NOT relevant for task completion
    - For "Donnerstag" solutions, participant responses like "Donerstag" or "donastag" are acceptable
    - For tasks with numbers, only clearly correct solutions can be accepted

    EVALUATION FOCUS:
    - Can the learner provide basic personal information in form fields?
    - Are the responses appropriate for each form field?
    - Is the information comprehensible despite minor spelling errors?
    - Does the learner understand what information is being requested?

    A1 LEVEL EXPECTATIONS:
    - Very basic form completion skills
    - Simple personal information (name, age, address, etc.)
    - Basic vocabulary for everyday contexts
    - Spelling variations acceptable as long as meaning is clear
    - Focus on communicative success rather than perfect accuracy

    IMPORTANT: All explanations and feedback must be in English only.

    Question Data: ${question_data}

    Learner's Response:
    ${learner_response}`;

    console.log('[TELC A1 Section 1 Evaluation] Sending prompt to AI model for evaluation');
    
    const startEvalTime = Date.now();
    const { object: evaluation } = await generateObject({
      model: model,
      schema: TELCA1Section1EvaluationSchema,
      prompt: prompt,
      temperature: 0.7
    });
    
    const evalDuration = Date.now() - startEvalTime;
    console.log('[TELC A1 Section 1 Evaluation] Received evaluation from AI model after', evalDuration, 'ms');
    
    evaluation.section_type = 1;
    
    // Update the evaluation data to the writing_scores table
    try {
      const evalData = {
        score: evaluation.correct_answers,
        total_score: evaluation.total_answers,
        evaluation_data: {
          correct_answers: evaluation.correct_answers,
          total_answers: evaluation.total_answers,
          spelling_notes: evaluation.spelling_notes,
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
        .eq('section', 1);
      
      if (evalError) {
        console.error('[TELC A1 Section 1 Evaluation] Error updating evaluation data:', evalError);
      }
    } catch (evalDbError) {
      console.error('[TELC A1 Section 1 Evaluation] Database error when saving evaluation:', evalDbError);
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('[TELC A1 Section 1 Evaluation] Total processing time:', totalDuration, 'ms');

    return NextResponse.json(evaluation);
  } catch (error) {
    const errorType = error instanceof Error ? error.constructor.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[TELC A1 Section 1 Evaluation] Process failed', { errorType, errorMessage });
    
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