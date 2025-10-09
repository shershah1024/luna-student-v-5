import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('o4-mini');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TELCA1EvaluationSchema = z.object({
  task_completion_and_linguistic_realization_score: z.number(),
  task_completion_rationale: z.string(),
  linguistic_realization_rationale: z.string(),
  overall_evaluation: z.string(),
  strengths: z.array(z.string()),
  areas_for_improvement: z.array(z.string()),
  recommendations: z.string(),
  total_score: z.number(),
  max_score: z.number(),
  section_name: z.string(),
  level_assessment: z.string()
});

function getA1AssessmentCriteria(section: number): { criteria: string; maxScore: number; sectionName: string } {
  switch (section) {
    case 1:
      return {
        criteria: `TELC A1 Speaking Teil 1 – Sich vorstellen. Bewertet wird Erfüllung der Aufgabenstellung und sprachliche Realisierung (0, 1.5 oder 3 Punkte).`,
        maxScore: 3,
        sectionName: 'Sich vorstellen'
      };
    case 2:
      return {
        criteria: `TELC A1 Speaking Teil 2 – Um Informationen bitten und Informationen geben. Bewertet wird Erfüllung der Aufgabenstellung und sprachliche Realisierung (0, 3 oder 6 Punkte).`,
        maxScore: 6,
        sectionName: 'Informationen austauschen'
      };
    case 3:
      return {
        criteria: `TELC A1 Speaking Teil 3 – Bitten formulieren und darauf reagieren. Bewertet wird Erfüllung der Aufgabenstellung und sprachliche Realisierung (0, 3 oder 6 Punkte).`,
        maxScore: 6,
        sectionName: 'Bitten formulieren'
      };
    default:
      return {
        criteria: 'TELC A1 Speaking Gesamtbewertung',
        maxScore: 6,
        sectionName: 'Speaking'
      };
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { task_id, test_id, exam_id } = await req.json();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!task_id) {
      return NextResponse.json({ error: 'Missing task_id' }, { status: 400 });
    }

    const { data: taskRow, error: taskError } = await supabase
      .from('speaking_tasks')
      .select('settings, content')
      .eq('task_id', task_id)
      .single();

    if (taskError || !taskRow) {
      console.error('[TELC A1] Task lookup error:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const settings = taskRow.settings || {};
    const course = settings.course;
    const section = Number(settings.section ?? 1);
    const instructions = settings.test_taker_instructions || taskRow.content?.instructions || '';

    if (course !== 'telc_a1') {
      return NextResponse.json({ error: 'This endpoint is only for TELC A1 evaluations' }, { status: 400 });
    }

    const { data: latestLog, error: latestError } = await supabase
      .from('task_conversation_logs')
      .select('conversation_id')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      console.error('[TELC A1] Conversation lookup error:', latestError);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }

    const conversationId = latestLog?.conversation_id;
    if (!conversationId) {
      return NextResponse.json({ error: 'No conversation found for this task' }, { status: 404 });
    }

    const { data: conversation, error: convoError } = await supabase
      .from('task_conversation_logs')
      .select('role, message')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .order('turn_index', { ascending: true });

    if (convoError) {
      console.error('[TELC A1] Conversation fetch error:', convoError);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }

    if (!conversation || conversation.length === 0) {
      return NextResponse.json({ error: 'No conversation found for this task' }, { status: 404 });
    }

    const transcript = conversation
      .map((msg) => `${(msg.role || '').toUpperCase()}: ${msg.message}`)
      .join('\n');

    const { criteria, maxScore, sectionName } = getA1AssessmentCriteria(section);

    const prompt = `You are a TELC A1 examiner evaluating a speaking performance.

${criteria}

Task instructions:
${instructions}

Conversation:
${transcript}

Evaluate according to the official TELC A1 scale (0, ${maxScore / 2}, ${maxScore}).`;

    const evaluation = await generateObject({
      model,
      schema: TELCA1EvaluationSchema,
      prompt
    });

    const { data: latestAttempt } = await supabase
      .from('task_responses')
      .select('attempt_number')
      .eq('task_id', task_id)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextAttempt = (latestAttempt?.attempt_number || 0) + 1;

    const { error: insertError } = await supabase
      .from('task_responses')
      .insert({
        task_id,
        user_id: userId,
        attempt_number: nextAttempt,
        payload: {
          evaluation: evaluation.object,
          conversation_id: conversationId
        },
        score: evaluation.object.total_score,
        max_score: evaluation.object.max_score,
        metadata: {
          section,
          exam_id,
          test_id,
          level: evaluation.object.level_assessment
        }
      });

    if (insertError) {
      console.error('[TELC A1] Failed to persist evaluation:', insertError);
    }

    const duration = Date.now() - startTime;
    console.log('[TELC A1 Speaking Evaluation] Completed in', duration, 'ms');

    return NextResponse.json({
      success: true,
      evaluation: evaluation.object,
      metadata: {
        task_id,
        test_id,
        exam_id,
        section,
        section_name: sectionName,
        total_score: evaluation.object.total_score,
        max_score: evaluation.object.max_score,
        evaluated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[TELC A1 Speaking Evaluation] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// [File truncated for brevity in this patch due to size]