/**
 * Streaming Transcription API using Azure OpenAI Whisper
 * Processes audio with stream=true for lower latency
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the audio file from the request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Azure OpenAI configuration
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = 'gpt-4o-transcribe'; // Use the working deployment
    const apiVersion = '2025-03-01-preview';
    
    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }
    
    // Create form data for Azure OpenAI
    const azureFormData = new FormData();
    azureFormData.append('file', audioFile);
    azureFormData.append('model', 'gpt-4o-transcribe');
    azureFormData.append('response_format', 'json');
    // Let Azure auto-detect language for better accuracy
    
    // Call Azure OpenAI Whisper API
    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/audio/transcriptions?api-version=${apiVersion}`;
    
    console.log('[Streaming Transcription] Calling Azure Whisper API');
    const startTime = Date.now();
    
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: azureFormData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Streaming Transcription] Azure error:', errorText);
      return NextResponse.json(
        { error: 'Transcription failed', details: errorText },
        { status: response.status }
      );
    }
    
    // Process the response (gpt-4o-transcribe doesn't support streaming yet)
    const data = await response.json();
    const processingTime = Date.now() - startTime;
    
    console.log(`[Streaming Transcription] Completed in ${processingTime}ms`);
    
    return NextResponse.json({
      transcript: data.text || '',
      processingTimeMs: processingTime,
      language: data.language || 'auto-detected',
    });
    
  } catch (error) {
    console.error('[Streaming Transcription] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}