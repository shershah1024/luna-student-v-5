import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to sanitize question data by removing correct answers
function sanitizeQuestionData(questionData: any) {
  if (!questionData) return questionData;

  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(questionData));

  // Handle different question data structures
  if (sanitized.text_contents && Array.isArray(sanitized.text_contents)) {
    // Standard structure with text_contents
    sanitized.text_contents.forEach((content: any) => {
      if (content.questions && Array.isArray(content.questions)) {
        content.questions.forEach((question: any) => {
          // Remove correct_answer field
          delete question.correct_answer;
          delete question.explanation;  // Remove explanations for security

          // If there are options with is_correct flag, remove it
          if (question.options && Array.isArray(question.options)) {
            question.options.forEach((option: any) => {
              delete option.is_correct;
              delete option.explanation;  // Remove option explanations for security
            });
          }
        });
      }
    });
  } else if (sanitized.questions && Array.isArray(sanitized.questions)) {
    // Direct questions array structure
    sanitized.questions.forEach((question: any) => {
      delete question.correct_answer;
      delete question.explanation;  // Remove explanations for security

      if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option: any) => {
          delete option.is_correct;
          delete option.explanation;  // Remove option explanations for security
        });
      }
    });
  }

  return sanitized;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { paperId: string } },
) {
  const { userId } = await auth();

  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paperId = params.paperId;

  // Get the section from the query params if provided
  const { searchParams } = request.nextUrl;
  const section = searchParams.get("section");
  const course = searchParams.get("course");
  
  console.log(`[API Reading] Request for paperId: ${paperId}, section: ${section}, course: ${course}`);
  console.log(`[API Reading] User ID: ${userId}`);

  try {
    // Fetch the reading paper from Supabase
    let query = supabase
      .from("reading_tests")
      .select("*")
      .eq("test_id", paperId);

    // Add course filter if provided
    if (course) {
      query = query.eq("course", course);
    }

    // Add section filter if provided
    if (section) {
      query = query.eq("section", parseInt(section));
    }

    const { data, error } = await query;
    
    console.log(`[API Reading] Query result - Found ${data?.length || 0} records`);
    console.log(`[API Reading] Query error:`, error);

    if (error) {
      console.error("[API Reading] Error fetching reading paper:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log(`[API Reading] No data found for paperId: ${paperId}, section: ${section}, course: ${course}`);
      
      // Let's also check what papers exist for debugging
      const { data: allPapers } = await supabase
        .from("reading_tests")
        .select("test_id, course, section")
        .limit(10);
      
      console.log(`[API Reading] Available papers (first 10):`, allPapers?.map(p => `${p.test_id} (${p.course}, section ${p.section})`));
      
      return NextResponse.json({ 
        error: "Paper not found",
        debug: {
          requested: { paperId, section, course },
          availablePapers: allPapers?.slice(0, 5) // Only show first 5 for brevity
        }
      }, { status: 404 });
    }

    // If section is specified, return only the first matching row
    if (section) {
      let questionData = data[0].question_data;
      if (typeof questionData === "string") {
        try {
          questionData = JSON.parse(questionData);
        } catch (e) {
          console.warn("Failed to parse question_data as JSON:", e);
        }
      }

      // Sanitize question data - remove correct answers for security
      const sanitizedQuestionData = sanitizeQuestionData(questionData);

      const parsedData = {
        ...sanitizedQuestionData,
        section: data[0].section,
        test_id: data[0].test_id,
        created_at: data[0].created_at,
        course: data[0].course,
      };
      return NextResponse.json(parsedData);
    }

    // Otherwise, return all sections for this test_id
    const parsedData = data.map((row) => {
      let questionData = row.question_data;
      if (typeof questionData === "string") {
        try {
          questionData = JSON.parse(questionData);
        } catch (e) {
          console.warn("Failed to parse question_data as JSON:", e);
        }
      }

      // Sanitize question data - remove correct answers for security
      const sanitizedQuestionData = sanitizeQuestionData(questionData);

      return {
        ...sanitizedQuestionData,
        section: row.section,
        test_id: row.test_id,
        created_at: row.created_at,
        course: row.course,
      };
    });
    return NextResponse.json(parsedData);
  } catch (err) {
    console.error(`[API Reading] Error processing request for ${paperId}:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
