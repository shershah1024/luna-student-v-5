// app/api/score-grammar/route.ts
// Server-side scoring endpoint for grammar questions
// Evaluates student answers and stores results in grammar_scores table

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
const model = azure('o4-mini');

// Schema for AI evaluation of subjective grammar questions
const SubjectiveEvaluationSchema = z.object({
  is_correct: z.boolean(),
  points_earned: z.number().min(0),
  feedback: z.string().optional(),
  grammatical_issues: z.array(z.string()).optional(),
});

// Request schema for scoring a single question
const ScoreQuestionRequestSchema = z.object({
  user_id: z.string(),
  task_id: z.string().uuid(),
  question_id: z.string().uuid(),
  user_answer: z.any(), // Can be string, number, array, or object depending on question type
  attempt_number: z.number().int().min(1).default(1),
});

// Request schema for scoring multiple questions (batch)
const BatchScoreRequestSchema = z.object({
  user_id: z.string(),
  task_id: z.string().uuid(),
  attempt_number: z.number().int().min(1).default(1),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    user_answer: z.any(),
  })),
});

/**
 * Scores a multiple choice grammar question (objective scoring)
 */
function scoreMultipleChoice(userAnswer: any, correctAnswer: any, points: number) {
  const isCorrect = String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
  return {
    is_correct: isCorrect,
    points_earned: isCorrect ? points : 0,
    evaluation_data: {},
  };
}

/**
 * Scores a checkbox grammar question (all correct answers must be selected)
 */
function scoreCheckbox(userAnswer: any, correctAnswers: string[], points: number) {
  // Normalize both arrays to strings and sort them
  const userAnswersNormalized = Array.isArray(userAnswer)
    ? userAnswer.map(a => String(a).toLowerCase()).sort()
    : [];
  const correctAnswersNormalized = correctAnswers.map(a => String(a).toLowerCase()).sort();

  const isCorrect = JSON.stringify(userAnswersNormalized) === JSON.stringify(correctAnswersNormalized);

  return {
    is_correct: isCorrect,
    points_earned: isCorrect ? points : 0,
    evaluation_data: {
      user_selections: userAnswersNormalized.length,
      required_selections: correctAnswersNormalized.length,
    },
  };
}

/**
 * Scores a true/false grammar question
 */
function scoreTrueFalse(userAnswer: any, correctAnswer: string, points: number) {
  const isCorrect = String(userAnswer).toLowerCase() === correctAnswer.toLowerCase();
  return {
    is_correct: isCorrect,
    points_earned: isCorrect ? points : 0,
    evaluation_data: {},
  };
}

/**
 * Scores a fill in the blank grammar question using AI
 */
