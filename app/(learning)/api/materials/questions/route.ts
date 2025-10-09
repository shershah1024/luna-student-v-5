import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Get questions for a specific material
 * GET /api/materials/questions?material_id=<id>
 * 
 * Query parameters:
 * - material_id: required - ID of the material to get questions for
 */
export async function GET(request: NextRequest) {
  console.log('=== MATERIALS QUESTIONS START ===');

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[MATERIALS QUESTIONS] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = request.nextUrl;
    const materialId = searchParams.get('material_id');

    if (!materialId) {
      console.log('[MATERIALS QUESTIONS] Missing material_id parameter');
      return NextResponse.json({
        error: 'Missing required parameter: material_id'
      }, { status: 400 });
    }

    console.log('[MATERIALS QUESTIONS] Query parameters:', {
      materialId,
      userId
    });

    // First, verify the material belongs to the user
    const { data: material, error: materialError } = await supabase
      .from('teachezee_materials')
      .select('id, user_id')
      .eq('id', materialId)
      .eq('user_id', userId)
      .single();

    if (materialError || !material) {
      console.error('[MATERIALS QUESTIONS] Material not found or access denied:', materialError);
      return NextResponse.json({
        error: 'Material not found or access denied'
      }, { status: 404 });
    }

    // Get questions for the material
    const { data: questions, error } = await supabase
      .from('teachezee_questions')
      .select('*')
      .eq('material_id', materialId)
      .order('question_number', { ascending: true });

    if (error) {
      console.error('[MATERIALS QUESTIONS] Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch questions',
        details: error.message
      }, { status: 500 });
    }

    console.log('[MATERIALS QUESTIONS] Successfully fetched questions:', {
      materialId,
      questionsCount: questions?.length || 0,
      userId
    });

    return NextResponse.json({
      success: true,
      data: questions || [],
      metadata: {
        material_id: materialId,
        count: questions?.length || 0
      }
    });

  } catch (error) {
    console.error('[MATERIALS QUESTIONS] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}