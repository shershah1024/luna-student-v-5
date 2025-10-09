import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * Generate reading passage using materials backend API
 * POST /api/materials/reading/generate-passage
 * 
 * Proxies requests to materials-backend-api for reading passage generation
 * Supports all CEFR levels (A1-C2) and various text types
 */
export async function POST(request: NextRequest) {
  console.log('=== MATERIALS READING PASSAGE START ===');
  console.log('[MATERIALS] Request timestamp:', new Date().toISOString());
  
  try {
    // Temporary: Skip authentication for testing - TODO: Re-enable auth
    console.log('[MATERIALS] Skipping authentication for testing purposes');
    const userId = 'temp-user-id';

    const body = await request.json();
    const {
      topic,
      text_type,
      cefr_level = 'B1',
      word_count,
      custom_instructions,
      target_audience,
      key_concepts
    } = body;

    // Validate required fields
    if (!topic || !text_type) {
      return NextResponse.json({
        error: 'Missing required fields: topic and text_type are required'
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

    // Prepare request payload for materials backend
    const materialsBackendPayload = {
      topic,
      text_type,
      cefr_level,
      ...(word_count && { word_count }),
      ...(custom_instructions && { custom_instructions }),
      ...(target_audience && { target_audience }),
      ...(key_concepts && { key_concepts })
    };

    console.log('[MATERIALS] Calling materials backend for reading passage generation:', {
      topic,
      text_type,
      cefr_level,
      word_count,
      userId
    });

    // Call materials backend API
    const materialsBackendUrl = process.env.MATERIALS_BACKEND_URL || 'http://materials-backend-api.eastus.azurecontainer.io:8000';
    const response = await fetch(`${materialsBackendUrl}/reading/generate-text`, {
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
        error: 'Failed to generate reading passage',
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    
    console.log('[MATERIALS] Successfully generated reading passage:', {
      title: result.title,
      reading_level: result.reading_level,
      word_count: result.content ? result.content.split(' ').length : 0,
      difficulty_score: result.difficulty_score
    });

    // Auto-save the generated passage to database
    console.log('[MATERIALS] Auto-saving passage to database...');
    try {
      const savePayload = {
        type: 'reading_passage',
        materialData: result,
        metadata: {
          generated_at: new Date().toISOString(),
          user_id: userId,
          cefr_level,
          topic,
          text_type,
          generation_source: 'materials_backend'
        }
      };

      const saveResponse = await fetch(`${request.url.split('/generate-passage')[0]}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savePayload)
      });

      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        console.log('[MATERIALS] Passage saved to database:', saveData.data.summary);
        
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
            text_type
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
        text_type
      }
    });

  } catch (error) {
    console.error('[MATERIALS] Error generating reading passage:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}