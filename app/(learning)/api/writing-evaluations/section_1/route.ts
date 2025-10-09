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

// TELC A1 Section 1 Evaluation Schema - Simple binary scoring (+/-)
const TELCA1Section1EvaluationSchema = z.object({
  // Simple field-by-field evaluation
  field_evaluations: z.array(z.object({
    field_name: z.string().describe('Name of the form field'),
    is_correct: z.boolean().describe('True if field is correctly filled (+), false if incorrect (-)'),
    user_answer: z.string().describe('What the user wrote'),
    explanation: z.string().describe('Brief explanation in English why it is correct or incorrect for A1 learners')
  })).describe('Evaluation of each form field'),
  
  // Summary scores
  correct_fields: z.number().describe('Number of fields marked with (+)'),
  total_fields: z.number().describe('Total number of form fields evaluated'),
  
  // Overall evaluation in English
  overall_evaluation: z.string().describe('Overall evaluation explanation in English for A1 learners'),
  
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

    const prompt = `You are an expert TELC A1 German examiner. Evaluate the following Section 1 form completion according to the OFFICIAL TELC A1 assessment criteria.

    OFFICIAL TELC A1 BEWERTUNG DER SCHRIFTLICHEN PRÜFUNG - SCHREIBEN, TEIL 1:

    Die Bewerterinnen oder Bewerter überprüfen die Einträge und kennzeichnen sie mit (+) für richtig und mit (−) für falsch auf dem Antwortbogen S30. Rechtschreibfehler sind für die Erfüllung der Aufgabe in der Regel nicht relevant. Bei der Lösung „Donnerstag" sind Teilnehmerleistungen wie „Donerstach" oder „donastag" zu akzeptieren.

    Bei Aufgaben mit Zahlen können nur eindeutig richtige Lösungen akzeptiert werden.

    EVALUATION INSTRUCTIONS:
    - ONLY evaluate fields that the learner was supposed to fill out (not prefilled fields)
    - Look at the question data to identify which fields have prefilled_value - do NOT evaluate these
    - Only evaluate fields where prefilled_value is null or empty - these are the user-fillable fields
    - Evaluate each user-fillable field individually with (+) for correct or (-) for incorrect
    - Spelling errors are generally NOT relevant - focus on comprehensibility and appropriateness
    - Accept variant spellings as long as the meaning is clear
    - For number fields, only clearly correct answers are acceptable
    - Each correctly filled user field = 1 point
    - Total score = number of (+) marks for user-fillable fields only
    - Provide explanations in English to help A1 learners understand their performance

    EVALUATION CRITERIA:
    - Is the information appropriate for the requested field type?
    - Is the answer comprehensible despite potential spelling errors?
    - Does the answer fulfill the basic requirement of the form field?

    IMPORTANT: 
    - Question Data contains the form structure including prefilled_value for each field
    - Learner Response contains what the user actually wrote in each field
    - Only evaluate fields where prefilled_value is null/empty in the question data

    Question Data: ${question_data}

    Learner's Response: ${learner_response}`;

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
        score: evaluation.correct_fields,
        total_score: evaluation.total_fields,
        evaluation_data: {
          field_evaluations: evaluation.field_evaluations,
          correct_fields: evaluation.correct_fields,
          total_fields: evaluation.total_fields,
          overall_evaluation: evaluation.overall_evaluation,
          section_type: evaluation.section_type
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