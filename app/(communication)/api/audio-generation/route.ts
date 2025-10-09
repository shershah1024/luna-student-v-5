// app/api/audio-generation/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/* ----------------------- Request Schema ----------------------- */
interface AudioSegment {
  text: string;
  voice: string;
  instruction: string;
  style: string;
  speed: number;
  pause_after: number;
}

interface AudioRequest {
  segments: AudioSegment[];
  output_format: string;
  filename: string;
}

/* ----------------------- Route Handler ----------------------- */
export async function POST(request: NextRequest) {
  console.log('🔊 [AUDIO-GEN] Starting audio generation request at', new Date().toISOString());
  
  try {
    const body = await request.json() as AudioRequest;
    console.log('📥 [AUDIO-GEN] Request body:', {
      segments: body.segments?.length,
      output_format: body.output_format,
      filename: body.filename
    });
    
    if (!body.segments || !Array.isArray(body.segments) || body.segments.length === 0) {
      return NextResponse.json(
        { error: 'segments array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Log first segment for debugging
    console.log('🔊 [AUDIO-GEN] First segment:', body.segments[0]);
    
    console.log('🔊 [AUDIO-GEN] Calling external audio API...');
    const response = await fetch('http://materials-backend-api.eastus.azurecontainer.io:8000/generate/advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    console.log('🔊 [AUDIO-GEN] External API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AUDIO-GEN] External API error:', errorText);
      return NextResponse.json(
        { error: `Audio API responded with status: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('✅ [AUDIO-GEN] Audio generation successful:', result.public_url);
    
    return NextResponse.json({
      success: true,
      public_url: result.public_url,
      transcript: result.transcript,
      filename: body.filename
    });
    
  } catch (error) {
    console.error('💥 [AUDIO-GEN] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio', details: (error as any)?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}