async function scoreFillInBlank(userAnswer: string, correctAnswer: string, explanation: string, points: number) {
  try {
    const prompt = `Evaluate this fill-in-the-blank grammar answer:

Correct Answer: "${correctAnswer}"
User's Answer: "${userAnswer}"
${explanation ? `Grammar Context: "${explanation}"` : ''}

Consider:
1. Grammatical correctness
2. Alternative grammatically correct forms (e.g., contractions, full forms)
3. Whether the answer demonstrates understanding of the grammar rule

Respond with evaluation data.`;

    const { object: evaluation } = await generateObject({
      model: model,
      schema: SubjectiveEvaluationSchema,
      prompt: prompt,
    });

    return {
      is_correct: evaluation.is_correct,
      points_earned: evaluation.is_correct ? points : 0,
      evaluation_data: {
        feedback: evaluation.feedback,
        ai_evaluated: true,
      },
    };
  } catch (error) {
    console.error('❌ [SCORE-GRAMMAR] AI evaluation failed for fill-in-blank:', error);
    // Fallback to exact match
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    return {
      is_correct: isCorrect,
      points_earned: isCorrect ? points : 0,
      evaluation_data: {
        fallback: 'exact_match',
        ai_error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Scores an error correction question using AI
 */
async function scoreErrorCorrection(
  userAnswer: string,
  correctSentence: string,
  errorPositions: Array<{ incorrect: string; correct: string }>,
  points: number
) {
  try {
    const prompt = `Evaluate this error correction answer:

Original Sentence (with errors): User was asked to correct this
Correct Sentence: "${correctSentence}"
Known Errors: ${JSON.stringify(errorPositions)}
User's Corrected Sentence: "${userAnswer}"

Evaluate if the user successfully corrected the grammatical errors. Consider:
1. Did they fix all the errors?
2. Did they maintain the meaning of the sentence?
3. Is the corrected sentence grammatically accurate?

Award partial credit based on how many errors were correctly fixed.
Maximum points: ${points}`;

    const { object: evaluation } = await generateObject({
      model: model,
      schema: SubjectiveEvaluationSchema,
      prompt: prompt,
    });

    return {
      is_correct: evaluation.is_correct,
      points_earned: Math.min(evaluation.points_earned, points),
      evaluation_data: {
        feedback: evaluation.feedback,
        grammatical_issues: evaluation.grammatical_issues,
        ai_evaluated: true,
      },
    };
  } catch (error) {
    console.error('❌ [SCORE-GRAMMAR] AI evaluation failed for error correction:', error);
    // Fallback to exact match
    const isCorrect = userAnswer.toLowerCase().trim() === correctSentence.toLowerCase().trim();
    return {
      is_correct: isCorrect,
      points_earned: isCorrect ? points : 0,
      evaluation_data: {
        fallback: 'exact_match',
        ai_error: error instanceof Error ? error.message : 'Unknown error',
        requires_manual_review: true,
      },
    };
  }
}

/**
 * Scores a sentence transformation question using AI
 */
async function scoreSentenceTransformation(
  userAnswer: string,
  correctAnswer: string,
  acceptableVariations: string[] | undefined,
  instruction: string,
  points: number
) {
  try {
    const allAcceptableAnswers = [correctAnswer, ...(acceptableVariations || [])];

    // First check exact matches with acceptable variations
    const exactMatch = allAcceptableAnswers.some(
      acceptable => userAnswer.toLowerCase().trim() === acceptable.toLowerCase().trim()
    );

    if (exactMatch) {
      return {
        is_correct: true,
        points_earned: points,
        evaluation_data: {
          matched: 'exact',
        },
      };
    }

    // Use AI for semantic evaluation
    const prompt = `Evaluate this sentence transformation answer:

Instruction: "${instruction}"
Expected Answer: "${correctAnswer}"
${acceptableVariations && acceptableVariations.length > 0 ? `Acceptable Variations: ${acceptableVariations.join('; ')}` : ''}
User's Answer: "${userAnswer}"

Evaluate if the user's transformation is grammatically correct and follows the instruction. Consider:
1. Did they follow the transformation instruction correctly?
2. Is the grammar correct?
3. Is the meaning preserved?
4. Does it match the expected answer semantically (even if wording differs)?

Maximum points: ${points}`;

    const { object: evaluation } = await generateObject({
      model: model,
      schema: SubjectiveEvaluationSchema,
      prompt: prompt,
    });

    return {
      is_correct: evaluation.is_correct,
      points_earned: Math.min(evaluation.points_earned, points),
      evaluation_data: {
        feedback: evaluation.feedback,
        ai_evaluated: true,
      },
    };
  } catch (error) {
    console.error('❌ [SCORE-GRAMMAR] AI evaluation failed for sentence transformation:', error);
    return {
      is_correct: false,
      points_earned: 0,
      evaluation_data: {
        fallback: 'failed',
        ai_error: error instanceof Error ? error.message : 'Unknown error',
        requires_manual_review: true,
      },
    };
  }
}

/**
 * Scores a verb conjugation question
 */
async function scoreVerbConjugation(
  userAnswer: string,
  correctAnswer: string,
  verb: string,
  tense: string,
  subject: string,
  points: number
) {
  try {
    const prompt = `Evaluate this verb conjugation answer:

Verb: "${verb}"
Tense: "${tense}"
Subject: "${subject}"
Correct Conjugation: "${correctAnswer}"
User's Answer: "${userAnswer}"

Evaluate if the conjugation is correct. Consider:
1. Grammatical accuracy
2. Alternative spellings or contractions (e.g., "do not" vs "don't")

Maximum points: ${points}`;

    const { object: evaluation } = await generateObject({
      model: model,
      schema: SubjectiveEvaluationSchema,
      prompt: prompt,
    });

    return {
      is_correct: evaluation.is_correct,
      points_earned: evaluation.is_correct ? points : 0,
      evaluation_data: {
        feedback: evaluation.feedback,
        ai_evaluated: true,
      },
    };
  } catch (error) {
    console.error('❌ [SCORE-GRAMMAR] AI evaluation failed for verb conjugation:', error);
    // Fallback to exact match
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    return {
      is_correct: isCorrect,
      points_earned: isCorrect ? points : 0,
      evaluation_data: {
        fallback: 'exact_match',
        ai_error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Scores a word order question
 */
function scoreWordOrder(userAnswer: number[], correctOrder: number[], points: number) {
  const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctOrder);
  return {
    is_correct: isCorrect,
    points_earned: isCorrect ? points : 0,
    evaluation_data: {
      user_order: userAnswer,
      correct_order: correctOrder,
    },
  };
}

/**
 * Main scoring function that delegates to specific scorers based on question type
 */
async function scoreQuestion(question: any, userAnswer: any) {
  const questionType = question.question_type;
  const questionBody = question.body;
  const maxPoints = question.points;
  const correctAnswer = question.answer;

  console.log(`🎯 [SCORE-GRAMMAR] Scoring ${questionType} question #${question.question_number}`);

  switch (questionType) {
    case 'multiple_choice':
      return scoreMultipleChoice(userAnswer, correctAnswer, maxPoints);

    case 'checkbox':
      return scoreCheckbox(userAnswer, correctAnswer, maxPoints);

    case 'true_false':
      return scoreTrueFalse(userAnswer, correctAnswer, maxPoints);

    case 'fill_in_the_blanks':
      return await scoreFillInBlank(
        String(userAnswer),
        correctAnswer,
        questionBody.explanation,
        maxPoints
      );

    case 'error_correction':
      return await scoreErrorCorrection(
        String(userAnswer),
        questionBody.correct_sentence,
        questionBody.error_positions,
        maxPoints
      );

    case 'sentence_transformation':
      return await scoreSentenceTransformation(
        String(userAnswer),
        correctAnswer,
        questionBody.acceptable_variations,
        questionBody.instruction,
        maxPoints
      );

    case 'verb_conjugation':
      return await scoreVerbConjugation(
        String(userAnswer),
        correctAnswer,
        questionBody.verb,
        questionBody.tense,
        questionBody.subject,
        maxPoints
      );

    case 'word_order':
      return scoreWordOrder(userAnswer as number[], questionBody.correct_order, maxPoints);

    default:
      console.warn(`⚠️ [SCORE-GRAMMAR] Unknown question type: ${questionType}`);
      return {
        is_correct: false,
        points_earned: 0,
        evaluation_data: {
          error: 'Unknown question type',
          requires_manual_review: true,
        },
      };
  }
}

/**
 * POST endpoint to score grammar questions
 * Accepts both single question scoring and batch scoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine if this is a batch request or single question
    const isBatch = 'answers' in body;

    if (isBatch) {
      // Batch scoring
      const validationResult = BatchScoreRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      const { user_id, task_id, attempt_number, answers } = validationResult.data;

      console.log(`📊 [SCORE-GRAMMAR] Batch scoring ${answers.length} questions for task ${task_id}`);

      // Fetch all questions for this task
      const { data: questions, error: questionsError } = await supabase
        .from('task_questions')
        .select('*')
        .eq('task_id', task_id)
        .order('question_number');

      if (questionsError || !questions) {
        return NextResponse.json(
          { error: 'Failed to fetch questions', details: questionsError },
          { status: 500 }
        );
      }

      // Score each question
      const scoredResults = [];
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.question_id);
        if (!question) {
          console.warn(`⚠️ [SCORE-GRAMMAR] Question ${answer.question_id} not found`);
          continue;
        }

        const scoreResult = await scoreQuestion(question, answer.user_answer);

        scoredResults.push({
          question_id: answer.question_id,
          question_number: question.question_number,
          ...scoreResult,
        });

        // Save to grammar_scores table
        await supabase.from('grammar_scores').insert({
          user_id,
          task_id,
          question_id: answer.question_id,
          question_number: question.question_number,
          user_answer: answer.user_answer,
          correct_answer: question.answer,
          is_correct: scoreResult.is_correct,
          points_earned: scoreResult.points_earned,
          max_points: question.points,
          evaluation_data: scoreResult.evaluation_data,
          attempt_number,
        });
      }

      const totalPointsEarned = scoredResults.reduce((sum, r) => sum + r.points_earned, 0);
      const totalPointsPossible = questions.reduce((sum, q) => sum + q.points, 0);
      const percentageScore = (totalPointsEarned / totalPointsPossible) * 100;

      console.log(`✅ [SCORE-GRAMMAR] Batch scoring complete: ${totalPointsEarned}/${totalPointsPossible} (${percentageScore.toFixed(1)}%)`);

      return NextResponse.json({
        success: true,
        results: scoredResults,
        summary: {
          total_questions: scoredResults.length,
          total_points_earned: totalPointsEarned,
          total_points_possible: totalPointsPossible,
          percentage_score: Math.round(percentageScore * 100) / 100,
        },
      });

    } else {
      // Single question scoring
      const validationResult = ScoreQuestionRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      const { user_id, task_id, question_id, user_answer, attempt_number } = validationResult.data;

      console.log(`🎯 [SCORE-GRAMMAR] Scoring single question ${question_id} for task ${task_id}`);

      // Fetch the question
      const { data: question, error: questionError } = await supabase
        .from('task_questions')
        .select('*')
        .eq('id', question_id)
        .eq('task_id', task_id)
        .single();

      if (questionError || !question) {
        return NextResponse.json(
          { error: 'Question not found', details: questionError },
          { status: 404 }
        );
      }

      const scoreResult = await scoreQuestion(question, user_answer);

      // Save to grammar_scores table
      const { error: insertError } = await supabase.from('grammar_scores').insert({
        user_id,
        task_id,
        question_id,
        question_number: question.question_number,
        user_answer,
        correct_answer: question.answer,
        is_correct: scoreResult.is_correct,
        points_earned: scoreResult.points_earned,
        max_points: question.points,
        evaluation_data: scoreResult.evaluation_data,
        attempt_number,
      });

      if (insertError) {
        console.error('❌ [SCORE-GRAMMAR] Failed to save score:', insertError);
        return NextResponse.json(
          { error: 'Failed to save score', details: insertError },
          { status: 500 }
        );
      }

      console.log(`✅ [SCORE-GRAMMAR] Score saved: ${scoreResult.points_earned}/${question.points}`);

      return NextResponse.json({
        success: true,
        question_id,
        question_number: question.question_number,
        ...scoreResult,
        max_points: question.points,
      });
    }

  } catch (error) {
    console.error('💥 [SCORE-GRAMMAR] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to score grammar question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
