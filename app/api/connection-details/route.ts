import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getSystemInstruction } from '@/lib/system-instructions';



export const dynamic = "force-dynamic";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to generate connection details with metadata
async function generateConnectionDetails(
  identity: string,
  userEmail: string | undefined,
  roomName: string,
  metadata?: any
) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Server configuration error');
  }

  const at = new AccessToken(apiKey, apiSecret, {identity: identity});
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  // Add metadata to the access token if provided
  // This metadata will be available to the LiveKit agent
  if (metadata) {
    at.metadata = JSON.stringify(metadata);
  }

  const accessToken = await at.toJwt();
  const url = process.env.LIVEKIT_URL;

  if (!url) {
    throw new Error('LiveKit URL not configured');
  }

  return { accessToken, url, userEmail };
}

// GET endpoint for backward compatibility
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const identityParam = searchParams.get('identity');
  const taskId = searchParams.get('task_id');
  const testId = searchParams.get('test_id');

  let identity: string;
  let userEmail: string | undefined;
  let assignmentId: string;

  console.log('[CONNECTION_DETAILS] GET Request params:', { identityParam, taskId, testId });

  // Use test_id or task_id as assignment ID
  assignmentId = testId || taskId || 'default_task';

  if (identityParam === 'guest_user') {
    // Handle guest user
    identity = `user_guest:::${assignmentId}`;
    userEmail = 'guest_user';
  } else {
    // Handle authenticated user
    const user = await currentUser();
    userEmail = user?.emailAddresses?.[0]?.emailAddress;
    identity = `${user?.id}:::${assignmentId}`;
  }

  console.log("identity is:", identity)

  if (!identity) {
    return NextResponse.json({ error: 'Identity is required' }, { status: 400 });
  }

  const roomName = identity
  console.log("roomname is", roomName);

  try {
    // Fetch bot_instruction from unit_speaking_exercises if task_id is provided
    let systemInstruction = '';
    let metadata: any = undefined;

    if (taskId) {
      // First get the task type
      const { data: task } = await supabase
        .from('tasks')
        .select('task_type')
        .eq('id', taskId)
        .single();

      const taskType = task?.task_type || 'speaking';

      // Fetch data from the appropriate task table
      const { data: taskData } = await supabase
        .from(`${taskType}_tasks`)
        .select('content, settings')
        .eq('task_id', taskId)
        .single();

      if (!taskData) {
        console.error(`[CONNECTION_DETAILS] No data found for task_id: ${taskId}`);
        return NextResponse.json({
          error: `Task not found: ${taskId}. Please ensure the task exists in the database.`
        }, { status: 404 });
      }

      // Extract instructions and level from content/settings
      const content = taskData.content || {};
      const settings = taskData.settings || {};
      const level = content.cefr_level || settings.difficulty_level || 'A2';
      const topic = content.topic || settings.topic || 'General conversation';
      const instructions = content.instructions || settings.instructions || '';
      const language = content.language || settings.language || 'German';

      // Determine instruction type based on task type or settings
      let instructionType: 'SUPPORTIVE_PARTNER' | 'DEBATE_PARTNER' | 'STORYTELLING_PARTNER' | 'TARGET_LANGUAGE_ONLY' = 'SUPPORTIVE_PARTNER';

      // Check for debate type in settings or content
      if (taskType === 'debate' || settings.task_type === 'debate' || content.exercise_subtype === 'debate') {
        instructionType = 'DEBATE_PARTNER';
      } else if (taskType === 'storytelling' || settings.task_type === 'storytelling' || content.exercise_subtype === 'storytelling') {
        instructionType = 'STORYTELLING_PARTNER';
      }

      // Build system instruction from the task data
      systemInstruction = getSystemInstruction(instructionType, {
        level,
        topic,
        instructions,
        language
      });

      metadata = {
        user_id: identity,
        task_id: taskId,
        test_id: null,
        section_id: null,
        system_instructions: systemInstruction
      };
    } else if (testId) {
      // For GET requests, we need section_id from query params
      const { searchParams } = request.nextUrl;
      const section_id = searchParams.get('section_id');

      console.log(`[CONNECTION_DETAILS GET] Looking up test data for testId: ${testId}, section_id: ${section_id || 'NOT PROVIDED'}`);

      if (!section_id) {
        console.error('[CONNECTION_DETAILS GET] ERROR: section_id is required for test queries');
        return NextResponse.json({
          error: 'section_id is required for test queries in GET request'
        }, { status: 400 });
      }

      // For tests: fetch bot instructions from practice_tests_speaking
      // MUST use both id AND section_id to get unique row
      const { data: testData, error: dbError } = await supabase
        .from('practice_tests_speaking')
        .select('bot_instruction, section_id')
        .eq('test_id', testId)
        .eq('section_id', section_id)
        .single();

      console.log('[CONNECTION_DETAILS GET] Database query result:', {
        found_data: !!testData,
        has_bot_instruction: !!testData?.bot_instruction,
        error: dbError?.message || null
      });

      if (!testData || !testData.bot_instruction) {
        console.error(`[CONNECTION_DETAILS GET] No data found for test_id: ${testId}`);
        console.error('[CONNECTION_DETAILS GET] Query details:', {
          testId,
          found_record: !!testData,
          testData_keys: testData ? Object.keys(testData) : []
        });
        return NextResponse.json({
          error: `Test not found: ${testId}. Please ensure the test exists in the database.`
        }, { status: 404 });
      }

      // Combine German-only system instruction with specific test instructions
      const baseSystemInstruction = getSystemInstruction('GERMAN_ONLY', {
        level: 'A2',
        topic: 'Prüfungsgespräch',
        instructions: ''
      });

      // Add extra emphasis on conversational flow for speaking tests
      const conversationFlowReminder = `
KRITISCHE GESPRÄCHSREGELN:
- STELLE NIEMALS mehrere Fragen gleichzeitig
- Stelle EINE Frage und WARTE auf die vollständige Antwort
- Führe ein NATÜRLICHES Gespräch, kein Interview
- Höre aktiv zu und reagiere auf das Gesagte
- Lass den Lernenden ausreden, bevor du weitersprichst`;

      // Prefix the base system instruction with the specific test instructions
      systemInstruction = `${baseSystemInstruction}
${conversationFlowReminder}

SPEZIFISCHE TESTANWEISUNGEN:
${testData.bot_instruction}`;

      metadata = {
        user_id: identity,
        task_id: null,
        test_id: testId,
        section_id: testData.section_id || null,
        system_instructions: systemInstruction
      };
    }

    const result = await generateConnectionDetails(identity, userEmail, roomName, metadata);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CONNECTION_DETAILS] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// POST endpoint for new flow with lesson data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[CONNECTION_DETAILS] Raw request body:', JSON.stringify(body, null, 2));
    console.log('[CONNECTION_DETAILS] lesson_data section_id:', body.lesson_data?.section_id || 'MISSING');
    console.log('[CONNECTION_DETAILS] Full lesson_data:', JSON.stringify(body.lesson_data, null, 2));

    const { task_id, test_id, lesson_data, identity: identityParam } = body;

    console.log('[CONNECTION_DETAILS] POST Request received with:', {
      task_id: task_id || 'UNDEFINED',
      test_id: test_id || 'UNDEFINED',
      has_task_id: !!task_id,
      has_test_id: !!test_id,
      both_ids_same: task_id === test_id,
      has_lesson_data: !!lesson_data,
      lesson_data_keys: lesson_data ? Object.keys(lesson_data) : []
    });

    // Handle the case where both IDs are sent with the same value (shouldn't happen but let's be defensive)
    let actual_task_id = task_id;
    let actual_test_id = test_id;

    if (task_id && test_id && task_id === test_id) {
      console.warn('[CONNECTION_DETAILS] WARNING: Both task_id and test_id sent with same value:', task_id);
      // Assume it's a test request since tests are prioritized
      console.log('[CONNECTION_DETAILS] Treating as test request, ignoring task_id');
      actual_task_id = undefined;
    }

    let identity: string;
    let userEmail: string | undefined;
    let assignmentId: string = actual_test_id || actual_task_id || 'default_task';
    let userId: string;

    if (identityParam === 'guest_user') {
      // Handle guest user
      identity = `user_guest:::${assignmentId}`;
      userEmail = 'guest_user';
      userId = 'guest_user';
    } else {
      // Handle authenticated user
      const user = await currentUser();
      userEmail = user?.emailAddresses?.[0]?.emailAddress;
      userId = user?.id || 'unknown_user';
      identity = `${userId}:::${assignmentId}`;
    }

    console.log("identity is:", identity);

    if (!identity) {
      return NextResponse.json({ error: 'Identity is required' }, { status: 400 });
    }

    const roomName = identity;
    console.log("roomname is", roomName);

    // Prepare metadata based on task_id or test_id
    let metadata: any;

    // Determine which type of request this is
    console.log(`[CONNECTION_DETAILS] Processing ${actual_test_id ? 'TEST' : actual_task_id ? 'TASK' : 'DEFAULT'} request`);

    // Prioritize test_id over task_id when both are provided
    if (actual_test_id) {
      // Extract section_id from lesson_data
      const section_id = lesson_data?.section_id;

      console.log(`[CONNECTION_DETAILS] Looking up test data for test_id: ${actual_test_id}, section_id: ${section_id || 'NOT PROVIDED'}`);
      console.log('[CONNECTION_DETAILS] lesson_data object:', lesson_data);
      console.log('[CONNECTION_DETAILS] typeof lesson_data:', typeof lesson_data);
      console.log('[CONNECTION_DETAILS] lesson_data keys:', lesson_data ? Object.keys(lesson_data) : 'undefined');

      if (!section_id) {
        console.error('[CONNECTION_DETAILS] ERROR: section_id is required for test queries');
        return NextResponse.json({
          error: 'section_id is required for test queries'
        }, { status: 400 });
      }

      // For tests: fetch bot instructions from practice_tests_speaking
      // MUST use both test_id AND section_id to get unique row
      const { data: testData, error: dbError } = await supabase
        .from('practice_tests_speaking')
        .select('bot_instruction, section_id')
        .eq('test_id', actual_test_id)
        .eq('section_id', section_id)
        .single();

      console.log('[CONNECTION_DETAILS] Database query result:', {
        queried_id: actual_test_id,
        queried_section: section_id,
        found_data: !!testData,
        has_bot_instruction: !!testData?.bot_instruction,
        error: dbError?.message || null,
        error_details: dbError || null
      });

      if (!testData || !testData.bot_instruction) {
        // Log exactly what we tried to query
        console.error(`[CONNECTION_DETAILS] Database lookup failed:`, {
          queried_id: actual_test_id,
          queried_section: section_id,
          table: 'practice_tests_speaking',
          found_record: !!testData,
          has_bot_instruction: testData ? !!testData.bot_instruction : false,
          testData_keys: testData ? Object.keys(testData) : [],
          bot_instruction_preview: testData?.bot_instruction ? testData.bot_instruction.substring(0, 50) + '...' : null
        });

        // Try a direct query to verify the record exists
        const { data: verifyData } = await supabase
          .from('practice_tests_speaking')
          .select('test_id, section_id')
          .eq('test_id', actual_test_id)
          .eq('section_id', section_id)
          .single();

        console.error(`[CONNECTION_DETAILS] Verification query with section_id:`, {
          record_exists: !!verifyData,
          verify_id: verifyData?.test_id,
          verify_section: verifyData?.section_id
        });

        return NextResponse.json({
          error: `Test not found: ${actual_test_id}. Please ensure the test exists in the database.`
        }, { status: 404 });
      }

      // Combine German-only system instruction with specific test instructions
      const baseSystemInstruction = getSystemInstruction('GERMAN_ONLY', {
        level: lesson_data?.level || 'A2',
        topic: 'Prüfungsgespräch',
        instructions: ''
      });

      // Prefix the base system instruction with the specific test instructions
      const combinedSystemInstruction = `${baseSystemInstruction}

SPEZIFISCHE TESTANWEISUNGEN:
${testData.bot_instruction}`;

      metadata = {
        user_id: userId,
        task_id: null,
        test_id: actual_test_id,
        section_id: testData.section_id || null,
        system_instructions: combinedSystemInstruction
      };
    } else if (actual_task_id) {
      // Fetch data for tasks
      console.log(`[CONNECTION_DETAILS] Fetching task data for task_id: ${actual_task_id}`);

      // First get the task type
      const { data: task } = await supabase
        .from('tasks')
        .select('task_type')
        .eq('id', actual_task_id)
        .single();

      const taskType = task?.task_type || 'speaking';

      const { data: taskData, error: dbError } = await supabase
        .from(`${taskType}_tasks`)
        .select('content, settings')
        .eq('task_id', actual_task_id)
        .single();

      console.log('[CONNECTION_DETAILS] Task query result:', {
        task_id: actual_task_id,
        task_type: taskType,
        found_data: !!taskData,
        error: dbError?.message || null
      });

      if (!taskData) {
        console.error(`[CONNECTION_DETAILS] No data found for task_id: ${actual_task_id}`);
        console.error('[CONNECTION_DETAILS] Query error details:', dbError);
        return NextResponse.json({
          error: `Task not found: ${actual_task_id}. Please ensure the task exists in the database.`
        }, { status: 404 });
      }

      // Extract instructions and level from content/settings
      const content = taskData.content || {};
      const settings = taskData.settings || {};
      const level = content.cefr_level || settings.difficulty_level || 'A2';
      const topic = content.topic || settings.topic || 'General conversation';
      const instructions = content.instructions || settings.instructions || '';
      const language = content.language || settings.language || 'German';

      // Determine instruction type based on task type or settings
      let instructionType: 'SUPPORTIVE_PARTNER' | 'DEBATE_PARTNER' | 'STORYTELLING_PARTNER' | 'TARGET_LANGUAGE_ONLY' = 'SUPPORTIVE_PARTNER';

      // Check for debate type in settings or content
      if (taskType === 'debate' || settings.task_type === 'debate' || content.exercise_subtype === 'debate') {
        instructionType = 'DEBATE_PARTNER';
      } else if (taskType === 'storytelling' || settings.task_type === 'storytelling' || content.exercise_subtype === 'storytelling') {
        instructionType = 'STORYTELLING_PARTNER';
      }

      // Build system instruction from the task data
      const systemInstructionWithLevel = getSystemInstruction(instructionType, {
        level,
        topic,
        instructions,
        language
      });

      metadata = {
        user_id: userId,
        task_id: actual_task_id,
        test_id: null,
        section_id: null,
        system_instructions: systemInstructionWithLevel
      };
    } else {
      // Neither task_id nor test_id provided - use a default supportive partner
      console.log('[CONNECTION_DETAILS] No task_id or test_id provided, using default supportive partner');
      const defaultSystemInstruction = getSystemInstruction('SUPPORTIVE_PARTNER', {
        level: 'A2',
        topic: 'Allgemeines Gespräch',
        instructions: 'Führe ein freundliches Übungsgespräch.'
      });

      metadata = {
        user_id: userId,
        task_id: null,
        test_id: null,
        section_id: null,
        system_instructions: defaultSystemInstruction
      };
    }

    console.log('[CONNECTION_DETAILS] Metadata being sent to LiveKit:', {
      user_id: metadata.user_id,
      task_id: metadata.task_id,
      test_id: metadata.test_id,
      section_id: metadata.section_id,
      has_system_instructions: !!metadata.system_instructions,
      system_instructions_length: metadata.system_instructions?.length || 0
    });

    const result = await generateConnectionDetails(identity, userEmail, roomName, metadata);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CONNECTION_DETAILS] Error in POST:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}