/**
 * System Instructions Index
 * Centralized access to all conversation partner instructions with CEFR level support
 */

import { SUPPORTIVE_PARTNER_INSTRUCTION } from './supportive-partner';
import { TARGET_LANGUAGE_ONLY_INSTRUCTION } from './target-language-only';
import { DEBATE_PARTNER_INSTRUCTION } from './debate-partner';
import { STORYTELLING_PARTNER_INSTRUCTION } from './storytelling-partner';

export type InstructionType = 'SUPPORTIVE_PARTNER' | 'TARGET_LANGUAGE_ONLY' | 'DEBATE_PARTNER' | 'STORYTELLING_PARTNER';

export const SYSTEM_INSTRUCTIONS: Record<InstructionType, string> = {
  SUPPORTIVE_PARTNER: SUPPORTIVE_PARTNER_INSTRUCTION,
  TARGET_LANGUAGE_ONLY: TARGET_LANGUAGE_ONLY_INSTRUCTION,
  DEBATE_PARTNER: DEBATE_PARTNER_INSTRUCTION,
  STORYTELLING_PARTNER: STORYTELLING_PARTNER_INSTRUCTION,
};

/**
 * CEFR Level-Specific Guidelines
 */
const CEFR_GUIDELINES: Record<string, string> = {
  'A1': `**CEFR A1 LEVEL - BEGINNER**
Your language MUST be:
- ONLY present tense - NO past or future tense at A1
- Very simple sentences (3-5 words typical)
- Common, everyday vocabulary only (family, food, numbers, greetings, basic verbs like "like", "have", "eat", "drink")
- Speak slowly, use repetition
- Ask simple yes/no questions or basic "what/where/when" questions in PRESENT TENSE ONLY
- Accept very short responses (even single words or short phrases are excellent)
- Be VERY patient with frequent grammar errors - focus on understanding
- Examples:
  * "What is your name?"
  * "Do you like pizza?"
  * "What do you eat for breakfast?" (NOT "What did you eat?")
  * "I like apples. Do you like apples?"
- ABSOLUTELY FORBIDDEN: past tense (ate, went, was), future tense (will eat, going to), perfect tenses`,

  'A2': `**CEFR A2 LEVEL - ELEMENTARY**
Your language should be:
- Present tense AND simple past tense (regular verbs preferred) - (5-10 words typical)
- Everyday vocabulary about routine situations (shopping, hobbies, work, travel)
- Some compound sentences with "and", "but", "or"
- You MAY ask about past events using simple past tense
- Accept responses with some errors - they're learning to express more
- Begin introducing basic connectors (because, when, so)
- Examples:
  * "What did you do yesterday?" (A2 can handle simple past)
  * "I went to the store. Where do you buy food?"
- AVOID: perfect tenses (have eaten), subjunctive, complex past forms`,

  'B1': `**CEFR B1 LEVEL - INTERMEDIATE**
Your language should be:
- More varied sentence structures with subordinate clauses
- Good range of vocabulary on familiar topics
- Mix of tenses (present, past, future, perfect)
- Ask opinion questions and encourage justification
- Accept errors but expect general grammatical control
- Use some idiomatic expressions naturally
- Challenge them to explain, describe, and narrate`,

  'B2': `**CEFR B2 LEVEL - UPPER INTERMEDIATE**
Your language should be:
- Complex sentences with multiple clauses
- Sophisticated vocabulary and some technical terms
- Full range of tenses including subjunctive
- Engage in abstract discussions, hypotheticals
- Expect good grammatical accuracy
- Use idioms and discourse markers naturally`,

  'C1': `**CEFR C1 LEVEL - ADVANCED**
Your language should be:
- Highly sophisticated structures with varied complexity
- Precise, nuanced vocabulary choices
- Implicit meanings, subtle distinctions
- Engage in abstract, complex discussions
- Expect near-native grammatical control`,

  'C2': `**CEFR C2 LEVEL - MASTERY**
Your language should be:
- Native-like complexity and sophistication
- Extensive vocabulary with precise connotations
- Expect virtually perfect grammar
- Engage as intellectual equals`
};

/**
 * Helper function to apply parameters to system instruction
 * Replaces {{param}} placeholders with actual values AND injects CEFR guidelines
 */
export function applyInstructionParams(
  instruction: string,
  params: Record<string, string>
): string {
  let processedInstruction = instruction;

  // First, inject CEFR guidelines if the instruction contains the placeholder
  const level = params.level || 'A1';
  const cefrGuideline = CEFR_GUIDELINES[level] || CEFR_GUIDELINES['A1'];

  // Replace the CEFR guidelines placeholder
  processedInstruction = processedInstruction.replace(
    /\$\{getLevelGuidelines\('{{level}}'\)\}/g,
    cefrGuideline
  );

  // Then replace all other parameters
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    processedInstruction = processedInstruction.replace(
      new RegExp(placeholder, 'g'),
      value || ''
    );
  });

  // Remove any remaining empty placeholders
  processedInstruction = processedInstruction.replace(/{{[^}]+}}/g, '');

  return processedInstruction;
}

/**
 * Get a configured system instruction with parameters applied
 */
export function getSystemInstruction(
  type: InstructionType,
  params?: {
    level?: string;
    topic?: string;
    instructions?: string;
    language?: string;
  }
): string {
  const instruction = SYSTEM_INSTRUCTIONS[type];

  if (!instruction) {
    throw new Error(`System instruction type '${type}' not found`);
  }

  const defaultParams = {
    level: 'A1',
    topic: 'General conversation',
    instructions: 'Have a natural conversation about the topic.',
    language: 'the target language',
    ...params
  };

  return applyInstructionParams(instruction, defaultParams);
}

/**
 * Example usage:
 *
 * import { getSystemInstruction } from '@/lib/system-instructions';
 *
 * // For general conversation at A1
 * const supportiveInstruction = getSystemInstruction('SUPPORTIVE_PARTNER', {
 *   level: 'A1',
 *   topic: 'Shopping at the supermarket',
 *   language: 'German',
 *   instructions: 'Practice asking about food items'
 * });
 *
 * // For debates at B1
 * const debateInstruction = getSystemInstruction('DEBATE_PARTNER', {
 *   level: 'B1',
 *   topic: 'Should homework be banned?',
 *   language: 'Spanish'
 * });
 */
