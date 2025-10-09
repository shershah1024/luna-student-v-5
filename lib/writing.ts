import { writingGuardrails } from './cefr';

export function buildWritingPrompt(args: {
  language: string;
  difficulty_level: string;
  task_type?: string | null;
  topic: string;
  word_count?: number | null;
  writing_focus?: string | null;
  specific_requirements?: string | null;
  text_format?: string | null;
  time_limit?: string | null;
}) {
  const {
    language,
    difficulty_level,
    task_type,
    topic,
    word_count,
    writing_focus,
    specific_requirements,
    text_format,
    time_limit
  } = args;

  return `Create simple but unambiguous writing task instructions strictly aligned to CEFR ${difficulty_level} for ${language} learners.

Output format:
- 5–8 short bullets
- No headings or extra sections (do NOT use "Aufgabe:" or any similar headers)
- Plain text bullets only
- Start directly with the task description

Use the fields:
- Language: ${language}
- CEFR Level: ${difficulty_level}
- Topic: ${topic}
- Word Count: ${word_count || 'optional'}
- Task Type: ${task_type || 'unspecified'}
- Focus: ${writing_focus || 'general writing'}
- Requirements: ${specific_requirements || 'none'}
- Format: ${text_format || 'free'}
- Time Limit: ${time_limit || 'none'}

Content rules:
- Start with a bullet that clearly states the task (e.g., Write a ${task_type || 'short text'} about ${topic}).
- Include word count if provided.
- Add 2–3 bullets describing specific requirements or focus so there is no ambiguity.
- If a format is given, include it in one bullet (e.g., 3 short paragraphs, email format, etc.).
- Keep language simple and student-friendly. No rubrics.
${difficulty_level === 'A1' ? `
- IMPORTANT FOR A1: Add brief English translations in parentheses for key task words
- Example: "Escribe (Write) un texto corto (a short text) sobre (about) la casa ideal (the ideal house)"
- Only translate essential task instructions, not every word
- Keep translations brief and in parentheses` : ''}

${writingGuardrails(difficulty_level, language)}

Strictly avoid requirements that exceed the level.
Never start with "Aufgabe:" or similar task headers - begin directly with the instructions.`;
}

