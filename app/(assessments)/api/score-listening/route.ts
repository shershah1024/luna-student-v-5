// app/api/score-listening/route.ts
// Server-side scoring endpoint for listening comprehension questions
// Evaluates student answers and stores results in listening_scores table

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

// Schema for AI evaluation of subjective questions (short_answer, essay)
const SubjectiveEvaluationSchema = z.object({
  is_correct: z.boolean(),
  points_earned: z.number().min(0),
  feedback: z.string().optional(),
  key_points_covered: z.array(z.string()).optional(),
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
 * Scores a multiple choice question (objective scoring)
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
 * Scores a checkbox question (all correct answers must be selected)
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
 * Scores a true/false question
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
 * Scores a fill in the blank question using AI
 */
async function scoreFillInBlank(userAnswer: string, correctAnswer: string, explanation: string, points: number) {
  try {
    const prompt = `Evaluate this fill-in-the-blank listening comprehension answer:

Correct Answer: "${correctAnswer}"
User's Answer: "${userAnswer}"
${explanation ? `Context: "${explanation}"` : ''}

Consider:
1. The meaning and intent of the answer
2. Alternative correct phrasings or spellings
3. Whether the answer demonstrates understanding of what was heard

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
    console.error('❌ [SCORE-LISTENING] AI evaluation failed for fill-in-blank:', error);
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
 * Scores a short answer question using AI
 */
async function scoreShortAnswer(
  userAnswer: string,
  correctAnswer: string,
  explanation: string | undefined,
  points: number
) {
  try {
    const prompt = `Evaluate this short answer listening comprehension question:

Expected Answer: "${correctAnswer}"
Student's Answer: "${userAnswer}"
${explanation ? `Explanation: "${explanation}"` : ''}

Evaluate if the student's answer demonstrates they correctly understood what they heard. Consider:
1. Semantic equivalence (does it mean the same thing?)
2. Key facts and details from the audio
3. Minor wording differences or spelling variations are acceptable if meaning is preserved

Return is_correct as true/false and points_earned (0 to ${points}).`;

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
    console.error('❌ [SCORE-LISTENING] AI evaluation failed for short answer:', error);
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
 * Scores a matching question
 */
function scoreMatching(userAnswer: Record<string, string>, correctAnswer: Record<string, string>, points: number) {
  const correctMatches = Object.keys(correctAnswer).filter(
    key => String(userAnswer[key]) === String(correctAnswer[key])
  ).length;

  const totalMatches = Object.keys(correctAnswer).length;
  const isCorrect = correctMatches === totalMatches;
  const pointsPerMatch = points / totalMatches;
  const pointsEarned = correctMatches * pointsPerMatch;

  return {
    is_correct: isCorrect,
    points_earned: Math.round(pointsEarned * 100) / 100,
    evaluation_data: {
      correct_matches: correctMatches,
      total_matches: totalMatches,
    },
  };
}

/**
 * Scores a sentence reordering question
 */
function scoreSentenceReordering(userAnswer: number[], correctOrder: number[], points: number) {
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

  console.log(`🎯 [SCORE-LISTENING] Scoring ${questionType} question #${question.question_number}`);

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

    case 'short_answer':
      return await scoreShortAnswer(
        String(userAnswer),
        correctAnswer,
        questionBody.explanation,
        maxPoints
      );

    case 'match_the_following':
      return scoreMatching(userAnswer as Record<string, string>, correctAnswer, maxPoints);

    case 'sentence_reordering':
      return scoreSentenceReordering(userAnswer as number[], correctAnswer, maxPoints);

    default:
      console.warn(`⚠️ [SCORE-LISTENING] Unknown question type: ${questionType}`);
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
 * POST endpoint to score listening questions
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

      console.log(`📊 [SCORE-LISTENING] Batch scoring ${answers.length} questions for task ${task_id}`);

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
          console.warn(`⚠️ [SCORE-LISTENING] Question ${answer.question_id} not found`);
          continue;
        }

        const scoreResult = await scoreQuestion(question, answer.user_answer);

        scoredResults.push({
          question_id: answer.question_id,
          question_number: question.question_number,
          ...scoreResult,
        });

        // Save to listening_scores table
        await supabase.from('listening_scores').insert({
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

      console.log(`✅ [SCORE-LISTENING] Batch scoring complete: ${totalPointsEarned}/${totalPointsPossible} (${percentageScore.toFixed(1)}%)`);

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

      console.log(`🎯 [SCORE-LISTENING] Scoring single question ${question_id} for task ${task_id}`);

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

      // Save to listening_scores table
      const { error: insertError } = await supabase.from('listening_scores').insert({
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
        console.error('❌ [SCORE-LISTENING] Failed to save score:', insertError);
        return NextResponse.json(
          { error: 'Failed to save score', details: insertError },
          { status: 500 }
        );
      }

      console.log(`✅ [SCORE-LISTENING] Score saved: ${scoreResult.points_earned}/${question.points}`);

      return NextResponse.json({
        success: true,
        question_id,
        question_number: question.question_number,
        ...scoreResult,
        max_points: question.points,
      });
    }

  } catch (error) {
    console.error('💥 [SCORE-LISTENING] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to score listening question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
