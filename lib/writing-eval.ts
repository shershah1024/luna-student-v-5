import { z } from 'zod';

export function buildEvaluationPrompt(args: {
  learnerResponse: string;
  assignmentContent: any;
  ratingParameters: { id: string; label?: string; guidelines: string; max_score: number }[];
}) {
  const { learnerResponse, assignmentContent, ratingParameters } = args;
  const topic = assignmentContent?.topic || assignmentContent?.other_details?.topic || 'Writing Task';
  const level = assignmentContent?.cefr_level || assignmentContent?.other_details?.cefr_level || 'A1';

  const critLines = ratingParameters
    .map(p => `- ${p.id}${p.label ? ` (${p.label})` : ''}: max ${p.max_score}. Guidelines: ${p.guidelines}`)
    .join('\n');

  return `You are an expert examiner. Evaluate the student's writing strictly at CEFR ${level}.
Use the parameters provided and score each objectively, as if guiding a human rater.
Rules for scoring:
- Score each parameter from 0 to its max_score; use whole numbers.
- Base comments on observable evidence (what is present in the text), avoid vague language.
- Consider CEFR ${level} expectations: do not penalize for features above level if overall clarity is fine; do penalize when expectations for ${level} are not met.
- Total score is the sum of parameter scores.
Comment style:
- One concise sentence explaining why the score is justified for this parameter at ${level}.

Context:
- Topic: ${topic}
- CEFR Level: ${level}

Parameters:
${critLines}

Student Response:
"""
${learnerResponse}
"""`;
}

export function buildEvaluationSchema(params: { id: string; max_score: number }[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    total_score: z.number(),
    max_score: z.number()
  };
  for (const p of params) {
    shape[p.id] = z.object({
      comment: z.string(),
      score: z.number(),
      max_score: z.number()
    });
  }
  return z.object(shape);
}

