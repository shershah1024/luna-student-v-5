import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserResponse {
  question_id: string;
  response_text: string;
}

interface ScoreRequest {
  user_id: string;
  test_id: string;
  exam_id?: string; // Optional for backward compatibility
  session_id?: string; // Optional for backward compatibility
  responses: UserResponse[];
  time_spent_seconds?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScoreRequest = await request.json();
    const { user_id, test_id, exam_id, session_id, responses, time_spent_seconds } = body;

    // Get exam_id if not provided (for backward compatibility)
    let resolvedExamId = exam_id;
    let resolvedSessionId = session_id;
    
    if (!resolvedExamId) {
      const { data: examData } = await supabase
        .from('reading_exams')
        .select('exam_id')
        .eq('test_id', test_id)
        .single();
      resolvedExamId = examData?.exam_id;
    }

    // Create or get session
    if (!resolvedSessionId && resolvedExamId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_exam_sessions')
        .insert({
          user_id,
          exam_id: resolvedExamId,
          status: 'in_progress'
        })
        .select('id')
        .single();
      
      if (!sessionError && sessionData) {
        resolvedSessionId = sessionData.id;
      }
    }

    // Prepare the scoring data
    const scoringResults = [];
    let totalQuestions = responses.length;
    let correctAnswers = 0;

    // Score each response and store in database
    for (const response of responses) {
      // Get the correct answer for this question
      const { data: questionData, error: questionError } = await supabase
        .from('reading_questions_v3')
        .select('correct_answer, is_example')
        .eq('id', response.question_id)
        .single();

      if (questionError || !questionData) {
        console.error('Question not found:', response.question_id);
        continue;
      }

      // Skip example questions from scoring
      if (questionData.is_example) {
        totalQuestions--;
        continue;
      }

      const isCorrect = response.response_text === questionData.correct_answer;
      if (isCorrect) correctAnswers++;

      // Store the user response with full traceability
      const { error: insertError } = await supabase
        .from('reading_user_responses_v3')
        .insert({
          user_id,
          question_id: response.question_id,
          response_text: response.response_text,
          is_correct: isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          time_spent_seconds,
          session_id: resolvedSessionId,
          exam_id: resolvedExamId
        });

      if (insertError) {
        console.error('Error storing response:', insertError);
      }

      scoringResults.push({
        question_id: response.question_id,
        correct: isCorrect,
        user_answer: response.response_text,
        correct_answer: questionData.correct_answer
      });
    }

    // Calculate final score
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Update session with final results
    if (resolvedSessionId) {
      await supabase
        .from('user_exam_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          overall_score: percentage,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          time_spent_seconds
        })
        .eq('id', resolvedSessionId);
    }

    // Return comprehensive results
    const results = {
      score: percentage,
      correct: correctAnswers,
      total: totalQuestions,
      question_breakdown: scoringResults,
      test_id,
      exam_id: resolvedExamId,
      session_id: resolvedSessionId,
      user_id,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in score-normalized-test API:', error);
    return NextResponse.json(
      { error: 'Failed to score test' },
      { status: 500 }
    );
  }
}