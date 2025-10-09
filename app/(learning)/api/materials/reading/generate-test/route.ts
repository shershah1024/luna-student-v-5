import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * Generate complete reading test with passage and questions using materials backend API
 * POST /api/materials/reading/generate-test
 * 
 * Creates a complete reading test with both passage and comprehension questions
 * Supports various question types and CEFR-based difficulty levels
 */
export async function POST(request: NextRequest) {
  console.log('=== MATERIALS READING TEST START ===');
  console.log('[MATERIALS TEST] Request timestamp:', new Date().toISOString());
  
  try {
    // Temporary: Skip authentication for testing - TODO: Re-enable auth
    console.log('[MATERIALS TEST] Skipping authentication for testing purposes');
    const userId = 'temp-user-id';

    const body = await request.json();
    const {
      reading_instructions,
      question_instructions
    } = body;

    // Validate required fields
    if (!reading_instructions || !question_instructions) {
      return NextResponse.json({
        error: 'Missing required fields: reading_instructions and question_instructions are required'
      }, { status: 400 });
    }

    const {
      topic,
      text_type,
      cefr_level = 'B1',
      word_count,
      custom_instructions,
      target_audience,
      key_concepts
    } = reading_instructions;

    const {
      total_points,
      question_types,
      additional_instructions
    } = question_instructions;

    // Validate reading instructions
    if (!topic || !text_type) {
      return NextResponse.json({
        error: 'Missing required fields in reading_instructions: topic and text_type are required'
      }, { status: 400 });
    }

    // Validate question instructions
    if (!total_points || total_points < 1) {
      return NextResponse.json({
        error: 'Invalid total_points: must be a positive number'
      }, { status: 400 });
    }

    // Validate CEFR level
    const validCefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validCefrLevels.includes(cefr_level)) {
      return NextResponse.json({
        error: `Invalid CEFR level. Must be one of: ${validCefrLevels.join(', ')}`
      }, { status: 400 });
    }

    // Validate text type
    const validTextTypes = ['article', 'news', 'story', 'essay', 'report', 'tutorial'];
    if (!validTextTypes.includes(text_type)) {
      return NextResponse.json({
        error: `Invalid text type. Must be one of: ${validTextTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate question types if provided
    const validQuestionTypes = [
      'multiple_choice', 'true_false', 'fill_in_blanks', 'checkbox', 
      'matching', 'short_answer', 'sequence', 'vocabulary', 'open_ended'
    ];
    if (question_types && Array.isArray(question_types)) {
      const invalidTypes = question_types.filter(type => !validQuestionTypes.includes(type));
      if (invalidTypes.length > 0) {
        return NextResponse.json({
          error: `Invalid question types: ${invalidTypes.join(', ')}. Valid types: ${validQuestionTypes.join(', ')}`
        }, { status: 400 });
      }
    }

    // Prepare request payload for materials backend
    const materialsBackendPayload = {
      reading_instructions: {
        topic,
        text_type,
        cefr_level,
        ...(word_count && { word_count }),
        ...(custom_instructions && { custom_instructions }),
        ...(target_audience && { target_audience }),
        ...(key_concepts && { key_concepts })
      },
      question_instructions: {
        total_points,
        ...(question_types && { question_types }),
        ...(additional_instructions && { additional_instructions }),
        generate_detailed_questions: true,
        include_full_questions: true,
        detailed_mode: true
      }
    };

    console.log('[MATERIALS] Calling materials backend for complete reading test generation:', {
      topic,
      text_type,
      cefr_level,
      total_points,
      question_types: question_types ? question_types.length : 'default',
      userId
    });

    // Call materials backend API
    const materialsBackendUrl = process.env.MATERIALS_BACKEND_URL || 'http://materials-backend-api.eastus.azurecontainer.io:8000';
    const response = await fetch(`${materialsBackendUrl}/reading/generate-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialsBackendPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MATERIALS] Backend error:', response.status, errorText);
      return NextResponse.json({
        error: 'Failed to generate reading test',
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    
    // Count total questions generated
    const totalQuestions = Object.values(result.questions || {})
      .reduce((total: number, questionArray: any) => total + (Array.isArray(questionArray) ? questionArray.length : 0), 0);

    console.log('[MATERIALS] Successfully generated reading test:', {
      title: result.reading_text?.title,
      reading_level: result.reading_text?.reading_level,
      total_questions: totalQuestions,
      planned_points: result.plan?.total_points,
      difficulty_score: result.reading_text?.difficulty_score
    });

    // Auto-save the generated test to database
    console.log('[MATERIALS] Auto-saving test to database...');
    try {
      const savePayload = {
        type: 'reading_test',
        materialData: result,
        metadata: {
          generated_at: new Date().toISOString(),
          user_id: userId,
          cefr_level,
          topic,
          text_type,
          total_questions: totalQuestions,
          requested_points: total_points,
          generation_source: 'materials_backend'
        }
      };

      const saveResponse = await fetch(`${request.url.split('/generate-test')[0]}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savePayload)
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        console.log('[MATERIALS] Test saved to database:', saveData.data.summary);
        
        return NextResponse.json({
          success: true,
          data: result,
          saved: true,
          database_id: saveData.data.material.id,
          metadata: {
            generated_at: new Date().toISOString(),
            user_id: userId,
            cefr_level,
            topic,
            text_type,
            total_questions: totalQuestions,
            requested_points: total_points
          }
        });
      } else {
        console.warn('[MATERIALS] Failed to save to database, but generation succeeded');
      }
    } catch (saveError) {
      console.warn('[MATERIALS] Error saving to database:', saveError);
      // Don't fail the generation if save fails
    }

    return NextResponse.json({
      success: true,
      data: result,
      saved: false,
      metadata: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        cefr_level,
        topic,
        text_type,
        total_questions: totalQuestions,
        requested_points: total_points
      }
    });

  } catch (error) {
    console.error('[MATERIALS] Error generating reading test:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}