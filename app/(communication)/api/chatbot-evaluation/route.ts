import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * CEFR Level Criteria for Evaluation
 * These criteria help the AI understand what constitutes each level
 */
const CEFR_CRITERIA = {
  A1: {
    grammar: "Uses ONLY basic present tense. Simple sentences with common verbs (be, have, go, like, eat, drink). Past/future tense should NOT be expected at A1. May have frequent errors but meaning is clear.",
    vocabulary: "Basic everyday words (greetings, numbers, family, food). Limited vocabulary range but appropriate for simple needs.",
    communication: "Can communicate basic needs with simple phrases. May need repetition or help. Short, formulaic responses. Single words or 2-3 word phrases are acceptable.",
    complexity: "Very simple sentences, often just 3-5 words. Present tense only. Minimal use of conjunctions or subordinate clauses."
  },
  A2: {
    grammar: "Uses present and simple past tenses. Basic sentence structures with some compound sentences. Modal verbs appear. Errors are common but don't impede understanding.",
    vocabulary: "Expanded everyday vocabulary including shopping, hobbies, work. Can describe experiences and feelings in simple terms.",
    communication: "Can handle routine exchanges and predictable situations. Some spontaneity in familiar contexts. Responses are more developed (5-10 words).",
    complexity: "Simple compound sentences with 'und', 'aber', 'oder'. Beginning use of 'weil' and 'dass' clauses."
  },
  B1: {
    grammar: "Uses most tenses (present, past, perfect, future). More complex sentences with subordinate clauses. Some errors but generally maintains grammatical control.",
    vocabulary: "Good range of vocabulary on familiar topics. Can paraphrase missing words. Uses some idiomatic expressions.",
    communication: "Can maintain conversation on familiar topics with some fluency. Can express opinions and justify briefly. Handles unexpected questions reasonably.",
    complexity: "Regular use of subordinate clauses, relative clauses. Sentences typically 10-15 words with varied structures."
  },
  B2: {
    grammar: "Solid control of grammar with good accuracy. Uses full range of tenses including subjunctive. Errors don't lead to misunderstanding.",
    vocabulary: "Broad vocabulary with good collocational awareness. Can use synonyms and adjust register somewhat.",
    communication: "Fluent and spontaneous communication. Can argue effectively and respond to complex questions. Natural interaction.",
    complexity: "Complex sentences with multiple clauses. Uses discourse markers effectively. Varied sentence length and structure."
  },
  C1: {
    grammar: "Consistent grammatical control with rare errors. Full command of complex structures including passive, indirect speech.",
    vocabulary: "Broad lexical range with sophisticated vocabulary. Precise word choice and appropriate register.",
    communication: "Fluent, spontaneous expression. Can handle abstract topics. Effective use of discourse patterns.",
    complexity: "Sophisticated sentence structure with varied complexity. Natural-sounding extended discourse."
  },
  C2: {
    grammar: "Complete grammatical mastery. Virtually no errors.",
    vocabulary: "Very extensive vocabulary with nuanced understanding. Native-like expressions and idioms.",
    communication: "Effortless, native-like communication. Can express subtle shades of meaning.",
    complexity: "Highly complex and varied structures used naturally and appropriately."
  }
};

