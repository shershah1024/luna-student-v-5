// app/(learning)/api/public-library/route.ts
// Public content library discovery API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const language = searchParams.get('language');
    const level = searchParams.get('level');
    const task_type = searchParams.get('type');
    const search_query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 [PUBLIC-LIBRARY] Search request:', {
      language,
      level,
      task_type,
      search_query,
      limit,
      offset,
    });

    // Use the search function if we have a search query
    if (search_query) {
      const { data, error } = await supabase.rpc('search_public_content', {
        search_query,
        filter_language: language,
        filter_level: level,
        filter_type: task_type,
        limit_count: limit,
      });

      if (error) {
        console.error('❌ [PUBLIC-LIBRARY] Search error:', error);
        return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data,
        count: data?.length || 0,
        query: {
          search_query,
          language,
          level,
          task_type,
          limit,
        },
      });
    }

    // Otherwise, use the view with filters
    let query = supabase
      .from('public_content_library')
      .select('*', { count: 'exact' });

    if (language) {
      query = query.eq('language', language);
    }

    if (level) {
      query = query.eq('level', level);
    }

    if (task_type) {
      query = query.eq('task_type', task_type);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [PUBLIC-LIBRARY] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch content', details: error.message }, { status: 500 });
    }

    console.log(`✅ [PUBLIC-LIBRARY] Found ${data?.length || 0} items (total: ${count})`);

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      total: count,
      pagination: {
        limit,
        offset,
        has_more: count ? offset + limit < count : false,
      },
      filters: {
        language,
        level,
        task_type,
      },
    });

  } catch (error) {
    console.error('💥 [PUBLIC-LIBRARY] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch public library content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
