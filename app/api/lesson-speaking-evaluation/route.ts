import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { updateTaskCompletion } from '@/lib/task-completion-service';
import { LLMBackendError, sendLLMJson } from '@/lib/llm-backend';

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[Lesson Speaking Evaluation] Processing request');

  try {
    // Parse request body
    const { 
      task_id,
      conversation_history,
      task_instructions,
      course_name = 'telc_a1'
    } = await req.json();
    
    // Authenticate user using Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate required data
    if (!task_id || !conversation_history) {
      return NextResponse.json(
        { error: 'Missing required data: task_id and conversation_history are required' }, 
        { status: 400 }
      );
    }
    
    // Fetch user instructions from the database
    let detailedInstructions = task_instructions; // Fallback to provided instructions
    
    try {
      const { data: instructionData, error: instructionError } = await supabase
        .from('lesson_speaking_instructions')
        .select('user_instruction')
        .eq('task_id', task_id)
        .single();
      
      if (instructionData?.user_instruction) {
        detailedInstructions = instructionData.user_instruction;
        console.log('[Lesson Speaking Evaluation] Using detailed instructions from database');
      } else {
        console.log('[Lesson Speaking Evaluation] No detailed instructions found, using fallback');
      }
    } catch (error) {
      console.log('[Lesson Speaking Evaluation] Error fetching instructions:', error);
    }
    
    // Parse conversation history if it's a string
    const conversations = typeof conversation_history === 'string' 
      ? JSON.parse(conversation_history) 
      : conversation_history;
    
    console.log('[Lesson Speaking Evaluation] Requesting evaluation from LLM backend');
    const backendStart = Date.now();
    const evaluation = await sendLLMJson('/api/telc-a2-lesson-speaking-evaluation', {
      task_id,
      conversation_history: conversations,
      task_instructions: detailedInstructions,
      course_name,
      user_id: userId,
    });
    const backendDuration = Date.now() - backendStart;
    console.log('[Lesson Speaking Evaluation] LLM backend responded in', backendDuration, 'ms');
    
    // Get the current attempt number for this user and task
    const { data: previousAttempts, error: attemptError } = await supabase
      .from('lesson_speaking_scores')
      .select('attempt_id')
      .eq('user_id', userId)
      .eq('task_id', task_id)
      .order('attempt_id', { ascending: false })
      .limit(1);
    
    // Calculate the next attempt number
    const nextAttemptId = attemptError || !previousAttempts || previousAttempts.length === 0 
      ? 1 
      : (previousAttempts[0].attempt_id || 0) + 1;
    
    console.log(`[Lesson Speaking Evaluation] Creating attempt #${nextAttemptId} for user ${userId} on task ${task_id}`);
    
    // Check if user has exceeded maximum attempts (3 attempts)
    if (nextAttemptId > 3) {
      console.log('[Lesson Speaking Evaluation] User has reached maximum attempts (3) for task:', task_id);
      return NextResponse.json(
        { 
          error: 'Maximum attempts reached', 
          message: 'You have reached the maximum of 3 attempts for this exercise. Please continue to the next lesson.',
          attemptId: nextAttemptId - 1,
          maxAttemptsReached: true
        }, 
        { status: 403 }
      );
    }
    
    // Prepare data for database insertion
    const scoreData = {
      user_id: userId,
      task_id: task_id,
      course_name,
      conversation_history: conversations,
      task_instructions,
      grammar_vocabulary_score: evaluation.grammar_vocabulary.score,
      communication_score: evaluation.communication_effectiveness.score,
      total_score: evaluation.total_score,
      percentage_score: evaluation.percentage_score,
      attempt_id: nextAttemptId, // Add the attempt_id
      evaluation_data: {
        task_completion: evaluation.task_completion,
        grammar_vocabulary: {
          ...evaluation.grammar_vocabulary,
          grammar_errors: evaluation.grammar_vocabulary.grammar_errors_list // Store detailed grammar errors
        },
        communication_effectiveness: evaluation.communication_effectiveness,
        overall_feedback: evaluation.overall_feedback,
        level_assessment: evaluation.level_assessment,
        evaluation_timestamp: new Date().toISOString()
      }
    };
    
    // Save the evaluation to the database
    console.log('[Lesson Speaking Evaluation] Saving evaluation to database');
    const { data, error: dbError } = await supabase
      .from('lesson_speaking_scores')
      .insert(scoreData)
      .select()
      .single();
    
    if (dbError) {
      console.error('[Lesson Speaking Evaluation] Error saving to database:', dbError);
      // Continue with returning the evaluation even if saving fails
    } else {
      console.log('[Lesson Speaking Evaluation] Successfully saved to database with id:', data?.id);
      
      // Update task completion tracking (no score needed - scores are in lesson_speaking_scores)
      await updateTaskCompletion({
        userId,
        taskId: task_id
      });
      
      // Save grammar errors to the dedicated grammar_errors table
      // This duplicates the data but allows for cross-exercise grammar analysis
      const grammarErrors = evaluation.grammar_vocabulary.grammar_errors_list;
      if (grammarErrors && grammarErrors.length > 0) {
        console.log('[Lesson Speaking Evaluation] Saving', grammarErrors.length, 'grammar errors to grammar_errors table');
        
        // Convert conversation history to string for context
        const contextString = JSON.stringify(conversations, null, 2);
        
        const grammarErrorsToInsert = grammarErrors.map((error: any) => ({
          user_id: userId,
          course: course_name || 'telc_a1',
          source_type: 'speaking',
          source_id: data?.id?.toString() || null,
          task_id: task_id,
          attempt_id: nextAttemptId,
          error_text: error.error,
          correction: error.correction,
          explanation: error.explanation,
          grammar_category: error.grammar_category,
          severity: error.severity,
          context: contextString, // Store the conversation history as context
          error_type: error.grammar_category // Duplicate for backward compatibility
        }));

        const { error: grammarInsertError } = await supabase
          .from('grammar_errors')
          .insert(grammarErrorsToInsert);

        if (grammarInsertError) {
          console.error('[Lesson Speaking Evaluation] Error saving grammar errors to dedicated table:', grammarInsertError);
          // Don't fail the whole evaluation if grammar errors can't be saved
        } else {
          console.log('[Lesson Speaking Evaluation] Successfully saved grammar errors to dedicated table');
        }
      }
    }
    
    const totalDuration = Date.now() - startTime;
    console.log('[Lesson Speaking Evaluation] Total processing time:', totalDuration, 'ms');
    
    // Return the evaluation results
    return NextResponse.json({
      task_completion: evaluation.task_completion,
      grammar_vocabulary: evaluation.grammar_vocabulary,
      communication_effectiveness: evaluation.communication_effectiveness,
      total_score: evaluation.total_score,
      max_score: 10,
      percentage: evaluation.percentage_score,
      overall_feedback: evaluation.overall_feedback,
      level_assessment: evaluation.level_assessment,
      db_record_id: data?.id || null,
      attempt_id: nextAttemptId, // Include attempt_id in response
      breakdown: {
        grammar_vocabulary: evaluation.grammar_vocabulary.score,
        communication: evaluation.communication_effectiveness.score
      }
    });
    
  } catch (error) {
    if (error instanceof LLMBackendError) {
      console.error('[Lesson Speaking Evaluation] LLM backend error:', {
        status: error.status,
        message: error.message,
        payload: error.payload,
      });
      return NextResponse.json(
        { error: error.message, details: error.payload },
        { status: error.status }
      );
    }

    console.error('[Lesson Speaking Evaluation] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}