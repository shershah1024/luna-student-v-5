import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint for materials backend API without authentication
 * POST /api/materials/reading/test-passage
 */
export async function POST(request: NextRequest) {
  console.log('=== MATERIALS TEST PASSAGE START ===');
  
  try {
    const body = await request.json();
    const {
      topic,
      text_type,
      cefr_level = 'B1'
    } = body;

    // Validate required fields
    if (!topic || !text_type) {
      return NextResponse.json({
        error: 'Missing required fields: topic and text_type are required'
      }, { status: 400 });
    }

    // Prepare request payload for materials backend
    const materialsBackendPayload = {
      topic,
      text_type,
      cefr_level
    };

    console.log('[MATERIALS TEST] Calling materials backend:', materialsBackendPayload);

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
      console.error('[MATERIALS TEST] Backend error:', response.status, errorText);
      return NextResponse.json({
        error: 'Failed to generate reading passage',
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    
    console.log('[MATERIALS TEST] Success:', {
      title: result.title,
      reading_level: result.reading_level
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        generated_at: new Date().toISOString(),
        test_mode: true
      }
    });

  } catch (error) {
    console.error('[MATERIALS TEST] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}