// app/(learning)/api/public-library/stats/route.ts
// Get statistics about the public content library

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [PUBLIC-LIBRARY-STATS] Fetching library statistics');

    // Get total counts and distributions
    const { data: allContent, error } = await supabase
      .from('public_content_library')
      .select('language, level, task_type');

    if (error) {
      console.error('❌ [PUBLIC-LIBRARY-STATS] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch statistics', details: error.message }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      total_items: allContent?.length || 0,
      by_language: {} as Record<string, number>,
      by_level: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      by_language_and_level: {} as Record<string, Record<string, number>>,
      by_language_and_type: {} as Record<string, Record<string, number>>,
    };

    allContent?.forEach((item) => {
      // Count by language
      stats.by_language[item.language] = (stats.by_language[item.language] || 0) + 1;

      // Count by level
      stats.by_level[item.level] = (stats.by_level[item.level] || 0) + 1;

      // Count by type
      stats.by_type[item.task_type] = (stats.by_type[item.task_type] || 0) + 1;

      // Count by language and level
      if (!stats.by_language_and_level[item.language]) {
        stats.by_language_and_level[item.language] = {};
      }
      stats.by_language_and_level[item.language][item.level] =
        (stats.by_language_and_level[item.language][item.level] || 0) + 1;

      // Count by language and type
      if (!stats.by_language_and_type[item.language]) {
        stats.by_language_and_type[item.language] = {};
      }
      stats.by_language_and_type[item.language][item.task_type] =
        (stats.by_language_and_type[item.language][item.task_type] || 0) + 1;
    });

    // Get most popular content (if stats table is populated)
    const { data: popularContent } = await supabase
      .from('public_content_stats')
      .select('task_id, views_count, completions_count, popularity_score')
      .order('popularity_score', { ascending: false })
      .limit(10);

    console.log('✅ [PUBLIC-LIBRARY-STATS] Statistics calculated:', {
      total: stats.total_items,
      languages: Object.keys(stats.by_language).length,
      levels: Object.keys(stats.by_level).length,
      types: Object.keys(stats.by_type).length,
    });

    return NextResponse.json({
      success: true,
      statistics: stats,
      popular_content: popularContent || [],
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('💥 [PUBLIC-LIBRARY-STATS] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch library statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
