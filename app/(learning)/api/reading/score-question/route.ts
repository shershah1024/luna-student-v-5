/**
 * Question Scoring Dispatcher API
 * 
 * Routes scoring requests to the appropriate question-type-specific API
 */

import { NextRequest, NextResponse } from 'next/server';

interface QuestionScoreRequest {
  questionId: string;
  questionType: string;
  userAnswer: string;
  userId: string;
  testId: string;
}

const QUESTION_TYPE_API_MAP: Record<string, string> = {
  'multiple_choice': '/api/reading/score-multiple-choice',
  'true_false': '/api/reading/score-true-false',
  'fill_in_the_blank': '/api/reading/score-fill-in-blank',
  'match_the_following': '/api/reading/score-matching',
  'source_selection': '/api/reading/score-multiple-choice', // Same logic as multiple choice
  'location_selection': '/api/reading/score-multiple-choice', // Same logic as multiple choice
  'scenario_matching': '/api/reading/score-matching', // Same logic as matching
  'opinion_matching': '/api/reading/score-matching', // Same logic as matching
  'person_statement_matching': '/api/reading/score-matching', // Same logic as matching
  'heading_paragraph_matching': '/api/reading/score-matching', // Same logic as matching
  'text_completion': '/api/reading/score-multiple-choice', // Same logic as multiple choice
  'comment_statement_matching': '/api/reading/score-matching', // Same logic as matching
  'advanced_text_completion': '/api/reading/score-multiple-choice', // Same logic as multiple choice
  'advanced_segment_ordering': '/api/reading/score-matching', // Same logic as matching
};

export async function POST(request: NextRequest) {
  try {
    const body: QuestionScoreRequest = await request.json();
    const { questionType, ...requestData } = body;

    // Validation
    if (!questionType) {
      return NextResponse.json(
        { success: false, error: 'Question type is required' },
        { status: 400 }
      );
    }

    // Get the appropriate API endpoint
    const apiEndpoint = QUESTION_TYPE_API_MAP[questionType];
    if (!apiEndpoint) {
      return NextResponse.json(
        { success: false, error: `Unsupported question type: ${questionType}` },
        { status: 400 }
      );
    }

    // Forward the request to the specific API
    const apiUrl = new URL(apiEndpoint, request.url);
    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    // Forward the response
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('Question scoring dispatcher error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}