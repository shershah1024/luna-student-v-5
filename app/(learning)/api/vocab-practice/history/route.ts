import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, chatId } = await request.json();

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: 'userId and chatId are required' },
        { status: 400 }
      );
    }

    // Load conversation history from database
    const { data, error } = await supabase
      .from('conversation_log')
      .select('role, message_content, tool_calls, tool_results, created_at')
      .eq('user_id', userId)
      .eq('task_id', chatId) // Using task_id field to store chatId for practice sessions
      .order('created_at', { ascending: true })
      .limit(50); // Limit to last 50 messages for performance

    if (error) {
      console.error('[VOCAB PRACTICE HISTORY] Error loading conversation history:', error);
      return NextResponse.json(
        { error: 'Failed to load conversation history' },
        { status: 500 }
      );
    }

    // Convert to AI SDK message format
    const messages = (data || []).map((msg: any) => {
      const baseMessage = {
        id: crypto.randomUUID(),
        role: msg.role,
        createdAt: new Date(msg.created_at)
      };

      // Handle different content formats
      if (msg.role === 'user') {
        return {
          ...baseMessage,
          content: msg.message_content
        };
      } else {
        // Assistant message - may have tool calls
        const message: any = {
          ...baseMessage,
          content: msg.message_content || ''
        };

        // Add tool invocations if present
        if (msg.tool_calls) {
          try {
            const toolCalls = JSON.parse(msg.tool_calls);
            const toolResults = msg.tool_results ? JSON.parse(msg.tool_results) : [];
            
            message.toolInvocations = toolCalls.map((toolCall: any, index: number) => ({
              toolCallId: toolCall.toolCallId || crypto.randomUUID(),
              toolName: toolCall.toolName,
              args: toolCall.args,
              state: 'result',
              result: toolResults[index] || {}
            }));
          } catch (parseError) {
            console.error('[VOCAB PRACTICE HISTORY] Error parsing tool calls:', parseError);
          }
        }

        return message;
      }
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('[VOCAB PRACTICE HISTORY] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}