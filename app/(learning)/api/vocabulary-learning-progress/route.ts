import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Get user ID from auth
    const { userId } = await auth();
    if (!userId) {
      console.log('[Vocabulary Learning Progress] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the last 30 days of vocabulary learning data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: vocabularyData, error } = await supabase
      .from('user_vocabulary')
      .select('created_at, term, learning_status')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Vocabulary Learning Progress] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch vocabulary data' }, { status: 500 });
    }

    // Group by day and count words learned
    const dailyProgress = new Map();
    
    // Initialize all days in the last 30 days with 0
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyProgress.set(dateKey, {
        date: dateKey,
        wordsLearned: 0,
        day: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    // Count words learned each day
    vocabularyData?.forEach((word) => {
      const date = new Date(word.created_at).toISOString().split('T')[0];
      if (dailyProgress.has(date)) {
        const dayData = dailyProgress.get(date);
        dayData.wordsLearned += 1;
        dailyProgress.set(date, dayData);
      }
    });

    // Convert to array and add cumulative count
    const result = Array.from(dailyProgress.values());
    let cumulative = 0;
    result.forEach((day) => {
      cumulative += day.wordsLearned;
      day.cumulativeWords = cumulative;
    });

    // Calculate stats
    const totalWords = cumulative;
    const todayWords = result[result.length - 1]?.wordsLearned || 0;
    const weekWords = result.slice(-7).reduce((sum, day) => sum + day.wordsLearned, 0);
    const avgDailyWords = Math.round(totalWords / 30 * 10) / 10;

    return NextResponse.json({
      dailyProgress: result,
      stats: {
        totalWords,
        todayWords,
        weekWords,
        avgDailyWords
      }
    });

  } catch (error) {
    console.error('[Vocabulary Learning Progress] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}