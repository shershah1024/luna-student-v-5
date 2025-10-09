import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Learning status constants
const LEARNING_STATUS = {
  NOT_STARTED: '0',
  INTRODUCED: '1', 
  PARTIALLY_LEARNED: '2',
  SECOND_CHANCE: '3',
  REVIEWING: '4',
  MASTERED: '5'
} as const;

/**
 * Update vocabulary learning progress by record ID
 * POST /api/vocabulary/update-progress
 */
export async function POST(request: NextRequest) {
  console.log('=== VOCAB UPDATE API START ===');
  console.log('[VOCAB UPDATE] Request timestamp:', new Date().toISOString());
  console.log('[VOCAB UPDATE] Request headers:', Object.fromEntries(request.headers.entries()));
  console.log('[VOCAB UPDATE] Request method:', request.method);
  console.log('[VOCAB UPDATE] Request URL:', request.url);

  try {

    // Parse request body
    console.log('[VOCAB UPDATE] Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('[VOCAB UPDATE] Request body parsed successfully:', body);
    } catch (parseError) {
      console.error('[VOCAB UPDATE] Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { vocabularyId, newStatus, notes, userId: requestUserId } = body;

    const userId = requestUserId;
    
    console.log('[VOCAB UPDATE] Request data:', {
      vocabularyId,
      newStatus,
      notes,
      userId,
      bodyType: typeof body,
      bodyKeys: Object.keys(body || {})
    });

    // Validate required fields
    if (!vocabularyId) {
      console.log('[VOCAB UPDATE] Missing vocabularyId');
      return NextResponse.json({ error: 'vocabularyId is required' }, { status: 400 });
    }

    if (!userId) {
      console.log('[VOCAB UPDATE] Missing userId');
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (newStatus === undefined || newStatus === null) {
      console.log('[VOCAB UPDATE] Missing newStatus');
      return NextResponse.json({ error: 'newStatus is required' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = Object.values(LEARNING_STATUS);
    if (!validStatuses.includes(newStatus.toString())) {
      console.log('[VOCAB UPDATE] Invalid status:', newStatus);
      return NextResponse.json({ 
        error: 'Invalid learning status. Must be 0-5',
        validStatuses: validStatuses
      }, { status: 400 });
    }

    // First, verify the vocabulary record exists and belongs to this user
    console.log('[VOCAB UPDATE] Verifying vocabulary record ownership...');
    console.log('[VOCAB UPDATE] Supabase client config:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    });
    
    const { data: existingRecord, error: verifyError } = await supabase
      .from('user_vocabulary')
      .select('id, user_id, term, task_id, learning_status')
      .eq('id', vocabularyId)
      .eq('user_id', userId)
      .single();

    console.log('[VOCAB UPDATE] Verification result:', {
      hasRecord: !!existingRecord,
      error: verifyError,
      recordUserId: existingRecord?.user_id,
      requestUserId: userId,
      matches: existingRecord?.user_id === userId
    });

    if (verifyError || !existingRecord) {
      console.log('[VOCAB UPDATE] Record not found or access denied:', verifyError);
      return NextResponse.json({ 
        error: 'Vocabulary record not found or access denied'
      }, { status: 404 });
    }

    const previousStatus = existingRecord.learning_status;
    console.log('[VOCAB UPDATE] Previous status:', previousStatus, '-> New status:', newStatus);

    // Update the learning status
    console.log('[VOCAB UPDATE] Executing database update...');
    const { data: updateData, error: updateError } = await supabase
      .from('user_vocabulary')
      .update({ 
        learning_status: newStatus.toString()
      })
      .eq('id', vocabularyId)
      .eq('user_id', userId) // Double-check security
      .select()
      .single();

    console.log('[VOCAB UPDATE] Update result:', {
      success: !updateError,
      error: updateError,
      updatedData: updateData
    });

    if (updateError) {
      console.error('[VOCAB UPDATE] Database update failed:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update vocabulary progress',
        details: updateError.message
      }, { status: 500 });
    }

    // Success response
    const response = {
      success: true,
      vocabularyId: parseInt(vocabularyId),
      term: existingRecord.term,
      taskId: existingRecord.task_id,
      previousStatus: previousStatus,
      newStatus: newStatus.toString(),
      notes: notes || null,
      timestamp: new Date().toISOString()
    };

    console.log('[VOCAB UPDATE] Success response:', response);
    console.log('=== VOCAB UPDATE API END (SUCCESS) ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[VOCAB UPDATE] Unexpected error:', error);
    console.error('[VOCAB UPDATE] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name
    });
    
    // Additional network/fetch error logging
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[VOCAB UPDATE] Network/fetch error detected:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
    }
    
    console.log('=== VOCAB UPDATE API END (ERROR) ===');

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 });
  }
}