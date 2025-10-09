import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';


export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    // Check if this is a WhatsApp request (bypass auth for WhatsApp)
    const userAgent = request.headers.get('user-agent') || '';
    const isWhatsAppRequest = request.headers.get('x-whatsapp-request') === 'true' || 
                             userAgent.includes('whatsapp') ||
                             request.headers.get('referer')?.includes('whatsapp');
    
    // Verify user is authenticated (skip for WhatsApp)
    if (!isWhatsAppRequest) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    const { word, language } = await request.json();
    
    
    if (!word || !language) {
      console.error('[generate-word-audio] Missing required parameters:', { word, language });
      return NextResponse.json(
        { error: 'Word and language are required' },
        { status: 400 }
      );
    }

    // Convert word to lowercase for consistent storage and retrieval
    const normalizedWord = word.toLowerCase();

    // Check if we already have this word in the database
    const { data: existingAudio, error: fetchError } = await supabase
      .from('pronunciation_audio')
      .select('file_path')
      .eq('word', normalizedWord)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found' error
      console.error('[generate-word-audio] Error fetching from database:', fetchError);
    }

    // If we found the audio in the database, return the stored URL
    if (existingAudio) {
      
      // Check if it's a full URL or just a filename
      let audioUrl;
      if (existingAudio.file_path.startsWith('http')) {
        // Already a full URL (new format)
        audioUrl = existingAudio.file_path;
      } else {
        // Old format - just filename, construct R2 URL
        audioUrl = `https://examaudio.tslfiles.org/${existingAudio.file_path}`;
        
        // Update the database with the full URL for future use
        const { error: updateError } = await supabase
          .from('pronunciation_audio')
          .update({ file_path: audioUrl })
          .eq('word', normalizedWord);
          
        if (updateError) {
          console.warn('[generate-word-audio] Could not update database with full URL:', updateError);
        }
      }
      
      return NextResponse.json({ audioUrl });
    }

    // If we get here, we need to generate a new audio file
    
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!azureApiKey) {
      console.error('[generate-word-audio] Azure OpenAI API key not configured');
      throw new Error('Azure OpenAI API key not configured');
    }

    // Prepare the input - just the word for clean pronunciation
    const pronunciationInput = normalizedWord;
    const instructionsText = `Pronounce this German word clearly and naturally.`;
    

    // Call OpenAI GPT-4o-mini-TTS API
    const startTime = Date.now();
    const audioResponse = await fetch(
      "https://shino-m9qsrnbv-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview",
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${azureApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          input: pronunciationInput,
          voice: "alloy",
          instructions: instructionsText
        })
      }
    );
    
    const responseTime = Date.now() - startTime;

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('[generate-word-audio] OpenAI TTS API error:', {
        status: audioResponse.status,
        statusText: audioResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to generate speech: ${audioResponse.status} ${errorText}`);
    }

    // Get the audio data
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Sanitize the word for use in file names (remove/replace special characters)
    const sanitizedWord = normalizedWord
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-zA-Z0-9]/g, '_'); // Replace any remaining special chars with underscore
    
    // Create a unique file path for storage (OpenAI TTS returns MP3)
    const filePath = `${sanitizedWord}_${Date.now()}.mp3`;
    
    // Upload the audio to Cloudflare R2 via worker
    const uploadStartTime = Date.now();
    
    try {
      // Upload to R2 via Python Worker (matching the expected format)
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
      
      // Generate audio ID (matching Python worker format)
      const audioId = `${normalizedWord}_${Date.now()}`;
      
      // Prepare metadata (matching Python worker format)
      const metadata = {
        contentType: 'audio/mp3',
        generated_at: new Date().toISOString(),
        test_id: '',
        original_filename: filePath,
        word: normalizedWord,
        language
      };
      
      // Add form fields as expected by Python worker
      formData.append('file', audioBlob, filePath);
      formData.append('audioId', audioId);
      formData.append('metadata', JSON.stringify(metadata));
      
      
      const workerUploadStartTime = Date.now();
      const workerResponse = await fetch(`${process.env.R2_WORKER_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        }
      });
      const workerUploadTime = Date.now() - workerUploadStartTime;
      
      
      if (!workerResponse.ok) {
        const errorText = await workerResponse.text();
        console.error('[generate-word-audio] Python R2 worker upload failed:', {
          status: workerResponse.status,
          statusText: workerResponse.statusText,
          error: errorText
        });
        throw new Error(`Python R2 worker upload failed: ${workerResponse.status} ${errorText}`);
      }
      
      const workerResult = await workerResponse.json();
      
      // Get the public URL from the worker response
      const publicUrl = workerResult.publicUrl || workerResult.url || `${process.env.R2_PUBLIC_URL}/${workerResult.key || filePath}`;
      
      const uploadTime = Date.now() - uploadStartTime;
      // Save the metadata to the database using upsert to handle duplicates
      
      const dbStartTime = Date.now();
      const { error: upsertError, data: upsertData } = await supabase
        .from('pronunciation_audio')
        .upsert({
          word: normalizedWord,
          file_path: publicUrl  // Store the full R2 URL instead of just file path
        }, {
          onConflict: 'word'
        })
        .select();
      
      const dbTime = Date.now() - dbStartTime;

      if (upsertError) {
        console.error('[generate-word-audio] Database upsert error:', {
          error: upsertError,
          word: normalizedWord,
          publicUrl,
          dbTime: `${dbTime}ms`
        });
        // If database upsert fails, still return the R2 URL
      } else {
      }
      
      return NextResponse.json({ audioUrl: publicUrl });
      
    } catch (uploadError) {
      const uploadTime = Date.now() - uploadStartTime;
      console.error('[generate-word-audio] R2 worker upload process failed:', {
        error: uploadError instanceof Error ? uploadError.message : uploadError,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        filePath,
        uploadTime: `${uploadTime}ms`,
        audioBufferSize: audioBuffer.byteLength
      });
      
      // If R2 upload fails, fall back to base64 data URL
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      return NextResponse.json({ audioUrl });
    }
  } catch (error) {
    console.error('[generate-word-audio] Error generating word audio:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate audio' },
      { status: 500 }
    );
  }
}

