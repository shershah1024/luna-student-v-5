import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Save reading materials (passage or test) to database
 * POST /api/materials/reading/save
 */
export async function POST(request: NextRequest) {
  console.log('=== MATERIALS SAVE START ===');
  console.log('[MATERIALS SAVE] Request timestamp:', new Date().toISOString());

  try {
    // Temporary: Skip authentication for testing - TODO: Re-enable auth
    console.log('[MATERIALS SAVE] Skipping authentication for testing purposes');
    const userId = 'temp-user-id';

    const body = await request.json();
    const {
      type, // 'reading_passage' or 'reading_test'
      materialData, // The generated content from materials backend
      metadata: additionalMetadata = {} // Any additional metadata from frontend
    } = body;

    console.log('[MATERIALS SAVE] Saving material:', {
      type,
      title: materialData.title || materialData.reading_text?.title,
      userId
    });

    // Validate required fields
    if (!type || !materialData) {
      return NextResponse.json({
        error: 'Missing required fields: type and materialData are required'
      }, { status: 400 });
    }

    // Prepare material data based on type
    let materialRecord;
    
    if (type === 'reading_passage') {
      // Single reading passage
      materialRecord = {
        user_id: userId,
        type: 'reading_passage',
        title: materialData.title,
        content: materialData.content,
        cefr_level: materialData.reading_level,
        difficulty_score: materialData.difficulty_score,
        target_audience: materialData.target_audience,
        metadata: {
          key_vocabulary: materialData.key_vocabulary || [],
          main_concepts: materialData.main_concepts || [],
          learning_objectives: materialData.learning_objectives || [],
          summary: materialData.summary,
          word_count: materialData.content ? materialData.content.split(' ').length : 0,
          ...additionalMetadata
        },
        status: 'draft',
        is_public: false
      };
    } else if (type === 'reading_test') {
      // Complete test with reading passage and questions
      const readingText = materialData.reading_text;
      materialRecord = {
        user_id: userId,
        type: 'reading_test',
        title: readingText.title,
        content: readingText.content,
        cefr_level: readingText.reading_level,
        difficulty_score: readingText.difficulty_score,
        target_audience: readingText.target_audience,
        metadata: {
          key_vocabulary: readingText.key_vocabulary || [],
          main_concepts: readingText.main_concepts || [],
          learning_objectives: readingText.learning_objectives || [],
          summary: readingText.summary,
          word_count: readingText.content ? readingText.content.split(' ').length : 0,
          total_questions: materialData.plan?.questions?.length || 0,
          total_points: materialData.plan?.total_points || 0,
          question_plan: materialData.plan,
          ...additionalMetadata
        },
        status: 'draft',
        is_public: false
      };
    } else {
      return NextResponse.json({
        error: 'Invalid type. Must be "reading_passage" or "reading_test"'
      }, { status: 400 });
    }

    // Insert material into database
    console.log('[MATERIALS SAVE] Inserting material into database...');
    const { data: insertedMaterial, error: materialError } = await supabase
      .from('teachezee_materials')
      .insert(materialRecord)
      .select()
      .single();

    if (materialError) {
      console.error('[MATERIALS SAVE] Error inserting material:', materialError);
      return NextResponse.json({
        error: 'Failed to save material',
        details: materialError.message
      }, { status: 500 });
    }

    console.log('[MATERIALS SAVE] Material saved successfully:', insertedMaterial.id);

    // If it's a reading test, save the questions
    let insertedQuestions = [];
    console.log('[MATERIALS SAVE] Checking for questions:', {
      type,
      hasQuestions: !!materialData.questions,
      questionKeys: materialData.questions ? Object.keys(materialData.questions) : [],
      questionStructure: materialData.questions ? JSON.stringify(materialData.questions, null, 2).substring(0, 500) + '...' : 'none'
    });
    
    if (type === 'reading_test' && materialData.questions) {
      console.log('[MATERIALS SAVE] Saving questions...');
      
      const questionRecords = [];
      let questionNumber = 1;

      // Process each question type
      for (const [questionType, questions] of Object.entries(materialData.questions)) {
        if (!Array.isArray(questions)) continue;

        for (const question of questions) {
          // Convert question format to our database format
          let answerData = {};

          if (question.options) {
            // Multiple choice or checkbox
            answerData = {
              options: question.options.map(opt => ({
                text: opt.option,
                is_correct: opt.is_correct
              }))
            };
          } else if (question.answer) {
            // Direct answer (fill in blanks, short answer, etc.)
            answerData = {
              answers: Array.isArray(question.answer) ? question.answer : [question.answer]
            };
          } else if (questionType === 'true_false') {
            // True/False questions might have answer in different format
            answerData = {
              correct_answer: question.correct_answer ?? true
            };
          }

          questionRecords.push({
            material_id: insertedMaterial.id,
            question_number: questionNumber++,
            question_type: questionType,
            question_text: question.question,
            points: question.points || 1,
            explanation: question.explanation,
            answer_data: answerData
          });
        }
      }

      if (questionRecords.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('teachezee_questions')
          .insert(questionRecords)
          .select();

        if (questionsError) {
          console.error('[MATERIALS SAVE] Error inserting questions:', questionsError);
          // Don't fail the whole operation, but log the error
        } else {
          insertedQuestions = questionsData || [];
          console.log('[MATERIALS SAVE] Questions saved successfully:', insertedQuestions.length);
        }
      }
    }

    // Return success response
    const response = {
      success: true,
      data: {
        material: insertedMaterial,
        questions: insertedQuestions,
        summary: {
          material_id: insertedMaterial.id,
          type: insertedMaterial.type,
          title: insertedMaterial.title,
          cefr_level: insertedMaterial.cefr_level,
          question_count: insertedQuestions.length,
          total_points: materialRecord.metadata?.total_points || 0
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log('[MATERIALS SAVE] Success response:', {
      material_id: response.data.material.id,
      question_count: response.data.questions.length,
      type: response.data.material.type
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('[MATERIALS SAVE] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}