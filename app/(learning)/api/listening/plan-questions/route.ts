// app/api/listening/plan-questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Question types and their recommended points
const QUESTION_TYPE_POINTS = {
  'multiple_choice': 1, // 1 point per question
  'true_false': 1, // 1 point per question  
  'short_answer': 3, // 3 points per question
  'match_the_following': 4, // Average 4 pairs = 4 points (1 point per pair)
  'sentence_reordering': 2, // 2 points per question
  'fill_in_the_blanks': 1, // 1 point per blank
};

// Default number of pairs for matching questions at different levels
const MATCHING_PAIRS_BY_LEVEL = {
  'A1': 3, // 3 pairs for A1 level
  'A2': 4, // 4 pairs for A2 level  
  'B1': 4, // 4 pairs for B1 level
  'B2': 5, // 5 pairs for B2 level
  'C1': 5, // 5 pairs for C1 level
  'C2': 6, // 6 pairs for C2 level
};

/**
 * Level-specific weightage for different CEFR levels
 */
const LEVEL_WEIGHTAGE = {
  'A1': {
    'multiple_choice': 0.45,     // 45% - Simple recognition
    'true_false': 0.35,          // 35% - Basic comprehension
    'fill_in_the_blanks': 0.15,  // 15% - Key vocabulary
    'match_the_following': 0.05, // 5% - Simple connections
    'sentence_reordering': 0.0,  // 0% - Too complex for A1
    'short_answer': 0.0,         // 0% - Too complex for A1
  },
  'A2': {
    'multiple_choice': 0.35,     // 35% - Still important but less dominant
    'true_false': 0.25,          // 25% - Good for factual understanding
    'fill_in_the_blanks': 0.2,   // 20% - More vocabulary work
    'match_the_following': 0.15, // 15% - Better at connections
    'sentence_reordering': 0.03, // 3% - Introduce complexity
    'short_answer': 0.02,        // 2% - Very limited
  },
  'B1': {
    'multiple_choice': 0.3,      // 30% - Balanced approach
    'true_false': 0.2,           // 20% - Less emphasis
    'fill_in_the_blanks': 0.2,   // 20% - Good for details
    'match_the_following': 0.15, // 15% - Logical connections
    'sentence_reordering': 0.1,  // 10% - Understanding structure
    'short_answer': 0.05,        // 5% - Limited open responses
  },
  'B2': {
    'multiple_choice': 0.25,     // 25% - Less reliance on MCQ
    'true_false': 0.15,          // 15% - Reduced emphasis
    'fill_in_the_blanks': 0.2,   // 20% - Detail comprehension
    'match_the_following': 0.15, // 15% - Complex connections
    'sentence_reordering': 0.15, // 15% - Structure understanding
    'short_answer': 0.1,         // 10% - More open responses
  },
  'C1': {
    'multiple_choice': 0.2,      // 20% - Sophisticated options
    'true_false': 0.1,           // 10% - Minimal use
    'fill_in_the_blanks': 0.25,  // 25% - Precise language use
    'match_the_following': 0.15, // 15% - Complex relationships
    'sentence_reordering': 0.2,  // 20% - Advanced structure
    'short_answer': 0.1,         // 10% - Analytical responses
  },
  'C2': {
    'multiple_choice': 0.15,     // 15% - Highly sophisticated
    'true_false': 0.05,          // 5% - Very limited
    'fill_in_the_blanks': 0.3,   // 30% - Nuanced language
    'match_the_following': 0.2,  // 20% - Complex abstractions  
    'sentence_reordering': 0.2,  // 20% - Advanced discourse
    'short_answer': 0.1,         // 10% - Critical thinking
  }
};

/**
 * Algorithmically creates a question plan without AI
 * Uses level-specific weightage for appropriate difficulty distribution
 */
