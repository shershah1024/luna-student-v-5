import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getExamIdFromTestId } from "@/utils/examLookup";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// TypeScript interfaces matching the actual database structure
interface TelcA1Section2Option {
  is_correct: boolean;
  explanation: string;
  website_url: string;
  website_name: string;
  option_letter: "a" | "b";
  website_content: string;
}

interface TelcA1Section2Question {
  options: TelcA1Section2Option[];
  is_example: boolean;
  explanation: string;
  scenario_text: string;
  correct_answer: "a" | "b";
  question_number: number;
}

interface TelcA1Section2DatabaseData {
  questions: TelcA1Section2Question[];
  main_title: string;
  overall_instructions_text: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[TELC-A1-SECTION-2 API] POST request received');
    
    // Get user ID from auth
    const { userId } = await auth();
    const testUserId = userId || "test_user_performance";
    if (!testUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get submission data from request
    const { test_id, answers } = await req.json();
    
    console.log('[TELC-A1-SECTION-2 API] Request data:', {
      test_id,
      answers,
      answersCount: answers ? Object.keys(answers).length : 0
    });

    if (!test_id || !answers) {
      return NextResponse.json(
        { error: "Missing required fields: test_id or answers" },
        { status: 400 }
      );
    }

    // Fetch the correct answers from the database
    const { data: testData, error: fetchError } = await supabase
      .from("reading_tests")
      .select("question_data, revised_question_data")
      .eq("test_id", test_id)
      .eq("course", "telc_a1")
      .eq("section", 2)
      .single();

    console.log('[TELC-A1-SECTION-2 API] Database fetch result:', { testData, fetchError });

    if (fetchError || !testData) {
      console.error("Error fetching test data:", fetchError);
      return NextResponse.json(
        { error: "Test not found or invalid test_id" },
        { status: 404 }
      );
    }

    // Parse question data - try revised_question_data first, then question_data
    let questionData: TelcA1Section2DatabaseData = testData.revised_question_data || testData.question_data;
    
    if (typeof questionData === "string") {
      try {
        questionData = JSON.parse(questionData);
      } catch (e) {
        console.error("Failed to parse question_data:", e);
        return NextResponse.json(
          { error: "Invalid question data format" },
          { status: 500 }
        );
      }
    }

    console.log('[TELC-A1-SECTION-2 API] Parsed question data:', questionData);

    // Calculate score by comparing answers with correct answers
    let correctCount = 0;
    let totalQuestions = 0;
    const results: any[] = [];

    console.log('[TELC-A1-SECTION-2 API] Processing questions:', questionData.questions.length);
    
    questionData.questions.forEach((question) => {
      // Skip example questions for scoring
      if (question.is_example) {
        console.log(`[TELC-A1-SECTION-2 API] Skipping example question ${question.question_number}`);
        return;
      }

      totalQuestions++;
      const questionNumber = question.question_number;
      const userAnswer = answers[questionNumber];
      const correctAnswer = question.correct_answer;
      const isCorrect = userAnswer === correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }

      // Get the selected option for detailed feedback
      const selectedOption = question.options.find((opt) => opt.option_letter === userAnswer);
      const correctOption = question.options.find((opt) => opt.option_letter === correctAnswer);

      console.log(`[TELC-A1-SECTION-2 API] Question ${questionNumber}:`, {
        userAnswer,
        correctAnswer,
        isCorrect
      });

      results.push({
        question_number: questionNumber,
        user_answer: userAnswer,
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        explanation: selectedOption?.explanation || correctOption?.explanation || question.explanation,
        scenario_text: question.scenario_text,
      });
    });

    const score = correctCount;
    const totalScore = totalQuestions;
    const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;

    console.log('[TELC-A1-SECTION-2 API] Final score:', {
      score,
      totalScore,
      percentage
    });

    // Auto-fetch exam_id
    const examId = await getExamIdFromTestId(test_id, "reading");

    // Check if a score already exists for this user/test/section
    const { data: existingScore } = await supabase
      .from("reading_scores")
      .select("id")
      .eq("user_id", testUserId)
      .eq("test_id", test_id)
      .eq("section", 2)
      .single();

    let savedScore;
    let saveError;

    if (existingScore) {
      // Update existing score
      const { data, error } = await supabase
        .from("reading_scores")
        .update({
          score,
          total_score: totalScore,
          exam_id: examId,
          answers: answers,
          validation_results: results,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingScore.id)
        .select();
      savedScore = data;
      saveError = error;
    } else {
      // Insert new score
      const { data, error } = await supabase
        .from("reading_scores")
        .insert({
          user_id: testUserId,
          test_id,
          course: "telc_a1",
          section: 2,
          score,
          total_score: totalScore,
          exam_id: examId,
          answers: answers,
          validation_results: results,
          created_at: new Date().toISOString(),
        })
        .select();
      savedScore = data;
      saveError = error;
    }

    if (saveError) {
      console.error("Error saving score:", saveError);
      return NextResponse.json(
        { error: "Failed to save score" },
        { status: 500 }
      );
    }

    // Return validation results
    return NextResponse.json({
      success: true,
      score: {
        correct: score,
        total: totalScore,
        percentage: percentage
      },
      results: results,
      saved_data: savedScore,
    });
  } catch (error) {
    console.error("Error in TELC A1 Section 2 API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET method to retrieve existing submissions
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    const testUserId = userId || "test_user_performance";
    if (!testUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('test_id');

    if (!testId) {
      return NextResponse.json({ error: "Missing test_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reading_scores")
      .select("*")
      .eq("user_id", testUserId)
      .eq("test_id", testId)
      .eq("section", 2)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching existing score:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error("Error in TELC A1 Section 2 GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}