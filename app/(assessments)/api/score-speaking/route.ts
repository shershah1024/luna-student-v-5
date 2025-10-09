// app/api/score-speaking/route.ts
// Server-side scoring endpoint for speaking tasks with holistic evaluation
// Evaluates conversation-based speaking exercises across multiple dimensions
// Based on telc_a2 lesson-speaking-evaluation pattern with multi-language support

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Speaking evaluation can take longer

// Initialize Supabase client with anon key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Azure OpenAI for AI-assisted scoring
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});
const model = azure('gpt-5');

// Schema for grammar error in speaking
const GrammarErrorSchema = z.object({
  error: z.string().describe('The incorrect utterance'),
  correction: z.string().describe('The correct version'),
  explanation: z.string().describe('Explanation of the error'),
  grammar_category: z.string().describe('Category like verb_tense, article_usage, word_order, etc.'),
  severity: z.enum(['minor', 'moderate', 'major']).describe('Severity of the error'),
});

// Schema for task completion assessment
const TaskCompletionSchema = z.object({
  score: z.number().min(0).describe('Score for task completion'),
  max_score: z.number().min(0).describe('Maximum possible score'),
  feedback: z.string().describe('Feedback on how well the task was completed'),
  points_addressed: z.array(z.string()).optional().describe('Task points that were addressed'),
  points_missing: z.array(z.string()).optional().describe('Task points that were not addressed'),
});

// Schema for grammar and vocabulary assessment
const GrammarVocabularySchema = z.object({
  score: z.number().min(0).describe('Score for grammar and vocabulary'),
  max_score: z.number().min(0).describe('Maximum possible score'),
  feedback: z.string().describe('Feedback on grammar and vocabulary usage'),
  grammar_strengths: z.array(z.string()).optional(),
  grammar_weaknesses: z.array(z.string()).optional(),
  vocabulary_strengths: z.array(z.string()).optional(),
  vocabulary_weaknesses: z.array(z.string()).optional(),
  grammar_errors_list: z.array(GrammarErrorSchema).describe('List of specific grammar errors'),
});

// Schema for communication effectiveness
const CommunicationEffectivenessSchema = z.object({
  score: z.number().min(0).describe('Score for communication effectiveness'),
  max_score: z.number().min(0).describe('Maximum possible score'),
  feedback: z.string().describe('Feedback on communication effectiveness'),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  fluency_assessment: z.string().optional(),
  clarity_assessment: z.string().optional(),
});

// Complete speaking evaluation schema
const SpeakingEvaluationSchema = z.object({
  task_completion: TaskCompletionSchema.describe('Assessment of how well the speaking task was completed'),

  grammar_vocabulary: GrammarVocabularySchema.describe('Assessment of grammar and vocabulary usage'),

  communication_effectiveness: CommunicationEffectivenessSchema.describe('Assessment of overall communication'),

  total_score: z.number().min(0).describe('Sum of all scores'),
  max_total_score: z.number().min(0).describe('Maximum possible total'),
  percentage_score: z.number().min(0).max(100).describe('Percentage score'),

  overall_feedback: z.string().describe('Overall summary feedback'),
  level_assessment: z.string().optional().describe('Estimated CEFR level (A1, A2, B1, etc.)'),

  strengths: z.array(z.string()).describe('Overall strengths'),
  areas_for_improvement: z.array(z.string()).describe('Areas for improvement'),
});

// Request schema for speaking evaluation
const EvaluateSpeakingRequestSchema = z.object({
  user_id: z.string(),
  task_id: z.string(), // Can be UUID or text to match lesson_speaking_scores
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).min(1).describe('Full conversation transcript'),
  attempt_number: z.number().int().min(1).default(1),

  // Task context
  task_instructions: z.string().optional().describe('The speaking task instructions'),
  required_points: z.array(z.string()).optional().describe('Required topics to discuss'),

  // Language context
  language: z.string().default('English'),
  course_name: z.string().optional().describe('Course identifier for multi-language support'),
  level: z.string().optional().describe('Target CEFR level'),

  // Scoring weights (optional customization)
  scoring_weights: z.object({
    task_completion: z.number().optional().default(3),
    grammar_vocabulary: z.number().optional().default(4),
    communication_effectiveness: z.number().optional().default(3),
  }).optional(),
});

/**
 * Evaluate speaking using AI with multi-dimensional assessment
 * Based on telc_a2 evaluation pattern
 */
