
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  console.log('[Text-to-Speech API] 🔊 Request received');
  
  try {
    const { text, voice = 'alloy', speed = 1.0 } = await request.json();
    
    if (!text) {
      console.error('[Text-to-Speech API] ❌ No text provided');
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Text-to-Speech API] 📝 Text details:', {
      textLength: text.length,
      voice: voice,
      speed: speed,
      preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });

    // Prepare Azure OpenAI TTS request
    const azureUrl = `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview`;
    
    const requestBody = {
      model: 'gpt-4o-mini-tts',
      input: text,
      voice: voice,
      speed: speed,
      response_format: 'mp3'
    };

    console.log('[Text-to-Speech API] 🚀 Sending to Azure OpenAI TTS...');
    console.log('[Text-to-Speech API] 📍 URL:', azureUrl);
    console.log('[Text-to-Speech API] 📦 Request body:', JSON.stringify(requestBody));
    
    const startTime = Date.now();

    // Add timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AZURE_OPENAI_API_KEY}`,
        'api-key': process.env.AZURE_OPENAI_API_KEY!, // Also try api-key header
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('[Text-to-Speech API] ❌ Request timed out after 25 seconds');
        throw new Error('TTS request timed out');
      }
      throw error;
    });

    clearTimeout(timeoutId);

    const processingTime = Date.now() - startTime;
    
    console.log('[Text-to-Speech API] 📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      processingTimeMs: processingTime
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Text-to-Speech API] ❌ Azure TTS Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        processingTimeMs: processingTime
      });
      
      return new Response(
        JSON.stringify({
          error: 'Text-to-speech failed',
          details: errorText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the audio data as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    console.log('[Text-to-Speech API] ✅ Audio generation successful:', {
      audioSizeBytes: audioBuffer.byteLength,
      audioSizeKB: Math.round(audioBuffer.byteLength / 1024),
      processingTimeMs: processingTime,
      voice: voice
    });

    // Return the audio file
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('[Text-to-Speech API] ❌ Fatal error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}