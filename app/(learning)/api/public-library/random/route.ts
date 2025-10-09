// app/(learning)/api/public-library/random/route.ts
// Get random content from public library for discovery

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
    const count = parseInt(searchParams.get('count') || '1');

    console.log('🎲 [PUBLIC-LIBRARY-RANDOM] Request:', { language, level, task_type, count });

    // Build query for random selection
    let query = supabase
      .from('public_content_library')
      .select('*');

    if (language) {
      query = query.eq('language', language);
    }

    if (level) {
      query = query.eq('level', level);
    }

    if (task_type) {
      query = query.eq('task_type', task_type);
    }

    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('public_content_library')
      .select('*', { count: 'exact', head: true });

    if (countError || !totalCount || totalCount === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No content available with the specified filters',
      });
    }

    // Generate random offset
    const randomOffset = Math.floor(Math.random() * Math.max(0, totalCount - count));

    query = query.limit(count).range(randomOffset, randomOffset + count - 1);

    const { data, error } = await query;

    if (error) {
      console.error('❌ [PUBLIC-LIBRARY-RANDOM] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch random content', details: error.message }, { status: 500 });
    }

    console.log(`✅ [PUBLIC-LIBRARY-RANDOM] Returned ${data?.length || 0} random items`);

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      filters: {
        language,
        level,
        task_type,
      },
    });

  } catch (error) {
    console.error('💥 [PUBLIC-LIBRARY-RANDOM] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch random content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
