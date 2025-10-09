// app/api/score-writing/route.ts
// Server-side scoring endpoint for writing tasks with holistic evaluation
// Supports multi-language evaluation and detailed grammar error tracking

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Writing evaluation can take longer

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

// Schema for grammar error
const GrammarErrorSchema = z.object({
  error: z.string().describe('The incorrect text'),
  correction: z.string().describe('The correct version'),
  explanation: z.string().describe('Explanation of the error'),
  grammar_category: z.string().describe('Category like verb_tense, article_usage, word_order, etc.'),
  severity: z.enum(['minor', 'moderate', 'major']).describe('Severity of the error'),
});

// Schema for each scoring dimension
const ScoringDimensionSchema = z.object({
  score: z.number().min(0).describe('Score for this dimension'),
  max_score: z.number().min(0).describe('Maximum possible score'),
  feedback: z.string().describe('Detailed feedback for this dimension'),
  strengths: z.array(z.string()).optional().describe('What the writer did well'),
  weaknesses: z.array(z.string()).optional().describe('Areas needing improvement'),
});

// Complete writing evaluation schema
const WritingEvaluationSchema = z.object({
  task_completion: ScoringDimensionSchema.extend({
    points_covered: z.array(z.string()).optional(),
    points_missing: z.array(z.string()).optional(),
  }).describe('How well the writer addressed all required points'),

  coherence_cohesion: ScoringDimensionSchema.describe('Organization, paragraphing, and logical flow'),

  vocabulary: ScoringDimensionSchema.extend({
    strong_words: z.array(z.string()).optional(),
    weak_areas: z.array(z.string()).optional(),
  }).describe('Lexical resource and word choice'),

  grammar: ScoringDimensionSchema.extend({
    error_count: z.number().int().min(0),
    error_types: z.array(z.string()).optional(),
  }).describe('Grammatical range and accuracy'),

  format: ScoringDimensionSchema.extend({
    has_greeting: z.boolean().optional(),
    has_closing: z.boolean().optional(),
    has_subject: z.boolean().optional(),
    format_type: z.string().optional(),
  }).describe('Format appropriateness (email, letter, essay, etc.)'),

  grammar_errors: z.array(GrammarErrorSchema).describe('Detailed list of grammar errors'),

  total_score: z.number().min(0).describe('Sum of all dimension scores'),
  max_total_score: z.number().min(0).describe('Maximum possible total score'),
  percentage_score: z.number().min(0).max(100).describe('Percentage score'),

  overall_feedback: z.string().describe('Overall summary of the writing'),
  level_assessment: z.string().optional().describe('Estimated CEFR level (A1, A2, B1, etc.)'),
  strengths: z.array(z.string()).describe('Overall strengths'),
  areas_for_improvement: z.array(z.string()).describe('Areas for improvement'),
});

// Request schema for writing evaluation
const EvaluateWritingRequestSchema = z.object({
  user_id: z.string(),
  task_id: z.string().uuid(),
  response_text: z.string().min(10),
  attempt_number: z.number().int().min(1).default(1),

  // Task context
  prompt: z.string().optional().describe('The writing prompt/instructions'),
  required_points: z.array(z.string()).optional().describe('Required points to address'),
  format_type: z.string().optional().describe('Expected format: email, letter, essay, etc.'),
  word_count_min: z.number().int().optional(),
  word_count_max: z.number().int().optional(),

  // Language context
  language: z.string().default('English'),
  course_name: z.string().optional().describe('Course identifier for multi-language support'),
  level: z.string().optional().describe('Target CEFR level'),

  // Scoring weights (optional customization)
  scoring_weights: z.object({
    task_completion: z.number().optional(),
    coherence_cohesion: z.number().optional(),
    vocabulary: z.number().optional(),
    grammar: z.number().optional(),
    format: z.number().optional(),
  }).optional(),
});

/**
 * Evaluate writing using AI with multi-dimensional assessment
 */
