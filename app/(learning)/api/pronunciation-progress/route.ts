import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cache, generateCacheKey } from '@/lib/cache';


export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const courseParam = searchParams.get('course');
    
    // Convert course format from hyphen to underscore (goethe-a1 -> goethe_a1)
    const course = courseParam?.replace(/-/g, '_');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check cache first (use original courseParam format for consistent caching)
    const cacheKey = generateCacheKey(userId, 'pronunciation-progress', { course: courseParam });
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Parallel queries for better performance
    const [recentScoresResult, allScoresResult] = await Promise.all([
      // Query 1: Get the 5 most recent unique words with their latest scores
      supabase
        .from('pronunciation_scores')
        .select('*')
        .eq('user_id', userId)
        .in('course', [course, courseParam]) // Handle both formats (goethe_a1 and goethe-a1)
        .order('completed_at', { ascending: false })
        .limit(20), // Get more to ensure we have 5 unique words after deduplication
      
      // Query 2: Get recent 50 scores for the modal (all attempts)
      supabase
        .from('pronunciation_scores')
        .select('*')
        .eq('user_id', userId)
        .in('course', [course, courseParam]) // Handle both formats
        .order('completed_at', { ascending: false })
        .limit(50)
    ]);

    if (recentScoresResult.error || allScoresResult.error) {
      console.error('Error fetching pronunciation scores:', recentScoresResult.error || allScoresResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch pronunciation data' },
        { status: 500 }
      );
    }
    
    // Debug logging
    console.log('Pronunciation scores query result:', {
      userId,
      course,
      courseParam,
      recentCount: recentScoresResult.data?.length || 0,
      allCount: allScoresResult.data?.length || 0,
      sampleData: recentScoresResult.data?.[0]
    });

    // Process the data to get unique words with their latest scores
    const latestScoresByWord = new Map();
    
    recentScoresResult.data?.forEach(score => {
      const wordKey = score.word.toLowerCase();
      
      // Only add if we don't have this word yet or this score is more recent
      if (!latestScoresByWord.has(wordKey) || 
          new Date(score.completed_at) > new Date(latestScoresByWord.get(wordKey).completed_at)) {
        
        const transformedScore = {
          ...score,
          pronunciation_score: parseFloat(score.pronunciation_score) || 0
        };
        
        latestScoresByWord.set(wordKey, transformedScore);
      }
    });
    
    // Get the 5 most recent unique words
    const recentUniqueWords = Array.from(latestScoresByWord.values())
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 5);
    
    // Transform all scores
    const allScoresTransformed = allScoresResult.data?.map(score => ({
      ...score,
      pronunciation_score: parseFloat(score.pronunciation_score) || 0
    })) || [];

    const result = {
      recent: recentUniqueWords,
      all: allScoresTransformed
    };

    // Cache for 30 seconds (pronunciation data is more time-sensitive)
    cache.set(cacheKey, result, 30000);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in pronunciation-progress API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}