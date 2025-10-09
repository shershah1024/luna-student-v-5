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

// Debate-specific evaluation schema focused on argumentation and persuasion
const DebateEvaluationSchema = z.object({
  // Argumentation Assessment
  argumentation_score: z.number().min(0).max(10).describe('Score from 0-10 on quality and strength of arguments presented'),
  argumentation_details: z.string().describe('Analysis of argument structure, logic, and evidence used'),
  
  // Rebuttal Assessment
  rebuttal_score: z.number().min(0).max(10).describe('Score from 0-10 on effectiveness of countering opposing arguments'),
  rebuttal_details: z.string().describe('How well the user addressed and refuted opposing points'),
  
  // Position Defense
  position_defense_score: z.number().min(0).max(10).describe('Score from 0-10 on consistency and strength in defending assigned position'),
  position_defense_details: z.string().describe('How well the user maintained and supported their position'),
  
  // Grammar Assessment
  grammar_score: z.number().min(0).max(10).describe('Score from 0-10 on grammar accuracy and correctness'),
  grammar_details: z.string().describe('Grammar usage assessment with examples'),
  grammar_errors: z.array(z.object({
    error: z.string().describe('The grammatical error made'),
    correction: z.string().describe('The correct form'),
    explanation: z.string().describe('Brief explanation of the grammar rule')
  })).describe('List of specific grammar errors and corrections'),
  
  // Persuasiveness
  persuasiveness_score: z.number().min(0).max(10).describe('Score from 0-10 on overall persuasiveness and impact'),
  persuasiveness_details: z.string().describe('How convincing and compelling the arguments were'),
  
  // Overall Performance
  total_score: z.number().min(0).max(50).describe('Total score out of 50'),
  overall_feedback: z.string().describe('General feedback on the debate performance'),
  
  // Strengths and Improvements
  strengths: z.array(z.string()).describe('Key strengths demonstrated in the debate'),
  areas_for_improvement: z.array(z.string()).describe('Specific areas that need improvement'),
  
  // Debate-Specific Insights
  best_argument: z.string().describe('The strongest argument presented by the user'),
  weakest_point: z.string().describe('The weakest point or missed opportunity in the debate'),
  
  // Recommendations
  recommendations: z.string().describe('Actionable recommendations for improving debate skills')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, user_id, task_id, language, level, topic, debate_topic, additional_instructions } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      );
    }

    console.log('[DEBATE-EVAL] Starting evaluation for debate conversation:', conversation_id);
    console.log('[DEBATE-EVAL] Debate details:', { debate_topic, language, level, additional_instructions });

    // Fetch all messages from the task_conversation_logs table
    const { data: messages, error: fetchError } = await supabase
      .from('task_conversation_logs')
      .select('role, message, payload, created_at, task_id, user_id')
      .eq('conversation_id', conversation_id)
      .order('turn_index', { ascending: true });

    console.log('[DEBATE-EVAL] Query result from task_conversation_logs:', {
      messagesFound: messages?.length || 0,
      error: fetchError,
      conversation_id
    });

    if (fetchError || !messages || messages.length === 0) {
      console.error('[DEBATE-EVAL] Error fetching messages from task_conversation_logs:', fetchError);
      console.error('[DEBATE-EVAL] No messages found for conversation_id:', conversation_id);
      
      return NextResponse.json(
        { 
          error: 'Could not fetch conversation messages from task_conversation_logs',
          conversation_id,
          messages_found: 0
        },
        { status: 404 }
      );
    }

    // Filter out only user messages for evaluation
    const userMessages = messages.filter(msg => (msg.role || '').toLowerCase() === 'user');
    const assistantMessages = messages.filter(msg => (msg.role || '').toLowerCase() === 'assistant');

    if (userMessages.length === 0) {
      return NextResponse.json(
        { error: 'No user messages found to evaluate' },
        { status: 400 }
      );
    }
    
    // Use provided debate details or extract from messages
    const actualLanguage = language || messages[0]?.payload?.language || 'English';
    const actualLevel = level || messages[0]?.payload?.level || 'A1';
    const actualTopic = debate_topic || topic || messages[0]?.payload?.topic || 'General debate';

    // Format conversation for evaluation
    const conversationText = messages
      .map(msg => `${(msg.role || '').toLowerCase() === 'user' ? 'User' : 'AI Opponent'}: ${msg.message}`)
      .join('\n\n');

    const userMessagesOnly = userMessages
      .map(msg => msg.message)
      .join('\n');

    // Create evaluation prompt specifically for debates
    const evaluationPrompt = `You are evaluating a ${actualLanguage} debate at ${actualLevel} level.

DEBATE DETAILS:
Topic: ${actualTopic}
${additional_instructions ? `Additional Guidelines: ${additional_instructions}` : ''}

Note: In this debate format, both participants present their own positions dynamically based on the topic.

Please evaluate ONLY the user's debate performance based on:
1. Argumentation - Quality, logic, and evidence in their arguments
2. Rebuttal - How well they countered opposing arguments
3. Position Defense - Consistency and strength in defending their assigned position
4. Grammar - Accuracy appropriate for ${actualLevel} level (IGNORE capitalization and spelling errors completely)
5. Persuasiveness - Overall impact and convincingness

IMPORTANT INSTRUCTIONS:
- Address the user directly using "you" and "your" (e.g., "You presented strong arguments..." not "The user presented...")
- COMPLETELY IGNORE capitalization errors and spelling mistakes - focus only on grammar structure
- If there are NO grammar errors, leave the grammar_errors array empty
- Be encouraging and constructive in your feedback
- Focus on the strength of arguments rather than minor language issues

FULL DEBATE:
${conversationText}

USER ARGUMENTS TO EVALUATE:
${userMessagesOnly}

Provide a detailed evaluation focusing on debate skills and argumentation quality. Be constructive and helpful.
Only list grammar errors if they are actual grammatical mistakes (NOT spelling or capitalization).
Identify your best argument and any weak points or missed opportunities.`;

    console.log('[DEBATE-EVAL] Generating evaluation...');

    // Generate evaluation using AI
    const evaluation = await generateObject({
      model: model,
      schema: DebateEvaluationSchema,
      prompt: evaluationPrompt,
    });

    console.log('[DEBATE-EVAL] Evaluation generated successfully');

    if (task_id && user_id) {
      try {
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
              conversation_id,
              messages: messages.map((msg) => ({
                role: msg.role,
                message: msg.message
              }))
            },
            score: evaluation.object.total_score,
            max_score: 30,
            status: 'submitted',
            metadata: {
              conversation_id,
              message_count: userMessages.length,
              language: actualLanguage,
              level: actualLevel,
              debate_topic: actualTopic
            }
          });

        if (insertError) {
          console.error('[DEBATE-EVAL] Error storing evaluation:', insertError);
        }
      } catch (storeErr) {
        console.error('[DEBATE-EVAL] Unexpected error storing evaluation:', storeErr);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: evaluation.object,
      metadata: {
        conversation_id,
        message_count: userMessages.length,
        language: actualLanguage,
        level: actualLevel,
        debate_topic: actualTopic
      }
    });

  } catch (error) {
    console.error('[DEBATE-EVAL] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate evaluation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}