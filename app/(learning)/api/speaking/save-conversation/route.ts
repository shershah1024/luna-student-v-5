/**
 * API endpoint for saving speaking exercise conversations to task_conversation_logs table
 * Saves conversation transcripts instead of audio recordings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function to ensure env vars are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Save Speaking Conversation] Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    
    const {
      task_id,
      user_id,
      conversation,
      topic,
      difficulty_level,
      language,
      duration_seconds
    } = body;

    // Validate required fields
    if (!task_id || !user_id || !conversation) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, user_id, and conversation are required' },
        { status: 400 }
      );
    }

    const conversationId = randomUUID();

    const messages = Array.isArray(conversation) ? conversation : [];

    const rows = messages.map((msg: any, index: number) => ({
      task_id,
      user_id,
      conversation_id: conversationId,
      turn_index: index,
      role: msg.role,
      message: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      payload: {
        raw: msg,
        topic,
        difficulty_level,
        language,
        duration_seconds
      }
    }));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Conversation is empty' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('task_conversation_logs')
      .insert(rows);

    if (error) {
      console.error('[Save Speaking Conversation] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save conversation', details: error.message },
        { status: 500 }
      );
    }

    const word_count = rows.reduce((count, row) => {
      if ((row.role || '').toLowerCase() === 'user') {
        return count + (row.message?.split(/\s+/).length || 0);
      }
      return count;
    }, 0);

    console.log('[Save Speaking Conversation] Successfully saved conversation:', {
      conversationId,
      task_id,
      user_id,
      word_count,
      message_count: rows.length
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation_id: conversationId,
        word_count,
        message_count: rows.length
      }
    });

  } catch (error) {
    console.error('[Save Speaking Conversation] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}