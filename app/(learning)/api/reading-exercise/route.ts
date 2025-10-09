import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get('task_id');
    const exerciseId = searchParams.get('exercise_id');
    
    let query = supabase.from('reading_tasks').select(`
      task_id,
      content,
      settings,
      created_at,
      updated_at
    `);

    // Check if this is a material-based task ID
    if (taskId && taskId.startsWith('material-')) {
      const materialId = taskId.replace('material-', '');
      console.log('[READING-EXERCISE] Routing to material adapter for material:', materialId);
      
      // Forward to lesson adapter
      const adapterUrl = new URL('/api/materials/lesson-adapter', request.url);
      adapterUrl.searchParams.set('material_id', materialId);
      adapterUrl.searchParams.set('type', 'reading');
      
      const adapterResponse = await fetch(adapterUrl.toString());
      if (adapterResponse.ok) {
        const data = await adapterResponse.json();
        return NextResponse.json(data);
      } else {
        console.error('[READING-EXERCISE] Failed to fetch from adapter');
        return NextResponse.json(
          { error: 'Material not found' },
          { status: 404 }
        );
      }
    }

    // Only use task_id for querying
    if (taskId) {
      query = query.eq('task_id', taskId);
    } else {
      return NextResponse.json(
        { error: 'task_id parameter is required' },
        { status: 400 }
      );
    }

    // Fetch reading exercise from reading_tasks table
    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reading exercise not found' }, 
          { status: 404 }
        );
      }
      console.error('Error fetching reading exercise:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }

    const { data: quizRows, error: questionsError } = await supabase
      .from('task_questions')
      .select('*')
      .eq('task_id', data.task_id)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.warn('[READING-EXERCISE] Failed to fetch questions (non-fatal):', questionsError);
    }

    const payload = {
      task_id: data.task_id,
      text_title: data.content?.text_title || data.settings?.reading_instructions?.title,
      reading_text: data.content?.passage || data.content?.reading_text,
      questions: (quizRows || []).map((row: any) => ({
        question_number: row.question_number,
        ...((row.body as any) || {}),
        points: row.points,
        metadata: row.metadata,
        answer: row.answer
      })),
      exercise_type: data.settings?.exercise_type || 'reading_task',
      tags: data.settings?.tags || [],
      language: data.settings?.reading_instructions?.language || data.settings?.language,
      level: data.settings?.reading_instructions?.level || data.settings?.level,
      topic: data.settings?.reading_instructions?.topic || data.content?.topic,
      word_count: data.content?.word_count,
      metadata: data.content?.metadata || data.settings || {},
      status: data.settings?.status || 'active',
      created_at: data.created_at
    };

    const response = NextResponse.json(payload);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5min browser, 10min CDN
    return response;

  } catch (error) {
    console.error('Error in reading-exercise API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 
