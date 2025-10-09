import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * List all materials for the authenticated user
 * GET /api/materials/list
 * 
 * Query parameters:
 * - type: filter by material type (reading_passage, reading_test, etc.)
 * - status: filter by status (draft, published, archived)
 * - cefr_level: filter by CEFR level (A1, A2, B1, B2, C1, C2)
 * - limit: number of results to return (default: 20)
 * - offset: number of results to skip (default: 0)
 */
export async function GET(request: NextRequest) {
  console.log('=== MATERIALS LIST START ===');

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[MATERIALS LIST] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const cefrLevel = searchParams.get('cefr_level');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[MATERIALS LIST] Query parameters:', {
      type,
      status,
      cefrLevel,
      limit,
      offset,
      userId
    });

    // Build query
    let query = supabase
      .from('teachezee_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (cefrLevel) {
      query = query.eq('cefr_level', cefrLevel);
    }

    // Apply pagination
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: materials, error } = await query;

    if (error) {
      console.error('[MATERIALS LIST] Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch materials',
        details: error.message
      }, { status: 500 });
    }

    console.log('[MATERIALS LIST] Successfully fetched materials:', {
      count: materials?.length || 0,
      userId
    });

    return NextResponse.json({
      success: true,
      data: materials || [],
      metadata: {
        count: materials?.length || 0,
        limit,
        offset,
        filters: {
          type,
          status,
          cefr_level: cefrLevel
        }
      }
    });

  } catch (error) {
    console.error('[MATERIALS LIST] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}