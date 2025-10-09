import { streamText, convertToModelMessages } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { createClient } from '@supabase/supabase-js';
import { getSystemInstruction } from '@/lib/system-instructions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to save conversation message
async function saveConversationMessage(
  conversationId: string,
  userId: string,
  taskId: string,
  role: string,
  content: string,
  language?: string,
  level?: string,
  topic?: string
) {
  try {
    console.log('[ROLEPLAY API] Saving message to task_conversation_logs:', {
      conversationId,
      userId,
      role,
      contentLength: content?.length || 0
    });

    const { data: lastTurn } = await supabase
      .from('task_conversation_logs')
      .select('turn_index')
      .eq('conversation_id', conversationId)
      .eq('task_id', taskId)
      .order('turn_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextTurn = (lastTurn?.turn_index ?? -1) + 1;

    const { data, error } = await supabase.from('task_conversation_logs').insert({
      conversation_id: conversationId,
      user_id: userId,
      task_id: taskId,
      turn_index: nextTurn,
      role,
      message: content,
      payload: {
        language: language || 'English',
        level: level || 'A1',
        topic: topic || 'General conversation'
      }
    }).select();

    if (error) {
      console.error('[ROLEPLAY API] Conversation logging error:', error);
    } else {
      console.log('[ROLEPLAY API] Message saved successfully to task_conversation_logs:', data?.[0]?.id);
    }
  } catch (error) {
    console.error('[ROLEPLAY API] Luna conversation logging exception:', error);
  }
}

const azure = createAzure({
  resourceName: 'shino-m9qsrnbv',
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  baseURL: 'https://shino-m9qsrnbv-eastus2.cognitiveservices.azure.com/openai',
});

// Validate Azure configuration on startup
if (!process.env.AZURE_OPENAI_API_KEY) {
  console.error('[VOCAB API] AZURE_OPENAI_API_KEY is not configured!');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle AI SDK format
    const { messages, task_id, userId, language, level, topic: bodyTopic, conversation_id } = body;
    
    if (!messages || messages.length === 0) {
      console.error('[VOCAB API] No messages provided in chat request');
      return new Response(JSON.stringify({ error: 'No messages provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!userId) {
      console.error('[VOCAB API] Missing userId');
      return new Response(JSON.stringify({ error: 'User ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fallback task_id if not provided
    const effectiveTaskId = task_id || '07618de1-392b-430e-a847-549a76a36a9c';

    // Get language and level from request
    const targetLanguage = language || 'English';
    
    let roleplayContext = {
      scenario: bodyTopic || `General conversation`,
      objective: `Natural conversation in ${targetLanguage}`,
      instructions: '', // Will be filled from database if available
      isDebate: false,
      debateTopic: '',
      studentPosition: '',
      aiPosition: '',
      debateFormat: '',
      difficultyLevel: level || 'A1',
      language: targetLanguage,
      exerciseSubtype: null as string | null, // Will be set from database: 'debate', 'storytelling', or null
    };
    
    // Fetch from database but use instructions as-is without transformation
    try {
      const { data: taskRow } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', effectiveTaskId)
        .single();

      if (taskRow) {
        const params = taskRow.parameters || {};
        roleplayContext.scenario = params.topic || taskRow.title || roleplayContext.scenario;
        roleplayContext.difficultyLevel = params.difficulty_level || roleplayContext.difficultyLevel;
        roleplayContext.language = params.language || roleplayContext.language;

        if (taskRow.task_type === 'debate') {
          roleplayContext.isDebate = true;
          roleplayContext.debateTopic = params.debate_topic || '';
          roleplayContext.studentPosition = params.student_position || '';
          roleplayContext.aiPosition = params.ai_position || '';
          roleplayContext.debateFormat = params.debate_format || 'pro_con';
        }

        const tableMap: Record<string, string> = {
          chatbot: 'chatbot_tasks',
          debate: 'debate_tasks',
          speaking: 'speaking_tasks',
          storytelling: 'storytelling_tasks',
          pronunciation: 'pronunciation_tasks'
        };

        const tableName = tableMap[taskRow.task_type];
        if (tableName) {
          const { data: perType } = await supabase
            .from(tableName)
            .select('*')
            .eq('task_id', effectiveTaskId)
            .single();

          if (perType?.content) {
            const content = perType.content as any;
            const settings = perType.settings as any;

            // Extract exercise_subtype from content or settings
            roleplayContext.exerciseSubtype = content.exercise_subtype || settings?.exercise_subtype || null;

            if (content.instructions) {
              roleplayContext.instructions = typeof content.instructions === 'string'
                ? content.instructions
                : JSON.stringify(content.instructions);
            }
          }
        }
      }
    } catch (error) {
      console.log('[ROLEPLAY API] No specific task data found, using defaults');
    }

    // Use full conversation history
    const chatMessages = messages;

    // Determine which personality to use based on exercise_subtype
    let fullSystemPrompt: string;

    if (roleplayContext.exerciseSubtype === 'debate') {
      // Use DEBATE_PARTNER personality
      fullSystemPrompt = getSystemInstruction('DEBATE_PARTNER', {
        level: roleplayContext.difficultyLevel,
        topic: roleplayContext.scenario,
        instructions: roleplayContext.instructions,
        language: roleplayContext.language,
      });
    } else if (roleplayContext.exerciseSubtype === 'storytelling') {
      // Use STORYTELLING_PARTNER personality
      fullSystemPrompt = getSystemInstruction('STORYTELLING_PARTNER', {
        level: roleplayContext.difficultyLevel,
        topic: roleplayContext.scenario,
        instructions: roleplayContext.instructions,
        language: roleplayContext.language,
      });
    } else {
      // Default: Use SUPPORTIVE_PARTNER personality
      fullSystemPrompt = getSystemInstruction('SUPPORTIVE_PARTNER', {
        level: roleplayContext.difficultyLevel,
        topic: roleplayContext.scenario,
        instructions: roleplayContext.instructions,
        language: roleplayContext.language,
      });
    }

    // Use provided conversation ID or generate a new one
    const conversationId = conversation_id || crypto.randomUUID();
    console.log('[ROLEPLAY API] Using conversation ID:', conversationId);

    // Save the user message immediately before generating response
    const latestUserMessage = chatMessages[chatMessages.length - 1];
    if (latestUserMessage && latestUserMessage.role === 'user') {
      await saveConversationMessage(
        conversationId,
        userId,
        effectiveTaskId,
        'user',
        latestUserMessage.parts?.[0]?.type === 'text' ? latestUserMessage.parts[0].text : 'Message',
        targetLanguage,
        roleplayContext.difficultyLevel,
        roleplayContext.scenario
      );
    }

    const result = streamText({
      model: azure.languageModel('gpt-5-chat'),
      system: fullSystemPrompt,
      messages: convertToModelMessages(chatMessages),
      providerOptions: {
        openai: {
          verbosity: 'low'
        },
      },
      onFinish: async ({ text }) => {
        // Save assistant response after generation completes
        await saveConversationMessage(
          conversationId,
          userId,
          effectiveTaskId,
          'assistant',
          text || '',
          targetLanguage,
          roleplayContext.difficultyLevel,
          roleplayContext.scenario
        );
      }
    });

    // Always use streaming response for proper AI SDK usage
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('[VOCAB API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : 'No cause'
    });
    return new Response(JSON.stringify({ 
      error: 'Error processing request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}