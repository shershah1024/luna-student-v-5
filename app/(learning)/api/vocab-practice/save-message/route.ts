import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, userId, message, messageIndex } = body;

    if (!chatId || !userId || !message) {
      return NextResponse.json(
        { error: 'chatId, userId, and message are required' },
        { status: 400 }
      );
    }


    // First try to get the session, create if doesn't exist
    let session;
    const { data: existingSession, error: sessionError } = await supabase
      .from('lesson_chat_sessions')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (sessionError && sessionError.code === 'PGRST116') {
      // Session doesn't exist, create it
      console.log('[save-message] Session not found, creating new session for chatId:', chatId);
      const { data: newSession, error: createError } = await supabase
        .from('lesson_chat_sessions')
        .insert({
          chat_id: chatId,
          user_id: userId,
          task_type: 'vocabulary_learning',
          session_data: {}
        })
        .select('id')
        .single();

      if (createError || !newSession) {
        console.error('[save-message] Failed to create session:', createError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }
      session = newSession;
    } else if (sessionError || !existingSession) {
      console.error('[save-message] Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session error' },
        { status: 500 }
      );
    } else {
      session = existingSession;
    }

    // Save the message with tool invocations
    const messageData: any = {
      chat_session_id: session.id,
      role: message.role || 'assistant', // Ensure role is always set with fallback
      content: { text: message.content || message.text || '' }, // Handle different content formats
      message_index: messageIndex
    };
    
    // If there are tool invocations, save them in the content object
    if (message.toolInvocations) {
      messageData.content.toolInvocations = message.toolInvocations;
    }
    
    const { error: insertError } = await supabase
      .from('lesson_chat_messages')
      .insert(messageData);

    if (insertError) {
      console.error('[save-message] Error saving message:', insertError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Update session last activity
    await supabase
      .from('lesson_chat_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[save-message] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}