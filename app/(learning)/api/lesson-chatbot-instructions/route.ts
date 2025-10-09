import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { lesson_id, section_id, chatbot_type } = await req.json();

    if (!lesson_id || !section_id || !chatbot_type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch chatbot instructions from the database
    const { data, error } = await supabase
      .from('lesson_chatbots')
      .select('instructions, max_milestones')
      .eq('lesson_id', lesson_id)
      .eq('section_id', section_id)
      .eq('chatbot_type', chatbot_type)
      .single();

    if (error) {
      console.error('Error fetching chatbot instructions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch instructions' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { 
          instructions: null, 
          max_milestones: 3,
          message: 'No specific instructions found for this lesson'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      instructions: data.instructions,
      max_milestones: data.max_milestones || 3,
    });
  } catch (error) {
    console.error('Error in lesson-chatbot-instructions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}