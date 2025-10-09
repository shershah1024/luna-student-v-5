import { NextRequest, NextResponse } from "next/server";
import { withPooledSupabase } from "@/lib/supabase-pool";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const course = searchParams.get('course');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    return await withPooledSupabase(async (supabase) => {
      // Get recent grammar errors
      const { data: recentData, error: recentError } = await supabase
        .rpc('get_recent_grammar_errors', {
          p_user_id: userId,
          p_course_id: course,
          p_limit: limit
        });

      if (recentError) {
        console.error('Error fetching recent grammar errors:', recentError);
        return NextResponse.json({ error: 'Failed to fetch recent grammar errors' }, { status: 500 });
      }

      // Get all grammar errors for modal view
      const { data: allData, error: allError } = await supabase
        .rpc('get_recent_grammar_errors', {
          p_user_id: userId,
          p_course_id: course,
          p_limit: 50 // Get more for the modal view
        });

      if (allError) {
        console.error('Error fetching all grammar errors:', allError);
        return NextResponse.json({ error: 'Failed to fetch all grammar errors' }, { status: 500 });
      }

      return NextResponse.json({
        recent: recentData || [],
        all: allData || []
      });
    });

  } catch (error) {
    console.error('Error in grammar-errors-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}