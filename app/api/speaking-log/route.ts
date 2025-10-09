import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET endpoint to fetch conversation history from speaking_log
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: 'taskId and userId are required' },
        { status: 400 }
      );
    }

    // Fetch all messages for this task and user, ordered by message_index
    const { data: messages, error } = await supabase
      .from('speaking_log')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .order('message_index', { ascending: true });

    if (error) {
      console.error('[Speaking Log API] Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversation history' },
        { status: 500 }
      );
    }

    // Format messages for the chat UI
    const formattedMessages = messages?.map(msg => {
      try {
        // Try to parse as JSON first (for messages with tool outputs)
        const parsed = JSON.parse(msg.content);
        if (parsed.parts) {
          // Filter out system messages with vocabulary context
          if (parsed.role === 'system' && parsed.parts?.[0]?.text?.includes('[VOCABULARY CONTEXT]')) {
            return null; // This will be filtered out
          }
          return {
            id: parsed.id || `msg-${msg.id}`,
            role: parsed.role || msg.role,
            parts: parsed.parts,
            createdAt: parsed.createdAt || msg.created_at
          };
        }
      } catch (e) {
        // If not JSON or parsing fails, treat as plain text
      }
      
      // Fallback for plain text messages (older format)
      // Also filter out if it contains vocabulary context
      if (msg.role === 'system' && msg.content?.includes('[VOCABULARY CONTEXT]')) {
        return null;
      }
      
      return {
        id: `msg-${msg.id}`,
        role: msg.role,
        parts: [{ type: 'text', text: msg.content }],
        createdAt: msg.created_at
      };
    }).filter(msg => msg !== null) || []; // Filter out null messages

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('[Speaking Log API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to save a message to speaking_log
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, userId, role, content, messageIndex } = body;

    if (!taskId || !userId || !role || !content) {
      return NextResponse.json(
        { error: 'taskId, userId, role, and content are required' },
        { status: 400 }
      );
    }

    // Save the message to speaking_log
    const { data, error } = await supabase
      .from('speaking_log')
      .insert({
        task_id: taskId,
        user_id: userId,
        role: role,
        content: content, // Store as plain text for readability
        message_index: messageIndex || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Speaking Log API] Error saving message:', error);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: data 
    });
  } catch (error) {
    console.error('[Speaking Log API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to clear conversation history for a task
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const userId = searchParams.get('userId');

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: 'taskId and userId are required' },
        { status: 400 }
      );
    }

    // Delete all messages for this task and user
    const { error } = await supabase
      .from('speaking_log')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Speaking Log API] Error deleting messages:', error);
      return NextResponse.json(
        { error: 'Failed to clear conversation history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Speaking Log API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}