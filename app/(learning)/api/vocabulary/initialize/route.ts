import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Initialize vocabulary for a user from lesson_vocabulary_list
 * This creates records in user_vocabulary with IDs for tracking progress
 * POST /api/vocabulary/initialize
 */
export async function POST(request: NextRequest) {
  console.log('=== VOCAB INITIALIZATION START ===');
  console.log('[VOCAB INIT] Request timestamp:', new Date().toISOString());

  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[VOCAB INIT] Unauthorized - no user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { taskId } = body;

    console.log('[VOCAB INIT] Request data:', { taskId, userId });

    if (!taskId) {
      console.log('[VOCAB INIT] Missing taskId');
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Step 1: Check if THIS USER already has vocabulary for this task
    console.log('[VOCAB INIT] Checking for existing user vocabulary...');
    const { data: existingVocab, error: existingError } = await supabase
      .from('user_vocabulary')
      .select('id, term, definition, learning_status, created_at')
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (existingError) {
      console.error('[VOCAB INIT] Error checking existing vocabulary:', existingError);
      return NextResponse.json({ 
        error: 'Failed to check existing vocabulary' 
      }, { status: 500 });
    }

    console.log('[VOCAB INIT] Existing vocabulary records for this user:', existingVocab?.length || 0);

    // If user already has vocabulary for this task, return it
    if (existingVocab && existingVocab.length > 0) {
      console.log('[VOCAB INIT] User already has vocabulary, returning existing records');
      return NextResponse.json({
        success: true,
        initialized: false, // Already existed
        taskId,
        vocabularyCount: existingVocab.length,
        vocabulary: existingVocab
      });
    }

    // Step 2: Fetch vocabulary from vocabulary_tasks table
    console.log('[VOCAB INIT] Fetching vocabulary from vocabulary_tasks...');
    const { data: vocabRow, error: vocabError } = await supabase
      .from('vocabulary_tasks')
      .select('content')
      .eq('task_id', taskId)
      .single();

    const words: string[] | undefined = vocabRow?.content?.vocabulary_data?.words;
    if (vocabError || !words || words.length === 0) {
      console.log('[VOCAB INIT] No vocabulary found for task in luna table:', taskId, vocabError);
      return NextResponse.json({ 
        error: 'No vocabulary found for this lesson',
        taskId 
      }, { status: 404 });
    }

    console.log('[VOCAB INIT] Found lesson vocabulary:', words.length, 'words');

    // Step 3: Insert vocabulary into user_vocabulary
    console.log('[VOCAB INIT] Inserting vocabulary into user table...');
    const vocabularyRecords = words.map((word: string) => ({
      user_id: userId,
      task_id: taskId,
      term: word,
      definition: '', // Empty for now
      learning_status: '0' // Not started
    }));

    const { data: insertedVocab, error: insertError } = await supabase
      .from('user_vocabulary')
      .insert(vocabularyRecords)
      .select('id, term, definition, learning_status, created_at')
      .order('created_at', { ascending: true });

    if (insertError) {
      console.error('[VOCAB INIT] Error inserting vocabulary:', insertError);
      
      // Handle unique constraint violation (race condition)
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
        console.log('[VOCAB INIT] Unique constraint violation detected - race condition occurred');
        console.log('[VOCAB INIT] Fetching existing vocabulary instead...');
        
        // Fetch the existing vocabulary that was inserted by the concurrent request
        const { data: existingVocab, error: fetchError } = await supabase
          .from('user_vocabulary')
          .select('id, term, definition, learning_status, created_at')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });

        if (fetchError || !existingVocab) {
          console.error('[VOCAB INIT] Failed to fetch existing vocabulary after constraint violation:', fetchError);
          return NextResponse.json({ 
            error: 'Race condition occurred but failed to fetch existing vocabulary',
            details: fetchError?.message || 'Unknown error'
          }, { status: 500 });
        }

        console.log('[VOCAB INIT] Successfully retrieved existing vocabulary after race condition:', existingVocab.length, 'words');
        return NextResponse.json({
          success: true,
          initialized: false, // Was created by concurrent request
          taskId,
          vocabularyCount: existingVocab.length,
          vocabulary: existingVocab,
          raceConditionHandled: true // Flag to indicate this was a race condition
        });
      }
      
      // Handle other insertion errors
      return NextResponse.json({ 
        error: 'Failed to initialize vocabulary',
        details: insertError.message
      }, { status: 500 });
    }

    console.log('[VOCAB INIT] Successfully inserted:', insertedVocab?.length || 0, 'vocabulary records');

    // Step 4: Return the vocabulary with IDs
    const response = {
      success: true,
      initialized: true, // Newly created
      taskId,
      vocabularyCount: insertedVocab?.length || 0,
      vocabulary: insertedVocab || [],
      instructions: null,
      level: null
    };

    console.log('[VOCAB INIT] Success response:', {
      ...response,
      vocabulary: `[${response.vocabularyCount} words with IDs]`
    });
    console.log('=== VOCAB INITIALIZATION END (SUCCESS) ===');

    return NextResponse.json(response);

  } catch (error) {
    console.error('[VOCAB INIT] Unexpected error:', error);
    console.error('[VOCAB INIT] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== VOCAB INITIALIZATION END (ERROR) ===');

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
