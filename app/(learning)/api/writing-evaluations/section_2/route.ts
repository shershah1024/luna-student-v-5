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
  grammar_category: z.enum([
    "ARTICLES", 
    "NOUN_CASES", 
    "VERB_CONJUGATION", 
    "VERB_POSITION", 
    "ADJECTIVE_ENDINGS", 
    "PRONOUN_CASES", 
    "CAPITALIZATION", 
    "SPELLING", 
    "WORD_ORDER", 
    "PREPOSITIONS", 
    "PLURAL_FORMS", 
    "GENDER_AGREEMENT", 
    "SEPARABLE_VERBS", 
    "MODAL_VERBS", 
    "SENTENCE_STRUCTURE", 
    "PUNCTUATION"
  ]).describe('The standardized German grammar category of the error'),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).describe('How serious this error is for A1 level communication'),
  explanation: z.string().describe('Brief explanation of the grammar rule or reason for correction')
});

// TELC A1 Section 2 Official Evaluation Schema - Complex rubric for writing tasks
const TELCA1Section2EvaluationSchema = z.object({
  // Erfüllung der Aufgabenstellung (Task Fulfillment) - 0-3 points
  task_fulfillment_points: z.number().min(0).max(3).describe('Points for task fulfillment (0-3): 3=fully completed and comprehensible, 1.5=partially completed due to linguistic/content issues, 0=not completed/incomprehensible'),
  task_fulfillment_description: z.string().describe('Explanation of task fulfillment scoring in English for A1 learners'),
  
  // Kommunikative Gestaltung des Texts (Communicative Design) - 0-1 points  
  communicative_design_points: z.number().min(0).max(1).describe('Points for communicative text design (0-1): 1=appropriate to text type, 0.5=untypical or missing elements, 0=no text-type-specific elements'),
  communicative_design_description: z.string().describe('Explanation of communicative design scoring in English for A1 learners'),
  
  // Grammar errors for learning purposes (not part of TELC scoring)
  grammar_errors: z.array(GrammarErrorSchema).describe('List of specific grammar errors found in the text with corrections and explanations for learning purposes'),
  
  // Total score calculation (max 4 for Section 2, contributes to overall 10 points)
  total_points: z.number().min(0).max(4).describe('Total points awarded for Section 2 (max 4)'),
  
  // Overall evaluation text in English
  overall_evaluation: z.string().describe('Overall evaluation explanation in English for A1 learners'),
  
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

    const prompt = `You are an expert TELC A1 German examiner. Evaluate the following Section 2 writing task according to the OFFICIAL TELC A1 assessment criteria.

    OFFICIAL TELC A1 BEWERTUNG DER SCHRIFTLICHEN PRÜFUNG - SCHREIBEN, TEIL 2:

    Die Bewerterin oder der Bewerter bewertet die Teilnehmerleistungen auf dem Antwortbogen S30 nach folgenden Kriterien:

    1. ERFÜLLUNG DER AUFGABENSTELLUNG (pro Inhaltspunkt) - MAX 3 PUNKTE:
    - 3 Punkte: Aufgabe voll erfüllt und verständlich
    - 1,5 Punkte: Aufgabe wegen sprachlicher und inhaltlicher Mängel nur teilweise erfüllt
    - 0 Punkte: Aufgabe nicht erfüllt und/oder unverständlich

    2. KOMMUNIKATIVE GESTALTUNG DES TEXTS (KG) - MAX 1 PUNKT:
    - 1 Punkt: der Textsorte angemessen
    - 0,5 Punkte: untypische oder fehlende Wendungen, z.B. keine Anrede
    - 0 Punkte: keine textsortenspezifischen Wendungen

    Maximum: 4 Punkte für Teil 2 (trägt zu den insgesamt maximal 10 Punkten bei)

    EVALUATION INSTRUCTIONS:
    - Provide explanations in English to help A1 learners understand their performance
    - Evaluate based on A1 level expectations for basic writing competency
    - Focus on communicative success and text type appropriateness
    - Consider whether the learner can fulfill basic writing functions
    - Assess if the text serves its communicative purpose despite potential errors
    - Identify grammar/spelling errors for learning purposes (these don't affect the TELC score but help learning)

    A1 LEVEL CRITERIA:
    - Basic vocabulary and simple sentence structures
    - Essential communicative functions (greeting, informing, asking, etc.)
    - Text type awareness appropriate for everyday situations
    - Comprehensibility more important than perfect grammar

    Question Data: ${question_data}

    Learner's Response: ${learner_response}`;

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
    evaluation.total_points = evaluation.task_fulfillment_points + evaluation.communicative_design_points;
    evaluation.section_type = 2;
    
    // Update the evaluation data to the writing_scores table
    try {
      const evalData = {
        score: evaluation.total_points,
        total_score: 4, // TELC A1 Section 2 max score is 4
        evaluation_data: {
          task_fulfillment_points: evaluation.task_fulfillment_points,
          task_fulfillment_description: evaluation.task_fulfillment_description,
          communicative_design_points: evaluation.communicative_design_points,
          communicative_design_description: evaluation.communicative_design_description,
          grammar_errors: evaluation.grammar_errors,
          total_points: evaluation.total_points,
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