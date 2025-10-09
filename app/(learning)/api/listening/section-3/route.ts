import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getExamIdFromTestId } from '@/utils/examLookup'
import { scoreTelcA1Section3 } from './scoring'

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Universal scoring handles all data formats - no need for specific validation functions

export async function POST(req: NextRequest) {
  try {
    console.log('[TELC-A1-LISTENING-SECTION-3 API] POST request received')
    
    // Get user ID from auth
    const { userId } = await auth()
    const testUserId = userId || "test_user_performance"
    if (!testUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get submission data from request
    const { test_id, answers } = await req.json()
    
    console.log('[TELC-A1-LISTENING-SECTION-3 API] Request data:', {
      test_id,
      answers,
      answersCount: answers ? Object.keys(answers).length : 0
    })

    if (!test_id || !answers) {
      return NextResponse.json(
        { error: "Missing required fields: test_id or answers" },
        { status: 400 }
      )
    }

    // Fetch the correct answers from the database
    const { data: testData, error: fetchError } = await supabase
      .from("listening_tests")
      .select("question_data")
      .eq("test_id", test_id)
      .eq("course", "telc_a1")
      .eq("section", 3)
      .single()

    console.log('[TELC-A1-LISTENING-SECTION-3 API] Database fetch result:', { testData, fetchError })

    if (fetchError || !testData) {
      console.error("Error fetching test data:", fetchError)
      return NextResponse.json(
        { error: "Test not found or invalid test_id" },
        { status: 404 }
      )
    }

    // Parse question data
    let questionData = testData.question_data
    
    if (typeof questionData === "string") {
      try {
        questionData = JSON.parse(questionData)
      } catch (e) {
        console.error("Failed to parse question_data:", e)
        return NextResponse.json(
          { error: "Invalid question data format" },
          { status: 500 }
        )
      }
    }

    console.log('[TELC-A1-LISTENING-SECTION-3 API] Parsed question data:', questionData)

    // Use the dedicated scoring function for TELC A1 Section 3
    const scoreResult = scoreTelcA1Section3(questionData, answers)
    
    console.log('[TELC-A1-LISTENING-SECTION-3 API] Score result:', scoreResult)

    // Auto-fetch exam_id
    const examId = await getExamIdFromTestId(test_id, "listening")

    // Check if a score already exists for this user/test/section
    const { data: existingScore } = await supabase
      .from("listening_scores")
      .select("id")
      .eq("user_id", testUserId)
      .eq("test_id", test_id)
      .eq("section", 3)
      .single()

    let savedScore
    let saveError

    if (existingScore) {
      // Update existing score
      const { data, error } = await supabase
        .from("listening_scores")
        .update({
          score: scoreResult.score,
          total_score: scoreResult.totalScore,
          exam_id: examId,
          answers: answers,
          validation_results: scoreResult.results,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingScore.id)
        .select()
      savedScore = data
      saveError = error
    } else {
      // Insert new score
      const { data, error } = await supabase
        .from("listening_scores")
        .insert({
          user_id: testUserId,
          test_id,
          course: "telc_a1",
          section: 3,
          score: scoreResult.score,
          total_score: scoreResult.totalScore,
          exam_id: examId,
          answers: answers,
          validation_results: scoreResult.results,
          created_at: new Date().toISOString(),
        })
        .select()
      savedScore = data
      saveError = error
    }

    if (saveError) {
      console.error("Error saving score:", saveError)
      return NextResponse.json(
        { error: "Failed to save score" },
        { status: 500 }
      )
    }

    // Return validation results
    return NextResponse.json({
      success: true,
      score: {
        correct: scoreResult.score,
        total: scoreResult.totalScore,
        percentage: scoreResult.percentage
      },
      results: scoreResult.results,
      saved_data: savedScore,
    })
  } catch (error) {
    console.error("Error in TELC A1 Listening Section 3 API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET method to retrieve existing submissions
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    const testUserId = userId || "test_user_performance"
    if (!testUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('test_id')

    if (!testId) {
      return NextResponse.json({ error: "Missing test_id" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("listening_scores")
      .select("*")
      .eq("user_id", testUserId)
      .eq("test_id", testId)
      .eq("section", 3)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching existing score:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch (error) {
    console.error("Error in TELC A1 Listening Section 3 GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}