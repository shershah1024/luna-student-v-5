import { generateObject } from 'ai';
import { createAzure } from "@ai-sdk/azure";
import { z } from 'zod';
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure("o4-mini");

const GrammarErrorSchema = z.object({
  error: z.string().describe("The incorrect text or phrase from the essay"),
  correction: z.string().describe("The corrected version"),
  grammar_category: z.enum([
    "ARTICLES", 
    "NOUN_CASES", 
    "VERB_CONJUGATION", 
    "VERB_POSITION", 
    "ADJECTIVE_ENDINGS", 
    "PRONOUN_CASES", 
    "CAPITALIZATION", 
    "SPELLING", 
    "WORD_ORDER", 
    "PREPOSITIONS", 
    "PLURAL_FORMS", 
    "GENDER_AGREEMENT", 
    "SEPARABLE_VERBS", 
    "MODAL_VERBS", 
    "SENTENCE_STRUCTURE", 
    "PUNCTUATION"
  ]).describe("The standardized German grammar category of the error"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).describe("How serious this error is for A1 level communication"),
  explanation: z
    .string()
    .describe("Brief explanation of the grammar rule or reason for correction"),
});

const CategoryEvaluationSchema = z.object({
  score: z
    .number()
    .describe(
      "Score for this category, following the Goethe A1 writing assessment criteria.",
    ),
  max_score: z.number(),
  comment: z
    .string()
    .describe(
      "Detailed explanation referencing the assessment criteria and candidate performance.",
    ),
  examples: z
    .array(z.string())
    .optional()
    .describe("Examples from the essay that justify the score."),
  final_comment: z
    .string()
    .describe(
      "Constructive feedback for improvement, addressing the learner directly.",
    ),
});

const EssayEvaluationSchema = z.object({
  overall_evaluation: z
    .string()
    .describe(
      "Summarize the essay performance according to Goethe A1 writing assessment criteria. Provide detailed constructive feedback.",
    ),
  parameter_evaluations: z.object({
    task_completion: CategoryEvaluationSchema,
    communicative_design: CategoryEvaluationSchema,
  }),
  grammar_errors: z
    .array(GrammarErrorSchema)
    .describe(
      "List of specific grammar errors found in the text with corrections and explanations",
    ),
  total_score: z
    .number()
    .describe(
      "The total score for the essay, calculated as the sum of all category scores",
    ),
  max_total_score: z.number(),
  score_breakdown: z
    .object({
      content_points: z
        .array(z.number())
        .describe("Array of scores for each content point (e.g., [3, 1.5, 0])"),
      communicative_design: z
        .number()
        .describe("Score for communicative design (1, 0.5, or 0)"),
    })
    .describe(
      "Structured score breakdown showing individual scores for each content point and communicative design",
    ),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  const { question_data, learner_response, task_id }: { 
    question_data: string; 
    learner_response: string; 
    task_id: string;
  } = await req.json();

  // Authenticate user
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Save the response to the database first
  try {
    const respData = {
      user_id: userId,
      task_id: task_id,
      course: "goethe_a1",
      section: 2,
      task_type: "essay",
      prompt: question_data,
      response: learner_response,
      score: 0, // Will be updated after evaluation
      total_score: 10, // A1 writing max score
    };

    const { error: respError } = await supabase
      .from("lesson_writing_scores")
      .insert(respData);

    if (respError) {
      console.error("Error saving response data:", respError);
    }
  } catch (dbError) {
    console.error("Database error when saving response:", dbError);
  }

  const result = await generateObject({
    model: model,
    system: `You are an expert Goethe A1 German examiner. Evaluate the following writing response according to the official Goethe-Institut A1 writing assessment criteria. In the feedback, address the student directly as a teacher.

For each of the following assessment categories, use the detailed guidelines and descriptors below:

Task Completion (per content point) (max 3 points per content point):
- 3 Points: Task fully completed and comprehensible
- 1.5 Points: Task partially completed due to linguistic or content deficiencies
- 0 Points: Task not completed and/or incomprehensible

Communicative Design of the Text (max 1 point):
- 1 Point: Text format appropriate
- 0.5 Points: Atypical or missing phrases, e.g., no greeting
- 0 Points: No text format-specific phrases

The maximum total score is 10 points (3 + 3 + 3 + 1) for a writing task with 3 content points.

Additionally, identify specific grammar errors in the text. For each error, provide:
1. The incorrect text or phrase
2. The corrected version
3. A brief explanation of the grammar rule or reason for correction

Apply these assessment principles:
- Award points as specified in the criteria
- Focus on communication effectiveness rather than perfect grammar
- Consider whether the message is comprehensible despite errors
- Evaluate whether the text format is appropriate (e.g., letter, email, note)

Each category object must include: score, max_score, comment (referencing the criteria above and candidate performance), examples (from the text), and final_comment (constructive feedback for improvement, addressing the learner directly).

Also include a separate section with a list of specific grammar errors found in the text.

IMPORTANT: You MUST include a score_breakdown field with a structured object containing:
1. content_points: An array of numbers representing the score for each content point (e.g., [3, 1.5, 0])
2. communicative_design: A number representing the communicative design score (1, 0.5, or 0)

IMPORTANT: You MUST include a total_score field that represents the sum of all category scores. This field is required and cannot be omitted.

At the end, provide an overall evaluation summarizing the candidate's strengths and areas for improvement.

The evaluation and feedback should be in English. All explanations should be in English, even for the reasons for scoring`,
    prompt: `Question Data: ${question_data}

Learner's Response:
${learner_response}`,
    schema: EssayEvaluationSchema,
    temperature: 1,
  });

  // Update the evaluation data to the writing_scores table
  try {
    const evalData = {
      score: result.object.total_score,
      total_score: 10, // A1 writing max score
      evaluation_data: {
        task_completion: result.object.parameter_evaluations.task_completion,
        communicative_design: result.object.parameter_evaluations.communicative_design,
        grammar_errors: result.object.grammar_errors,
        score_breakdown: result.object.score_breakdown,
        overall_evaluation: result.object.overall_evaluation,
      },
    };

    // Update the record we just inserted with the evaluation results
    const { error: evalError } = await supabase
      .from("lesson_writing_scores")
      .update(evalData)
      .eq("user_id", userId)
      .eq("task_id", task_id)
      .eq("course", "goethe_a1")
      .eq("section", 2);

    if (evalError) {
      console.error("Error updating evaluation data:", evalError);
    }
  } catch (evalDbError) {
    console.error("Database error when saving evaluation:", evalDbError);
  }

  return result.toJsonResponse();
}