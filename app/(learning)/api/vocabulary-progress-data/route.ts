import { NextRequest, NextResponse } from "next/server";
import { withPooledSupabase } from "@/lib/supabase-pool";
import { auth } from '@clerk/nextjs/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const courseId = 'goethe-a1'; // Hardcoded course ID

    return await withPooledSupabase(async (supabase) => {
      // Get recent vocabulary progress
      const { data: recentData, error: recentError } = await supabase
        .rpc('get_recent_vocabulary_progress', {
          p_user_id: userId,
          p_course_id: courseId,
          p_limit: limit
        });

      if (recentError) {
        console.error('Error fetching recent vocabulary:', recentError);
        return NextResponse.json({ error: 'Failed to fetch recent vocabulary' }, { status: 500 });
      }

      // Get all vocabulary progress for modal
      const { data: allData, error: allError } = await supabase
        .rpc('get_recent_vocabulary_progress', {
          p_user_id: userId,
          p_course_id: courseId,
          p_limit: 1000 // Get all vocabulary terms
        });

      if (allError) {
        console.error('Error fetching all vocabulary:', allError);
        return NextResponse.json({ error: 'Failed to fetch all vocabulary' }, { status: 500 });
      }

      return NextResponse.json({
        recent: recentData || [],
        all: allData || []
      });
    });

  } catch (error) {
    console.error('Error in vocabulary-progress-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}