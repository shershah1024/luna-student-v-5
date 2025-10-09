import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId');

    if (!chatId || !userId) {
      return NextResponse.json(
        { error: 'chatId and userId are required' },
        { status: 400 }
      );
    }


    // First get the session
    const { data: session, error: sessionError } = await supabase
      .from('lesson_chat_sessions')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ messages: [] });
    }

    // Then get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('lesson_chat_messages')
      .select('*')
      .eq('chat_session_id', session.id)
      .order('created_at', { ascending: true }); // Use timestamp instead of broken message_index

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Format messages for the chat UI
    const formattedMessages = messages?.map(msg => {
      let content = msg.content;
      let toolInvocations = null;
      
      // Handle different content formats
      if (typeof content === 'object' && content !== null) {
        // Extract text content
        if (content.text !== undefined) {
          toolInvocations = content.toolInvocations; // Extract tool invocations if present
          content = content.text;
        } else {
          content = JSON.stringify(content);
        }
      }
      
      // Ensure content is always a string
      if (typeof content !== 'string') {
        content = String(content);
      }
      
      const formattedMsg: any = {
        id: msg.id,
        role: msg.role,
        content: content,
        createdAt: msg.created_at
      };
      
      // Add tool invocations if they exist
      if (toolInvocations) {
        formattedMsg.toolInvocations = toolInvocations;
      }
      
      return formattedMsg;
    }) || [];


    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}