function createAlgorithmicPlan(targetPoints: number, allowedTypes: string[], level: string = 'A1') {
  const questions: any[] = [];
  let remainingPoints = targetPoints;
  let questionNumber = 1;
  
  // Get level-specific weightage, default to A1 if level not found
  const typeWeightage = LEVEL_WEIGHTAGE[level as keyof typeof LEVEL_WEIGHTAGE] || LEVEL_WEIGHTAGE.A1;
  
  // Calculate target number of questions for each type based on weightage
  const estimatedTotalQuestions = Math.max(8, Math.min(20, Math.ceil(targetPoints / 1.5))); // Estimate 8-20 questions
  const typeTargets: { [key: string]: number } = {};
  
  for (const type of allowedTypes) {
    const weight = typeWeightage[type as keyof typeof typeWeightage] || 0.1;
    typeTargets[type] = Math.ceil(estimatedTotalQuestions * weight);
  }
  
  // Sort types by point value (lowest first) for balanced distribution
  const sortedTypes = allowedTypes.sort((a, b) => 
    QUESTION_TYPE_POINTS[a as keyof typeof QUESTION_TYPE_POINTS] - 
    QUESTION_TYPE_POINTS[b as keyof typeof QUESTION_TYPE_POINTS]
  );
  
  // First pass: distribute questions based on weightage, starting with lowest points
  for (const type of sortedTypes) {
    let pointsPerQuestion = QUESTION_TYPE_POINTS[type as keyof typeof QUESTION_TYPE_POINTS];
    
    // For matching questions, adjust points based on level
    if (type === 'match_the_following') {
      const pairsCount = MATCHING_PAIRS_BY_LEVEL[level as keyof typeof MATCHING_PAIRS_BY_LEVEL] || 4;
      pointsPerQuestion = pairsCount; // 1 point per pair
    }
    
    const targetCount = typeTargets[type] || 1;
    const maxAffordable = Math.floor(remainingPoints / pointsPerQuestion);
    const actualCount = Math.min(targetCount, maxAffordable);
    
    for (let i = 0; i < actualCount; i++) {
      const questionData: any = {
        question_number: questionNumber++,
        type,
        points: pointsPerQuestion,
        rationale: `Listening comprehension: ${type} question (${pointsPerQuestion} points) - target ${targetCount} questions for ${level} level.`
      };
      
      // Add metadata for matching questions
      if (type === 'match_the_following') {
        questionData.pairs_count = pointsPerQuestion; // Points = number of pairs
        questionData.rationale = `Listening comprehension: matching question with ${pointsPerQuestion} pairs (1 point per pair) for ${level} level.`;
      }
      
      questions.push(questionData);
      remainingPoints -= pointsPerQuestion;
    }
    
    if (remainingPoints === 0) break;
  }
  
  // Second pass: fill remaining points efficiently
  while (remainingPoints > 0) {
    // Find the best fitting question type
    const availableTypes = allowedTypes.filter(type => 
      QUESTION_TYPE_POINTS[type as keyof typeof QUESTION_TYPE_POINTS] <= remainingPoints
    );
    
    if (availableTypes.length === 0) {
      // Can't reach exact target, adjust the last question
      const lastQuestion = questions[questions.length - 1];
      if (lastQuestion) {
        lastQuestion.points += remainingPoints;
        lastQuestion.rationale = `Adjusted ${lastQuestion.type} question with ${lastQuestion.points} points to reach exact target.`;
      }
      remainingPoints = 0;
    } else {
      // Prefer the lowest point type that fits
      const bestType = availableTypes.sort((a, b) => 
        QUESTION_TYPE_POINTS[a as keyof typeof QUESTION_TYPE_POINTS] - 
        QUESTION_TYPE_POINTS[b as keyof typeof QUESTION_TYPE_POINTS]
      )[0];
      
      let pointsPerQuestion = QUESTION_TYPE_POINTS[bestType as keyof typeof QUESTION_TYPE_POINTS];
      
      // For matching questions, adjust points based on level
      if (bestType === 'match_the_following') {
        const pairsCount = MATCHING_PAIRS_BY_LEVEL[level as keyof typeof MATCHING_PAIRS_BY_LEVEL] || 4;
        pointsPerQuestion = pairsCount; // 1 point per pair
      }
      
      const questionData: any = {
        question_number: questionNumber++,
        type: bestType,
        points: pointsPerQuestion,
        rationale: `Additional ${bestType} question (${pointsPerQuestion} points) to reach exact target.`
      };
      
      // Add metadata for matching questions
      if (bestType === 'match_the_following') {
        questionData.pairs_count = pointsPerQuestion; // Points = number of pairs
        questionData.rationale = `Additional matching question with ${pointsPerQuestion} pairs (1 point per pair) for ${level} level.`;
      }
      
      questions.push(questionData);
      remainingPoints -= pointsPerQuestion;
    }
  }
  
  // Calculate point distribution
  const pointDistribution = {
    multiple_choice_total: questions.filter(q => q.type === 'multiple_choice').reduce((sum, q) => sum + q.points, 0),
    true_false_total: questions.filter(q => q.type === 'true_false').reduce((sum, q) => sum + q.points, 0),
    short_answer_total: questions.filter(q => q.type === 'short_answer').reduce((sum, q) => sum + q.points, 0),
    match_the_following_total: questions.filter(q => q.type === 'match_the_following').reduce((sum, q) => sum + q.points, 0),
    sentence_reordering_total: questions.filter(q => q.type === 'sentence_reordering').reduce((sum, q) => sum + q.points, 0),
    fill_in_the_blanks_total: questions.filter(q => q.type === 'fill_in_the_blanks').reduce((sum, q) => sum + q.points, 0),
  };
  
  const computedTotal = questions.reduce((sum, q) => sum + q.points, 0);
  
  return {
    total_points: computedTotal,
    questions,
    point_distribution: pointDistribution,
    validation: {
      points_match: computedTotal === targetPoints,
      computed_total: computedTotal,
      target_total: targetPoints,
    },
  };
}

