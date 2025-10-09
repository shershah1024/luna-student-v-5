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

const model = azure('gpt-5-chat');

const GrammarErrorSchema = z.object({
  error: z.string().describe('The incorrect text or phrase from the essay'),
  correction: z.string().describe('The corrected version'),
  explanation: z.string().describe('Brief explanation of the grammar rule or reason for correction')
});

const CategoryEvaluationSchema = z.object({
  score: z.number().describe('Score for this category, following the Goethe A1 writing assessment criteria.'),
  max_score: z.number(),
  comment: z.string().describe('Detailed explanation referencing the assessment criteria and candidate performance.'),
  examples: z.array(z.string()).describe('Examples from the essay that justify the score.'),
  final_comment: z.string().describe('Constructive feedback for improvement, addressing the learner directly.'),
});

const EssayEvaluationSchema = z.object({
  overall_evaluation: z.string().describe('Summarize the essay performance according to Goethe A1 writing assessment criteria. Provide detailed constructive feedback.'),
  parameter_evaluations: z.object({
    task_completion: CategoryEvaluationSchema,
    communicative_design: CategoryEvaluationSchema,
  }),
  grammar_errors: z.array(GrammarErrorSchema).describe('List of specific grammar errors found in the text with corrections and explanations'),
  total_score: z.number().describe('The total score for the essay, calculated as the sum of all category scores'),
  max_total_score: z.number(),
  score_breakdown: z.object({
    content_points: z.array(z.number()).describe('Array of scores for each content point (e.g., [3, 1.5, 0])'),
    communicative_design: z.number().describe('Score for communicative design (1, 0.5, or 0)'),
  }).describe('Structured score breakdown showing individual scores for each content point and communicative design'),
});

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[Essay Evaluation] Received request at', new Date().toISOString());
  console.log('[Essay Evaluation] Processing request');

  try {
    const requestBody = await req.json();

    const { question_data, learner_response, test_id: bodyTestId } = requestBody;

    // Authenticate user
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[Essay Evaluation] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get test_id from query params or body
    const queryTestId = req.nextUrl.searchParams.get('test_id');
    const test_id = queryTestId || bodyTestId || null;
    console.log('[Essay Evaluation] Authenticated user', { userId, test_id, queryTestId, bodyTestId });
    
    // Validate required data
    if (!question_data || !learner_response) {
      console.error('[Essay Evaluation] Validation failed', {
        hasQuestionData: !!question_data,
        hasLearnerResponse: !!learner_response,
        questionDataType: typeof question_data,
        learnerResponseType: typeof learner_response,
        questionDataLength: question_data ? question_data.length : 0,
        learnerResponseLength: learner_response ? learner_response.length : 0,
        timestamp: new Date().toISOString()
      });
      throw new Error('Missing required data');
    }
    
    // Save the response to the database first
    try {
      // Save response to writing_scores table with the new standardized structure
      const respData = {
        user_id: userId,
        test_id,
        course: 'goethe_a1',
        section: 2, // Default to section 2 for writing
        task_type: 'essay',
        prompt: question_data,
        response: learner_response
      };
      
      console.log('[Essay Evaluation] Saving response data to writing_scores table');
      console.log('[Essay Evaluation] Response data structure:', {
        userId,
        promptLength: question_data.length,
        responseLength: learner_response.length,
        test_id,
        section: 2,
        course: 'goethe_a1'
      });
      
      const { error: respError } = await supabase.from('writing_scores').insert(respData);
      
      if (respError) {
        console.error('[Essay Evaluation] Error saving response data:', respError);
        throw new Error(`Failed to save response data: ${respError.message}`);
      }
      
      console.log('[Essay Evaluation] Successfully saved response data');
    } catch (dbError) {
      console.error('[Essay Evaluation] Database error when saving response:', dbError);
      // Continue with evaluation even if saving response fails
    }
    
    console.log('[Essay Evaluation] Validation passed, proceeding with evaluation');

    const prompt = `You are an expert Goethe A1 German examiner. Evaluate the following writing response according to the official Goethe-Institut A1 writing assessment criteria. In the feedback, address the student directly as a teacher.

    For each of the following assessment categories, use the detailed guidelines and descriptors below:
    in the feedback, dont use any name or identifier

    Task Completion (per content point) (max 3 points per content point):
    - 3 Points: Task fully completed and comprehensible
    - 1.5 Points: Task partially completed due to linguistic or content deficiencies
    - 0 Points: Task not completed and/or incomprehensible

    Communicative Design of the Text (max 1 point):
    - 1 Point: Text format appropriate
    - 0.5 Points: Atypical or missing phrases, e.g., no greeting
    - 0 Points: No text format-specific phrases

    The maximum total score is 10 points (3 + 3 + 3 + 1) for a writing task with 3 content points.

    Additionally, identify specific grammar errors in the text. For each error, provide:
    1. The incorrect text or phrase
    2. The corrected version
    3. A brief explanation of the grammar rule or reason for correction

    Apply these assessment principles:
    - Award points as specified in the criteria
    - Focus on communication effectiveness rather than perfect grammar
    - Consider whether the message is comprehensible despite errors
    - Evaluate whether the text format is appropriate (e.g., letter, email, note)

    Return the evaluation as a JSON object with the following structure:
    
    Each category object must include: score, max_score, comment (referencing the criteria above and candidate performance), examples (from the text), and final_comment (constructive feedback for improvement, addressing the learner directly).

    Also include a separate section with a list of specific grammar errors found in the text.
    
    IMPORTANT: You MUST include a score_breakdown field with a structured object containing:
    1. content_points: An array of numbers representing the score for each content point (e.g., [3, 1.5, 0])
    2. communicative_design: A number representing the communicative design score (1, 0.5, or 0)
    
    IMPORTANT: You MUST include a total_score field that represents the sum of all category scores. This field is required and cannot be omitted.
    
    At the end, provide an overall evaluation summarizing the candidate's strengths and areas for improvement.

    The evaluation and feedback should be in English. All explanations should be in English, even for the reasons for scoring



    Question Data: ${question_data}

    Learner's Response:
    ${learner_response}`;

    console.log('[Essay Evaluation] Sending prompt to AI model for evaluation');
    console.log('[Essay Evaluation] Prompt length:', prompt.length, 'characters');
    
    const startEvalTime = Date.now();
    const { object: evaluation } = await generateObject({
      model: model,
      schema: EssayEvaluationSchema,
      prompt: prompt,
      temperature: 1
    });
    
    const evalDuration = Date.now() - startEvalTime;
    console.log('[Essay Evaluation] Received evaluation from AI model after', evalDuration, 'ms');
    console.log('[Essay Evaluation] AI Evaluation response:', JSON.stringify(evaluation, null, 2));
    
    // Ensure total_score is present - calculate it if missing
    if (evaluation.total_score === undefined) {
      console.log('[Essay Evaluation] total_score is missing, calculating it from parameter scores');
      try {
        // Calculate total score as sum of task_completion and communicative_design scores
        const taskCompletionScore = evaluation.parameter_evaluations.task_completion.score || 0;
        const communicativeDesignScore = evaluation.parameter_evaluations.communicative_design.score || 0;
        evaluation.total_score = taskCompletionScore + communicativeDesignScore;
        console.log('[Essay Evaluation] Calculated total_score:', evaluation.total_score);
      } catch (scoreError) {
        console.error('[Essay Evaluation] Error calculating total_score:', scoreError);
        // Provide a default value to prevent API failure
        evaluation.total_score = 0;
      }
    }
    
    // Generate structured score breakdown
    if (!evaluation.score_breakdown) {
      try {
        // Parse the task completion score to determine individual content point scores
        // For simplicity, we'll assume equal distribution across content points if not specified
        const taskCompletionScore = evaluation.parameter_evaluations.task_completion.score || 0;
        const communicativeDesignScore = evaluation.parameter_evaluations.communicative_design.score || 0;
        
        // Try to extract individual content point scores from examples or feedback
        // This is a simplified approach - in a real implementation, we'd parse the AI's detailed feedback
        let contentPointScores = [];
        
        // Check if we have examples that might contain individual scores
        const taskCompletionComment = evaluation.parameter_evaluations.task_completion.comment || '';
        
        // Simple heuristic: If task completion score is 9, all content points got 3
        // If it's 0, all got 0. Otherwise, try to distribute evenly or parse from comment
        if (taskCompletionScore === 9) {
          contentPointScores = [3, 3, 3]; // All content points fully addressed
        } else if (taskCompletionScore === 0) {
          contentPointScores = [0, 0, 0]; // No content points addressed
        } else {
          // Try to parse individual scores from the comment or distribute evenly
          // This is where a more sophisticated parsing would happen in a real implementation
          
          // For now, we'll use a simple distribution based on total task completion score
          // Assuming 3 content points for section 2 writing
          const numContentPoints = 3;
          const avgScore = taskCompletionScore / numContentPoints;
          
          if (avgScore === 1.5) {
            contentPointScores = [1.5, 1.5, 1.5]; // All partially addressed
          } else if (taskCompletionScore === 4.5) {
            contentPointScores = [3, 1.5, 0]; // One full, one partial, one missing
          } else if (taskCompletionScore === 6) {
            contentPointScores = [3, 3, 0]; // Two full, one missing
          } else if (taskCompletionScore === 7.5) {
            contentPointScores = [3, 3, 1.5]; // Two full, one partial
          } else if (taskCompletionScore === 3) {
            contentPointScores = [3, 0, 0]; // One full, two missing
          } else {
            // Default distribution
            contentPointScores = Array(numContentPoints).fill(avgScore);
          }
        }
        
        // Create structured score breakdown
        evaluation.score_breakdown = {
          content_points: contentPointScores,
          communicative_design: communicativeDesignScore
        };
        console.log('[Essay Evaluation] Generated score_breakdown:', JSON.stringify(evaluation.score_breakdown));
      } catch (breakdownError) {
        console.error('[Essay Evaluation] Error generating score_breakdown:', breakdownError);
        // Provide a default value
        evaluation.score_breakdown = {
          content_points: [0, 0, 0],
          communicative_design: 0
        };
      }
    }
    
    // Log only essential information
    console.log('[Essay Evaluation] Evaluation completed successfully');

    // Update the evaluation data to the writing_scores table
    try {
      const evalData = {
        score: evaluation.total_score,
        total_score: 10, // A1 writing max score
        evaluation_data: {
          task_completion: evaluation.parameter_evaluations.task_completion,
          communicative_design: evaluation.parameter_evaluations.communicative_design,
          grammar_errors: evaluation.grammar_errors,
          score_breakdown: evaluation.score_breakdown,
          overall_evaluation: evaluation.overall_evaluation
        }
      };
      
      // Update the record we just inserted with the evaluation results
      const { error: evalError } = await supabase
        .from('writing_scores')
        .update(evalData)
        .eq('user_id', userId)
        .eq('test_id', test_id)
        .eq('course', 'goethe_a1')
        .eq('section', 2);
      
      if (evalError) {
        console.error('[Essay Evaluation] Error updating evaluation data:', evalError);
      }
    } catch (evalDbError) {
      console.error('[Essay Evaluation] Database error when saving evaluation:', evalDbError);
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('[Essay Evaluation] Total processing time:', totalDuration, 'ms');

    console.log('[Essay Evaluation] Returning evaluation results to client');
    return NextResponse.json(evaluation);
  } catch (error) {
    const errorType = error instanceof Error ? error.constructor.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    const errorDetails = {
      type: errorType,
      message: errorMessage,
      stack: errorStack,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    };

    console.error('[Essay Evaluation] Process failed');
    console.error('[Essay Evaluation] Error details:', errorDetails);
    
    // Check if this is an API schema validation error
    const isSchemaError = errorMessage.includes('Invalid schema') || 
                          errorMessage.includes('response_format');
    
    if (isSchemaError) {
      console.log('[Essay Evaluation] Schema validation error detected, returning fallback evaluation');
      
      // Create a basic fallback evaluation
      try {
        const fallbackEvaluation = {
          overall_evaluation: "We couldn't generate a detailed evaluation at this time. Your essay has been saved and will be evaluated soon.",
          parameter_evaluations: {
            task_completion: {
              score: 0,
              max_score: 9,
              comment: "Evaluation pending.",
              examples: [],
              final_comment: "Please check back later for detailed feedback."
            },
            communicative_design: {
              score: 0,
              max_score: 1,
              comment: "Evaluation pending.",
              examples: [],
              final_comment: "Please check back later for detailed feedback."
            }
          },
          grammar_errors: [],
          total_score: 0,
          max_total_score: 10,
          score_breakdown: {
            content_points: [0, 0, 0],
            communicative_design: 0
          }
        };
        
        return NextResponse.json(fallbackEvaluation);
      } catch (fallbackError) {
        console.error('[Essay Evaluation] Error creating fallback evaluation:', fallbackError);
      }
    }
    
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
