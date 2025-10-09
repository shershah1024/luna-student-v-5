import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Convert saved material to lesson format
 * GET /api/materials/lesson-adapter?material_id=<id>
 * 
 * This endpoint converts teachezee materials to the format expected
 * by the existing lesson reading interface
 */
export async function GET(request: NextRequest) {
  console.log('=== MATERIALS LESSON ADAPTER START ===');

  try {
    // Temporary: Skip authentication for testing - TODO: Re-enable auth
    console.log('[LESSON ADAPTER] Skipping authentication for testing purposes');
    const userId = 'temp-user-id';
    const { searchParams } = request.nextUrl;
    const materialId = searchParams.get('material_id');
    const adapterType = searchParams.get('type'); // 'exercise' or 'reading'

    if (!materialId) {
      console.log('[LESSON ADAPTER] Missing material_id parameter');
      return NextResponse.json({
        error: 'Missing required parameter: material_id'
      }, { status: 400 });
    }

    console.log('[LESSON ADAPTER] Query parameters:', {
      materialId,
      adapterType,
      userId
    });

    // Get material with questions (skip user filter for anonymous access)
    const { data: material, error: materialError } = await supabase
      .from('teachezee_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      console.error('[LESSON ADAPTER] Material not found or access denied:', materialError);
      return NextResponse.json({
        error: 'Material not found or access denied'
      }, { status: 404 });
    }

    // Get questions if it's a test material
    let questions = [];
    if (material.type === 'reading_test') {
      const { data: questionData, error: questionError } = await supabase
        .from('teachezee_questions')
        .select('*')
        .eq('material_id', materialId)
        .order('question_number', { ascending: true });

      if (!questionError && questionData) {
        questions = questionData;
      }
    }

    // Convert to expected format based on adapter type
    if (adapterType === 'exercise') {
      // Format for exercise-data endpoint
      const exerciseData = {
        course_name: 'Custom Materials',
        chapter_id: `material-${materialId}`,
        chapter_title: 'Generated Material',
        chapter_theme: material.target_audience || 'General',
        exercise_id: materialId,
        exercise_objective: material.metadata.learning_objectives?.join(', ') || 'Reading comprehension',
        exercise_type: material.type === 'reading_test' ? 'reading_intermediate' : 'reading_passage',
        status: material.status,
        task_id: `material-${materialId}`,
        lesson_name: material.title
      };

      console.log('[LESSON ADAPTER] Converted to exercise format:', exerciseData);
      return NextResponse.json(exerciseData);

    } else if (adapterType === 'reading') {
      // Convert questions to the old format expected by the lesson interface
      const convertedQuestions = questions.map((q, index) => {
        const answerData = q.answer_data || {};
        
        switch (q.question_type) {
          case 'multiple_choice':
            return {
              id: q.id,
              type: 'multiple_choice',
              question: q.question_text,
              options: answerData.options?.map((opt: any) => opt.text) || [],
              correct_answer: answerData.options?.find((opt: any) => opt.is_correct)?.text || '',
              points: q.points,
              explanation: q.explanation
            };
            
          case 'true_false':
            return {
              id: q.id,
              type: 'true_false',
              statement: q.question_text,
              correct_answer: answerData.correct_answer,
              points: q.points,
              explanation: q.explanation
            };
            
          case 'fill_in_blank':
            return {
              id: q.id,
              type: 'fill_in_blank',
              text: q.question_text,
              answers: answerData.answers || [],
              points: q.points,
              explanation: q.explanation
            };
            
          default:
            // For other question types, create a generic format
            return {
              id: q.id,
              type: q.question_type,
              question: q.question_text,
              answer_data: answerData,
              points: q.points,
              explanation: q.explanation
            };
        }
      });

      // Format for reading-exercise endpoint
      const readingData = {
        id: parseInt(materialId) || 0,
        course_name: 'Custom Materials',
        chapter_id: `material-${materialId}`,
        exercise_id: materialId,
        text_title: material.title,
        reading_text: material.content,
        questions: convertedQuestions,
        exercise_type: material.type === 'reading_test' ? 'reading_intermediate' : 'reading_passage',
        task_id: `material-${materialId}`
      };

      console.log('[LESSON ADAPTER] Converted to reading format:', {
        ...readingData,
        reading_text: readingData.reading_text.substring(0, 100) + '...',
        questions: `${readingData.questions.length} questions`
      });
      
      return NextResponse.json(readingData);
    }

    // Default: return material info
    return NextResponse.json({
      material,
      questions,
      converted_task_id: `material-${materialId}`
    });

  } catch (error) {
    console.error('[LESSON ADAPTER] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}