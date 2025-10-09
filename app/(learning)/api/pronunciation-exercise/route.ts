import { NextRequest, NextResponse } from 'next/server';

// Mark route as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    // For now, we'll use Supabase directly since we have the MCP integration
    // In a real implementation, you might want to use the Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/pronunciation_exercises?task_id=eq.${taskId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Pronunciation exercise not found' },
        { status: 404 }
      );
    }

    // Return the first (and should be only) result
    return NextResponse.json(data[0]);

  } catch (error) {
    console.error('Error fetching pronunciation exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pronunciation exercise data' },
      { status: 500 }
    );
  }
}