async function evaluateSpeaking(
  conversationHistory: Array<{ role: string; content: string }>,
  taskInstructions: string | undefined,
  requiredPoints: string[] | undefined,
  language: string,
  level: string | undefined,
  scoringWeights: any
) {
  // Extract user utterances for analysis
  const userUtterances = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join('\n\n');

  const totalTurns = conversationHistory.filter(msg => msg.role === 'user').length;

  // Build evaluation prompt based on language and context
  const systemPrompt = `You are an expert ${language} speaking evaluator for ${level || 'intermediate'} level learners.

Evaluate the student's speaking performance across these dimensions:

1. **Task Completion** (${scoringWeights?.task_completion || 3} points):
   - Did they address the task requirements?
   - Were all required points covered?
   - Was the response appropriate for the task?

2. **Grammar & Vocabulary** (${scoringWeights?.grammar_vocabulary || 4} points):
   - Grammatical accuracy and range
   - Vocabulary appropriateness and variety
   - Identify specific grammar errors with corrections

3. **Communication Effectiveness** (${scoringWeights?.communication_effectiveness || 3} points):
   - Clarity and coherence
   - Fluency and natural expression
   - Ability to maintain conversation

For grammar errors:
- Identify specific errors from the conversation
- Provide corrections
- Categorize by type (verb_tense, article_usage, word_order, preposition, etc.)
- Rate severity (minor, moderate, major)

Provide constructive, encouraging feedback appropriate for ${level || 'intermediate'} learners.`;

  const userPrompt = `Speaking Task: ${taskInstructions || 'General conversation task'}
${requiredPoints ? `\nRequired Topics to Discuss:\n${requiredPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

Conversation Transcript (${totalTurns} turns):
${conversationHistory.map((msg, i) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

Evaluate this speaking performance comprehensively. Focus on the student's utterances (USER messages).`;

  try {
    const { object: evaluation } = await generateObject({
      model,
      schema: SpeakingEvaluationSchema,
      system: systemPrompt,
      prompt: userPrompt,
      providerOptions: {
        azure: {
          reasoningEffort: 'medium' // Speaking evaluation needs deeper analysis
        }
      },
    });

    return {
      success: true,
      evaluation,
      total_turns: totalTurns,
    };
  } catch (error) {
    console.error('❌ [SCORE-SPEAKING] AI evaluation failed:', error);
    throw error;
  }
}

/**
 * POST endpoint to evaluate speaking
 * Compatible with telc_a2 lesson_speaking_scores structure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = EvaluateSpeakingRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      user_id,
      task_id,
      conversation_history,
      attempt_number,
      task_instructions,
      required_points,
      language,
      course_name,
      level,
      scoring_weights,
    } = validationResult.data;

    console.log(`🗣️ [SCORE-SPEAKING] Evaluating speaking for task ${task_id}, user ${user_id}, attempt ${attempt_number}`);

    // Check if this attempt already exists
    const { data: existingScore } = await supabase
      .from('lesson_speaking_scores')
      .select('id')
      .eq('user_id', user_id)
      .eq('task_id', task_id)
      .eq('attempt_id', attempt_number)
      .single();

    if (existingScore) {
      return NextResponse.json(
        { error: 'This attempt has already been evaluated' },
        { status: 409 }
      );
    }

    // Perform AI evaluation
    const { evaluation, total_turns } = await evaluateSpeaking(
      conversation_history,
      task_instructions,
      required_points,
      language,
      level,
      scoring_weights || {
        task_completion: 3,
        grammar_vocabulary: 4,
        communication_effectiveness: 3,
      }
    );

    // Prepare evaluation data for storage (matching telc_a2 structure)
    const evaluationData = {
      task_completion: {
        score: evaluation.task_completion.score,
        max_score: evaluation.task_completion.max_score,
        feedback: evaluation.task_completion.feedback,
        points_addressed: evaluation.task_completion.points_addressed,
        points_missing: evaluation.task_completion.points_missing,
      },
      grammar_vocabulary: {
        score: evaluation.grammar_vocabulary.score,
        max_score: evaluation.grammar_vocabulary.max_score,
        feedback: evaluation.grammar_vocabulary.feedback,
        grammar_strengths: evaluation.grammar_vocabulary.grammar_strengths,
        grammar_weaknesses: evaluation.grammar_vocabulary.grammar_weaknesses,
        vocabulary_strengths: evaluation.grammar_vocabulary.vocabulary_strengths,
        vocabulary_weaknesses: evaluation.grammar_vocabulary.vocabulary_weaknesses,
        grammar_errors_list: evaluation.grammar_vocabulary.grammar_errors_list,
      },
      communication_effectiveness: {
        score: evaluation.communication_effectiveness.score,
        max_score: evaluation.communication_effectiveness.max_score,
        feedback: evaluation.communication_effectiveness.feedback,
        strengths: evaluation.communication_effectiveness.strengths,
        weaknesses: evaluation.communication_effectiveness.weaknesses,
        fluency_assessment: evaluation.communication_effectiveness.fluency_assessment,
        clarity_assessment: evaluation.communication_effectiveness.clarity_assessment,
      },
      overall_feedback: evaluation.overall_feedback,
      level_assessment: evaluation.level_assessment,
      strengths: evaluation.strengths,
      areas_for_improvement: evaluation.areas_for_improvement,
      evaluation_timestamp: new Date().toISOString(),
    };

    // Save to lesson_speaking_scores table (matching telc_a2 structure)
    const { data: speakingScore, error: insertError } = await supabase
      .from('lesson_speaking_scores')
      .insert({
        user_id,
        task_id,
        course_name: course_name || language,
        attempt_id: attempt_number,
        conversation_history,
        task_instructions,
        grammar_vocabulary_score: evaluation.grammar_vocabulary.score,
        communication_score: evaluation.communication_effectiveness.score,
        total_score: evaluation.total_score,
        percentage_score: evaluation.percentage_score,
        evaluation_data: evaluationData,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ [SCORE-SPEAKING] Failed to save speaking score:', insertError);
      return NextResponse.json(
        { error: 'Failed to save evaluation', details: insertError },
        { status: 500 }
      );
    }

    console.log(`✅ [SCORE-SPEAKING] Speaking score saved with id: ${speakingScore.id}`);

    // Save grammar errors to grammar_errors table (like telc_a2)
    if (evaluation.grammar_vocabulary.grammar_errors_list.length > 0) {
      console.log(`📊 [SCORE-SPEAKING] Saving ${evaluation.grammar_vocabulary.grammar_errors_list.length} grammar errors`);

      // Convert conversation to string for context
      const contextString = JSON.stringify(conversation_history, null, 2);

      const grammarErrorsToInsert = evaluation.grammar_vocabulary.grammar_errors_list.map(error => ({
        user_id,
        source_type: 'speaking',
        source_id: speakingScore.id,
        task_id,
        attempt_id: attempt_number,
        course: course_name || language,
        language,
        error_text: error.error,
        correction: error.correction,
        explanation: error.explanation,
        grammar_category: error.grammar_category,
        error_type: error.grammar_category, // Backward compatibility
        severity: error.severity,
        context: contextString,
      }));

      const { error: grammarError } = await supabase
        .from('grammar_errors')
        .insert(grammarErrorsToInsert);

      if (grammarError) {
        console.error('❌ [SCORE-SPEAKING] Failed to save grammar errors:', grammarError);
        // Don't fail the whole request if grammar errors can't be saved
      } else {
        console.log(`✅ [SCORE-SPEAKING] Grammar errors saved successfully`);
      }
    }

    console.log(`✅ [SCORE-SPEAKING] Evaluation complete: ${evaluation.total_score}/${evaluation.max_total_score} (${evaluation.percentage_score.toFixed(1)}%)`);

    // Return response matching telc_a2 format
    return NextResponse.json({
      success: true,
      db_record_id: speakingScore.id,
      task_completion: evaluation.task_completion,
      grammar_vocabulary: evaluation.grammar_vocabulary,
      communication_effectiveness: evaluation.communication_effectiveness,
      total_score: evaluation.total_score,
      max_score: evaluation.max_total_score,
      percentage: evaluation.percentage_score,
      overall_feedback: evaluation.overall_feedback,
      level_assessment: evaluation.level_assessment,
      attempt_id: attempt_number,
      breakdown: {
        grammar_vocabulary: evaluation.grammar_vocabulary.score,
        communication: evaluation.communication_effectiveness.score,
        task_completion: evaluation.task_completion.score,
      },
    });

  } catch (error) {
    console.error('💥 [SCORE-SPEAKING] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate speaking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
