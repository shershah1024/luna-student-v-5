import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaseLessonData } from '@/lib/lesson-utils';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Dedicated API endpoint for chatbot lesson data
 * Fetches chatbot-specific data from relevant tables
 * GET /api/lessons/chatbot/[task_id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { task_id: string } }
) {
  try {
    const taskId = params.task_id;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing task_id parameter' },
        { status: 400 }
      );
    }

    console.log('[ChatbotLessonAPI] Fetching data for task:', taskId);

    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('[ChatbotLessonAPI] Failed to fetch base task:', taskError);
      if (taskError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Chatbot lesson not found',
            task_id: taskId,
            message: 'The requested chatbot exercise could not be found.',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch chatbot task' },
        { status: 500 }
      );
    }

    if (!taskRow || taskRow.task_type !== 'chatbot') {
      return NextResponse.json(
        {
          error: 'Chatbot lesson not found',
          task_id: taskId,
          message: 'The requested chatbot exercise could not be found.',
        },
        { status: 404 }
      );
    }

    const { data: chatbotAssignment, error: chatbotError } = await supabase
      .from('chatbot_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (chatbotError || !chatbotAssignment) {
      console.error('[ChatbotLessonAPI] Missing chatbot task row:', chatbotError);
      return NextResponse.json(
        {
          error: 'Chatbot lesson not found',
          task_id: taskId,
          message: 'Chatbot content is not available for this task.',
        },
        { status: 404 }
      );
    }

    const content = chatbotAssignment.content || {};
    const parameters = taskRow.parameters || {};

    const base = buildBaseLessonData(taskRow, {
      exerciseType: 'chatbot_roleplay',
      chapterTitle: 'Chatbot Conversation',
      lessonName:
        parameters.assignment_title ||
        `${parameters.topic || content.topic || taskRow.title || 'Conversation'} Practice`,
      exerciseObjective:
        `Practice ${parameters.language || content.language || 'language'} conversation at ${
          parameters.difficulty_level || content.cefr_level || 'A1'
        } level`,
      difficultyLevel: parameters.difficulty_level || content.cefr_level,
      language: parameters.language || content.language,
    });

    const lessonData = {
      ...base,
      chapter_theme:
        parameters.topic || content.topic || taskRow.title || 'Conversation Practice',
      chatbot_instructions: content.instructions || null,
      topic: parameters.topic || content.topic,
      assignment_type: taskRow.task_type,
      metadata: taskRow.metadata || {},
    };

    console.log('[ChatbotLessonAPI] Returning task-based chatbot lesson');
    return NextResponse.json(lessonData);

  } catch (error) {
    console.error('[ChatbotLessonAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}