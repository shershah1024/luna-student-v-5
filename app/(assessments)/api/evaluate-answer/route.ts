import { generateObject } from 'ai';
import { createAzure } from "@ai-sdk/azure";
import { z } from 'zod';
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Initialize Azure OpenAI with structured output support
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure("o4-mini"); // Using o4-mini for structured outputs as per instructions

// Schema for category evaluation with detailed scoring
const CategoryEvaluationSchema = z.object({
  score: z
    .number()
    .describe("Score for this category based on the rubric"),
  max_score: z
    .number()
    .describe("Maximum possible score for this category"),
  feedback: z
    .string()
    .describe("Detailed feedback explaining the score and providing constructive guidance"),
  strengths: z
    .array(z.string())
    .optional()
    .describe("Specific strengths demonstrated in this category"),
  improvements: z
    .array(z.string())
    .optional()
    .describe("Specific areas for improvement in this category"),
});

// Schema for essay evaluation with task completion, grammar/vocabulary, and organization
const EssayEvaluationSchema = z.object({
  overall_feedback: z
    .string()
    .describe("Overall evaluation of the essay with constructive feedback"),

  // Category-based evaluations for essays
  parameter_evaluations: z.object({
    task_completion: CategoryEvaluationSchema.describe(
      "How well the essay addresses all parts of the prompt and stays on topic"
    ),
    grammar_vocabulary: CategoryEvaluationSchema.describe(
      "Grammar accuracy, vocabulary usage, and language proficiency appropriate to the level"
    ),
    organization: CategoryEvaluationSchema.describe(
      "Essay structure, coherence, transitions, and logical flow of ideas"
    ),
  }),

  // Total scoring
  total_score: z
    .number()
    .describe("Total score calculated from all categories"),
  max_total_score: z
    .number()
    .describe("Maximum possible total score"),

  // General strengths and improvements for backward compatibility
  strengths: z
    .array(z.string())
    .describe("Overall strengths demonstrated in the essay"),
  improvements: z
    .array(z.string())
    .describe("Key areas for improvement"),
});

// Schema for simpler question types (backward compatibility)
const SimpleEvaluationSchema = z.object({
  score: z.number().describe("Score earned for this answer"),
  feedback: z.string().describe("Feedback about the answer"),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      question_type,
      question,
      user_answer,
      sample_answer,
      grading_criteria,
      max_points,
      min_words,
      max_words,
    } = body;

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!question_type || !question || !user_answer) {
      return Response.json({
        error: "Missing required fields: question_type, question, and user_answer are required"
      }, { status: 400 });
    }

    // Handle essay questions with detailed evaluation
    if (question_type === 'essay') {
      const wordCount = user_answer.trim().split(/\s+/).filter((word: string) => word.length > 0).length;

      const result = await generateObject({
        model: model,
        system: `You are an experienced language teacher evaluating student essays.

Evaluate the essay based on these three categories:

1. Task Completion (${Math.ceil(max_points * 0.4)} points max):
   - Does the essay fully address all parts of the prompt?
   - Are all required points covered?
   - Is the response relevant and on-topic?

2. Grammar & Vocabulary (${Math.ceil(max_points * 0.3)} points max):
   - Grammar accuracy and complexity appropriate to level
   - Vocabulary range and appropriateness
   - Spelling and punctuation

3. Organization (${Math.ceil(max_points * 0.3)} points max):
   - Clear introduction, body, and conclusion
   - Logical flow of ideas
   - Effective use of transitions
   - Paragraph structure

Word count requirement: ${min_words}-${max_words} words (actual: ${wordCount} words)

For each category:
- Provide a score based on the maximum for that category
- Give specific feedback with examples from the essay
- List 1-2 strengths if applicable
- List 1-2 areas for improvement

Be encouraging but honest. Focus on helping the student improve.`,

        prompt: `Evaluate this essay response:

Question: ${question}

Student's Essay (${wordCount} words):
${user_answer}

${sample_answer ? `\nSample Answer:\n${sample_answer}` : ''}
${grading_criteria?.length > 0 ? `\nGrading Criteria:\n${grading_criteria.map((c: string) => `- ${c}`).join('\n')}` : ''}

Maximum Points: ${max_points}
Word Count Requirement: ${min_words}-${max_words} words`,

        schema: EssayEvaluationSchema,
        temperature: 0.3,
      });

      // Transform the response to match frontend expectations
      const evaluation = result.object;

      return Response.json({
        score: evaluation.total_score,
        feedback: evaluation.overall_feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        parameter_evaluations: evaluation.parameter_evaluations,
        total_score: evaluation.total_score,
        max_total_score: evaluation.max_total_score,
      });
    }

    // Handle other question types with simple evaluation
    else {
      const result = await generateObject({
        model: model,
        system: `You are a helpful language teacher evaluating student answers.
        Provide constructive feedback that helps students learn.
        Be encouraging but accurate in your assessment.`,

        prompt: `Evaluate this answer:

Question Type: ${question_type}
Question: ${question}
Student Answer: ${user_answer}
${sample_answer ? `Correct/Sample Answer: ${sample_answer}` : ''}
Maximum Points: ${max_points || 5}`,

        schema: SimpleEvaluationSchema,
        temperature: 0.3,
      });

      return Response.json(result.object);
    }

  } catch (error) {
    console.error('Error evaluating answer:', error);
    return Response.json(
      {
        error: "Failed to evaluate answer",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}