// Enhanced evaluation schema with CEFR-aligned assessment
const ChatbotEvaluationSchema = z.object({
  // Task Completion
  task_completion: z.object({
    completed: z.boolean().describe('Whether the user adequately addressed the conversation topic/task'),
    completion_percentage: z.number().min(0).max(100),
    requirements_met: z.array(z.string()).describe('List of task requirements that were met'),
    requirements_missed: z.array(z.string()).describe('List of task requirements that were missed'),
    explanation: z.string().describe('Explanation of task completion assessment')
  }),

  // Grammar Score with CEFR alignment
  grammar_score: z.number().min(0).max(5).describe('Grammar score 0-5 based on CEFR level expectations'),
  grammar_feedback: z.object({
    strengths: z.array(z.string()).describe('Grammar strengths demonstrated'),
    areas_for_improvement: z.array(z.string()).describe('Grammar areas needing improvement'),
    grammar_errors: z.array(z.object({
      error: z.string(),
      correction: z.string(),
      explanation: z.string(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      grammar_category: z.string()
    })).describe('List of specific grammar errors (ignore spelling/capitalization)'),
    explanation: z.string().describe('Overall grammar assessment aligned with CEFR level')
  }),

  // Vocabulary Score with CEFR alignment
  vocabulary_score: z.number().min(0).max(5).describe('Vocabulary score 0-5 based on CEFR level expectations'),
  vocabulary_feedback: z.object({
    appropriate_usage: z.array(z.string()).describe('Examples of appropriate vocabulary use'),
    incorrect_usage: z.array(z.string()).describe('Examples of incorrect or awkward usage'),
    level_appropriateness: z.string().describe('How vocabulary range matches the CEFR level'),
    explanation: z.string().describe('Overall vocabulary assessment')
  }),

  // Overall scores
  total_score: z.number().min(0).max(10).describe('Total score out of 10 (grammar + vocabulary)'),
  percentage: z.number().min(0).max(100).describe('Percentage score'),
  overall_feedback: z.string().describe('Comprehensive feedback on the conversation performance'),
  level_assessment: z.string().describe('Assessment of whether performance matches the target CEFR level')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_history, user_instruction, course_name, task_id } = body;

    console.log('[CHATBOT-EVAL] Request received:', {
      task_id,
      has_conversation_history: !!conversation_history,
      conversation_length: conversation_history?.length || 0,
      user_instruction,
      course_name
    });

    if (!conversation_history || conversation_history.length === 0) {
      console.error('[CHATBOT-EVAL] Missing or empty conversation_history');
      return NextResponse.json(
        { error: 'conversation_history is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!task_id) {
      console.error('[CHATBOT-EVAL] Missing task_id');
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Fetch task details from database
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        language,
        level,
        parameters,
        chatbot_tasks (
          content,
          settings
        )
      `)
      .eq('id', task_id)
      .single();

    if (taskError || !taskData) {
      console.error('[CHATBOT-EVAL] Error fetching task:', taskError);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Extract task details with fallbacks
    const language = taskData.language ||
                     taskData.parameters?.language ||
                     taskData.chatbot_tasks?.[0]?.content?.language ||
                     'English';

    const level = taskData.level ||
                  taskData.parameters?.difficulty_level ||
                  taskData.chatbot_tasks?.[0]?.content?.cefr_level ||
                  'A1';

    const topic = taskData.parameters?.topic ||
                  taskData.chatbot_tasks?.[0]?.content?.topic ||
                  taskData.title ||
                  'General conversation';

    const teacherInstructions = taskData.chatbot_tasks?.[0]?.content?.instructions ||
                               user_instruction ||
                               `Have a conversation about: ${topic}`;

    console.log('[CHATBOT-EVAL] Task details:', { language, level, topic, teacherInstructions });

    // Get CEFR criteria for the target level
    const cefrCriteria = CEFR_CRITERIA[level as keyof typeof CEFR_CRITERIA] || CEFR_CRITERIA.A1;

    // Format conversation
    const conversationText = conversation_history
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const userMessagesOnly = conversation_history
      .filter((msg: any) => msg.role === 'user')
      .map((msg: any) => msg.content)
      .join('\n');

    // Create comprehensive evaluation prompt with CEFR criteria
    const evaluationPrompt = `You are evaluating a ${language} conversation at CEFR ${level} level.

TEACHER'S TASK INSTRUCTIONS:
${teacherInstructions}

CONVERSATION TOPIC: ${topic}

TARGET CEFR LEVEL: ${level}
Expected performance for ${level}:
- Grammar: ${cefrCriteria.grammar}
- Vocabulary: ${cefrCriteria.vocabulary}
- Communication: ${cefrCriteria.communication}
- Sentence Complexity: ${cefrCriteria.complexity}

EVALUATION GUIDELINES:
1. **Task Completion** - Did the user follow the teacher's instructions? Did they engage with the topic meaningfully?
2. **Grammar** - Evaluate grammar accuracy RELATIVE TO ${level} EXPECTATIONS. At ${level}, some errors are expected/acceptable.
3. **Vocabulary** - Assess vocabulary range and appropriateness FOR ${level}. Don't expect advanced vocabulary at lower levels.
4. **Communication Effectiveness** - How well did they express ideas at their level?

CRITICAL INSTRUCTIONS:
- Address the user directly using "you" and "your" (e.g., "You demonstrated..." not "The user demonstrated...")
- COMPLETELY IGNORE spelling and capitalization errors - these are NOT grammar errors
- Only mark actual structural grammar errors (verb conjugation, word order, case, gender, etc.)
- Be GENEROUS at lower levels (A1/A2) - communication matters more than perfect grammar
- If there are NO grammar errors, leave the grammar_errors array EMPTY
- Consider the CEFR level criteria when scoring - A1 students should not be penalized for B1-level complexity they lack
- Pay special attention to whether the user followed the TEACHER'S INSTRUCTIONS

SCORING RUBRIC:
Grammar (0-5):
- 5: Excellent for ${level} - very few errors, good control of level-appropriate structures
- 4: Good for ${level} - occasional errors but meaning clear
- 3: Adequate for ${level} - some errors, but generally comprehensible
- 2: Below ${level} - frequent errors impeding understanding
- 1: Well below ${level} - severe structural problems
- 0: No comprehensible grammar

Vocabulary (0-5):
- 5: Excellent range for ${level} - appropriate and varied
- 4: Good range for ${level} - generally appropriate
- 3: Adequate for ${level} - sufficient but limited
- 2: Below ${level} - very limited or inappropriate
- 1: Well below ${level} - extremely limited
- 0: No appropriate vocabulary

FULL CONVERSATION:
${conversationText}

USER MESSAGES TO EVALUATE:
${userMessagesOnly}

Provide a detailed, encouraging evaluation that assesses performance relative to ${level} expectations and the teacher's instructions.`;

    console.log('[CHATBOT-EVAL] Generating evaluation...');

    // Generate evaluation
    const evaluation = await generateObject({
      model: model,
      schema: ChatbotEvaluationSchema,
      prompt: evaluationPrompt,
    });

    console.log('[CHATBOT-EVAL] Evaluation generated successfully');

    // Store in task_responses table
    if (task_id) {
      try {
        // Get user_id from conversation_history if available
        const user_id = conversation_history[0]?.user_id || 'anonymous';

        const { data: latestAttempt } = await supabase
          .from('task_responses')
          .select('attempt_number')
          .eq('task_id', task_id)
          .eq('user_id', user_id)
          .order('attempt_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextAttempt = (latestAttempt?.attempt_number || 0) + 1;

        const { error: insertError } = await supabase
          .from('task_responses')
          .insert({
            task_id,
            user_id,
            attempt_number: nextAttempt,
            payload: {
              evaluation: evaluation.object,
              conversation_history,
              teacher_instructions: teacherInstructions
            },
            score: evaluation.object.total_score,
            max_score: 10,
            status: 'submitted',
            metadata: {
              message_count: conversation_history.filter((m: any) => m.role === 'user').length,
              language,
              level,
              topic,
              course_name
            }
          });

        if (insertError) {
          console.error('[CHATBOT-EVAL] Error storing evaluation:', insertError);
        }
      } catch (insertErr) {
        console.error('[CHATBOT-EVAL] Unexpected error storing evaluation:', insertErr);
      }
    }

    return NextResponse.json({
      success: true,
      ...evaluation.object,
      metadata: {
        task_id,
        language,
        level,
        topic,
        teacher_instructions: teacherInstructions
      }
    });

  } catch (error) {
    console.error('[CHATBOT-EVAL] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate evaluation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
