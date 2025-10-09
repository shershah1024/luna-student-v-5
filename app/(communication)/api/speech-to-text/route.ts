
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  console.log('[Speech-to-Text API] 🎤 Request received');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('[Speech-to-Text API] ❌ No audio file provided');
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Speech-to-Text API] 📄 Audio file details:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    // Prepare Azure OpenAI STT request
    const azureFormData = new FormData();
    azureFormData.append('file', audioFile);
    azureFormData.append('model', 'gpt-4o-transcribe');
    // Auto-detect language for better accuracy
    azureFormData.append('response_format', 'json');

    const azureUrl = `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4o-transcribe/audio/transcriptions?api-version=2025-03-01-preview`;
    
    console.log('[Speech-to-Text API] 🚀 Sending to Azure OpenAI STT...');
    const startTime = Date.now();

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AZURE_OPENAI_API_KEY}`,
      },
      body: azureFormData,
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Speech-to-Text API] ❌ Azure STT Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        processingTimeMs: processingTime
      });
      
      return new Response(
        JSON.stringify({
          error: 'Speech recognition failed',
          details: errorText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    console.log('[Speech-to-Text API] ✅ Transcription successful:', {
      transcription: result.text?.substring(0, 100) + '...',
      processingTimeMs: processingTime,
      language: result.language
    });

    return new Response(
      JSON.stringify({
        success: true,
        transcription: result.text,
        language: result.language,
        processingTimeMs: processingTime
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Speech-to-Text API] ❌ Fatal error:', {
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