async function evaluateWriting(
  responseText: string,
  prompt: string | undefined,
  requiredPoints: string[] | undefined,
  formatType: string | undefined,
  wordCountMin: number | undefined,
  wordCountMax: number | undefined,
  language: string,
  level: string | undefined,
  scoringWeights: any
) {
  const wordCount = responseText.trim().split(/\s+/).length;

  // Build evaluation prompt based on language and context
  const systemPrompt = `You are an expert ${language} writing evaluator for ${level || 'intermediate'} level learners.

Evaluate the student's writing holistically across these dimensions:
1. **Task Completion** (${scoringWeights?.task_completion || 5} points): Did they address all required points?
2. **Coherence & Cohesion** (${scoringWeights?.coherence_cohesion || 5} points): Is it well-organized with good flow?
3. **Vocabulary** (${scoringWeights?.vocabulary || 5} points): Appropriate word choice and range?
4. **Grammar** (${scoringWeights?.grammar || 5} points): Grammatical accuracy and range?
5. **Format** (${scoringWeights?.format || 5} points): Appropriate format for the task type?

For grammar errors:
- Identify specific errors with corrections
- Categorize by type (verb_tense, article_usage, word_order, preposition, subject_verb_agreement, etc.)
- Rate severity (minor, moderate, major)

Provide constructive, encouraging feedback appropriate for ${level || 'intermediate'} learners.`;

  const userPrompt = `Writing Prompt: ${prompt || 'General writing task'}
${requiredPoints ? `\nRequired Points to Address:\n${requiredPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}
${formatType ? `\nExpected Format: ${formatType}` : ''}
${wordCountMin || wordCountMax ? `\nWord Count Requirement: ${wordCountMin || 'No min'} - ${wordCountMax || 'No max'} words` : ''}

Student's Response (${wordCount} words):
${responseText}

Evaluate this writing comprehensively. Be thorough in identifying grammar errors.`;

  try {
    const { object: evaluation } = await generateObject({
      model,
      schema: WritingEvaluationSchema,
      system: systemPrompt,
      prompt: userPrompt,
      providerOptions: {
        azure: {
          reasoningEffort: 'medium' // Writing evaluation needs deeper analysis
        }
      },
    });

    return {
      success: true,
      evaluation,
      word_count: wordCount,
    };
  } catch (error) {
    console.error('❌ [SCORE-WRITING] AI evaluation failed:', error);
    throw error;
  }
}

/**
 * POST endpoint to evaluate writing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = EvaluateWritingRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      user_id,
      task_id,
      response_text,
      attempt_number,
      prompt,
      required_points,
      format_type,
      word_count_min,
      word_count_max,
      language,
      course_name,
      level,
      scoring_weights,
    } = validationResult.data;

    console.log(`📝 [SCORE-WRITING] Evaluating writing for task ${task_id}, user ${user_id}, attempt ${attempt_number}`);

    // Check if this attempt already exists
    const { data: existingScore } = await supabase
      .from('writing_scores')
      .select('id')
      .eq('user_id', user_id)
      .eq('task_id', task_id)
      .eq('attempt_number', attempt_number)
      .single();

    if (existingScore) {
      return NextResponse.json(
        { error: 'This attempt has already been evaluated' },
        { status: 409 }
      );
    }

    // Perform AI evaluation
    const { evaluation, word_count } = await evaluateWriting(
      response_text,
      prompt,
      required_points,
      format_type,
      word_count_min,
      word_count_max,
      language,
      level,
      scoring_weights || {
        task_completion: 5,
        coherence_cohesion: 5,
        vocabulary: 5,
        grammar: 5,
        format: 5,
      }
    );

    // Prepare evaluation data for storage
    const evaluationData = {
      task_completion: {
        score: evaluation.task_completion.score,
        max_score: evaluation.task_completion.max_score,
        feedback: evaluation.task_completion.feedback,
        strengths: evaluation.task_completion.strengths,
        weaknesses: evaluation.task_completion.weaknesses,
        points_covered: evaluation.task_completion.points_covered,
        points_missing: evaluation.task_completion.points_missing,
      },
      coherence_cohesion: {
        score: evaluation.coherence_cohesion.score,
        max_score: evaluation.coherence_cohesion.max_score,
        feedback: evaluation.coherence_cohesion.feedback,
        strengths: evaluation.coherence_cohesion.strengths,
        weaknesses: evaluation.coherence_cohesion.weaknesses,
      },
      vocabulary: {
        score: evaluation.vocabulary.score,
        max_score: evaluation.vocabulary.max_score,
        feedback: evaluation.vocabulary.feedback,
        strengths: evaluation.vocabulary.strengths,
        weaknesses: evaluation.vocabulary.weaknesses,
        strong_words: evaluation.vocabulary.strong_words,
        weak_areas: evaluation.vocabulary.weak_areas,
      },
      grammar: {
        score: evaluation.grammar.score,
        max_score: evaluation.grammar.max_score,
        feedback: evaluation.grammar.feedback,
        strengths: evaluation.grammar.strengths,
        weaknesses: evaluation.grammar.weaknesses,
        error_count: evaluation.grammar.error_count,
        error_types: evaluation.grammar.error_types,
      },
      format: {
        score: evaluation.format.score,
        max_score: evaluation.format.max_score,
        feedback: evaluation.format.feedback,
        has_greeting: evaluation.format.has_greeting,
        has_closing: evaluation.format.has_closing,
        has_subject: evaluation.format.has_subject,
        format_type: evaluation.format.format_type,
      },
      overall_feedback: evaluation.overall_feedback,
      level_assessment: evaluation.level_assessment,
      strengths: evaluation.strengths,
      areas_for_improvement: evaluation.areas_for_improvement,
    };

    // Save to writing_scores table
    const { data: writingScore, error: insertError } = await supabase
      .from('writing_scores')
      .insert({
        user_id,
        task_id,
        attempt_number,
        response_text,
        word_count,
        task_completion_score: evaluation.task_completion.score,
        coherence_cohesion_score: evaluation.coherence_cohesion.score,
        vocabulary_score: evaluation.vocabulary.score,
        grammar_accuracy_score: evaluation.grammar.score,
        format_score: evaluation.format.score,
        total_score: evaluation.total_score,
        max_score: evaluation.max_total_score,
        percentage_score: evaluation.percentage_score,
        evaluation_data: evaluationData,
        grammar_error_count: evaluation.grammar_errors.length,
        language,
        course_name,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ [SCORE-WRITING] Failed to save writing score:', insertError);
      return NextResponse.json(
        { error: 'Failed to save evaluation', details: insertError },
        { status: 500 }
      );
    }

    console.log(`✅ [SCORE-WRITING] Writing score saved with id: ${writingScore.id}`);

    // Save grammar errors to grammar_errors table
    if (evaluation.grammar_errors.length > 0) {
      console.log(`📊 [SCORE-WRITING] Saving ${evaluation.grammar_errors.length} grammar errors`);

      const grammarErrorsToInsert = evaluation.grammar_errors.map(error => ({
        user_id,
        source_type: 'writing',
        source_id: writingScore.id,
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
        context: response_text, // Store full response as context
      }));

      const { error: grammarError } = await supabase
        .from('grammar_errors')
        .insert(grammarErrorsToInsert);

      if (grammarError) {
        console.error('❌ [SCORE-WRITING] Failed to save grammar errors:', grammarError);
        // Don't fail the whole request if grammar errors can't be saved
      } else {
        console.log(`✅ [SCORE-WRITING] Grammar errors saved successfully`);
      }
    }

    console.log(`✅ [SCORE-WRITING] Evaluation complete: ${evaluation.total_score}/${evaluation.max_total_score} (${evaluation.percentage_score.toFixed(1)}%)`);

    return NextResponse.json({
      success: true,
      writing_score_id: writingScore.id,
      word_count,
      scores: {
        task_completion: evaluation.task_completion.score,
        coherence_cohesion: evaluation.coherence_cohesion.score,
        vocabulary: evaluation.vocabulary.score,
        grammar: evaluation.grammar.score,
        format: evaluation.format.score,
        total: evaluation.total_score,
        max_total: evaluation.max_total_score,
        percentage: evaluation.percentage_score,
      },
      evaluation: evaluationData,
      grammar_errors: evaluation.grammar_errors,
      level_assessment: evaluation.level_assessment,
      attempt_number,
    });

  } catch (error) {
    console.error('💥 [SCORE-WRITING] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate writing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