// Schema for individual questions in the plan
const QuestionPlanSchema = z.object({
  question_number: z.number().int().min(1),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'match_the_following', 'sentence_reordering', 'fill_in_the_blanks']),
  points: z.number().int().min(1),
  rationale: z.string().min(1), // Why this question type and point value
});

// Schema for the complete plan
const PlanResponseSchema = z.object({
  total_points: z.number().int().min(1),
  questions: z.array(QuestionPlanSchema).min(1),
  point_distribution: z.object({
    multiple_choice_total: z.number().int().min(0),
    true_false_total: z.number().int().min(0),
    short_answer_total: z.number().int().min(0),
    match_the_following_total: z.number().int().min(0),
    sentence_reordering_total: z.number().int().min(0),
    fill_in_the_blanks_total: z.number().int().min(0),
  }),
  validation: z.object({
    points_match: z.boolean(),
    computed_total: z.number().int().min(1),
    target_total: z.number().int().min(1),
  }),
});

/**
 * Creates a question plan for listening quiz
 * POST /api/listening/plan-questions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [QUESTION-PLAN] Starting question planning request');
    
    const body = await request.json();
    const { total_points, question_types, transcript_preview, level = 'A1' } = body;
    
    if (!total_points || !question_types || !Array.isArray(question_types)) {
      return NextResponse.json(
        { error: 'Missing required fields: total_points, question_types' },
        { status: 400 }
      );
    }
    
    console.log('📊 [QUESTION-PLAN] Input:', { 
      total_points, 
      question_types: question_types.length,
      transcript_length: transcript_preview?.length || 0,
      level
    });
    
    // Use algorithmic planning instead of AI
    console.log(`🤖 [QUESTION-PLAN] Using algorithmic planning for ${level} level...`);
    const plan = createAlgorithmicPlan(total_points, question_types, level);
    
    console.log('✅ [QUESTION-PLAN] Plan generated:', {
      total_questions: plan.questions.length,
      computed_total: plan.validation.computed_total,
      target_total: plan.validation.target_total,
      points_match: plan.validation.points_match
    });
    
    // Algorithmic planning guarantees exact point matching
    if (!plan.validation.points_match) {
      console.error('❌ [QUESTION-PLAN] Algorithmic planning failed to match points!', plan.validation);
      return NextResponse.json({
        error: 'Algorithmic plan validation failed',
        details: plan.validation,
        plan
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      plan,
      validation: plan.validation,
      point_guidelines: QUESTION_TYPE_POINTS,
    });
    
  } catch (error) {
    console.error('💥 [QUESTION-PLAN] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question plan', details: (error as Error).message },
      { status: 500 }
    );
  }
}