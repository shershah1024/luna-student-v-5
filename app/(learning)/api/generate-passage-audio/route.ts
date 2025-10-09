import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

/**
 * API route for generating audio for reading passages
 * Creates TTS audio for entire reading texts and stores them for reuse
 * Uses Azure OpenAI TTS with German voice for language learning
 */
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

    const { taskId, language = 'german' } = await request.json();
    
    if (!taskId) {
      console.error('[generate-passage-audio] Missing required parameter: taskId');
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if we already have audio for this passage in the database
    const { data: existingText, error: fetchError } = await supabase
      .from('reading_exercises')
      .select('audio_url, reading_text, text_title')
      .eq('task_id', taskId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found' error
      console.error('[generate-passage-audio] Error fetching from database:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch reading text' },
        { status: 500 }
      );
    }

    if (!existingText) {
      console.error('[generate-passage-audio] No reading text found for task_id:', taskId);
      return NextResponse.json(
        { error: 'Reading text not found' },
        { status: 404 }
      );
    }

    // If we already have audio URL, return it
    if (existingText.audio_url) {
      // Validate the URL is still accessible (basic check)
      let audioUrl;
      if (existingText.audio_url.startsWith('http')) {
        audioUrl = existingText.audio_url;
      } else {
        // Old format - construct R2 URL
        audioUrl = `https://examaudio.tslfiles.org/${existingText.audio_url}`;
        
        // Update the database with the full URL for future use
        const { error: updateError } = await supabase
          .from('reading_exercises')
          .update({ audio_url: audioUrl })
          .eq('task_id', taskId);
          
        if (updateError) {
          console.warn('[generate-passage-audio] Could not update database with full URL:', updateError);
        }
      }
      
      return NextResponse.json({ audioUrl });
    }

    // If we get here, we need to generate new audio for the passage
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!azureApiKey) {
      console.error('[generate-passage-audio] Azure OpenAI API key not configured');
      return NextResponse.json(
        { error: 'TTS service not configured' },
        { status: 500 }
      );
    }

    // Prepare the content for TTS - use the reading passage content
    const passageContent = existingText.reading_text;
    if (!passageContent) {
      console.error('[generate-passage-audio] No content found for task_id:', taskId);
      return NextResponse.json(
        { error: 'No content available for audio generation' },
        { status: 400 }
      );
    }

    // Instructions for natural reading of German text
    const instructionsText = `Read this German text clearly and naturally, with appropriate pacing for language learners. Use proper pronunciation and intonation.`;
    
    console.log('[generate-passage-audio] Generating audio for task:', {
      taskId,
      contentLength: passageContent.length,
      title: existingText.text_title
    });

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
          input: passageContent,
          voice: "alloy",
          instructions: instructionsText
        })
      }
    );
    
    const responseTime = Date.now() - startTime;
    console.log('[generate-passage-audio] TTS API response time:', `${responseTime}ms`);

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('[generate-passage-audio] OpenAI TTS API error:', {
        status: audioResponse.status,
        statusText: audioResponse.statusText,
        error: errorText
      });
      return NextResponse.json(
        { error: `Failed to generate speech: ${audioResponse.status}` },
        { status: 500 }
      );
    }

    // Get the audio data
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Create a unique file path for storage (OpenAI TTS returns MP3)
    const sanitizedTaskId = taskId.replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = `passage_${sanitizedTaskId}_${Date.now()}.mp3`;
    
    // Upload the audio to Cloudflare R2 via worker
    const uploadStartTime = Date.now();
    
    try {
      // Upload to R2 via Python Worker
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
      
      // Generate audio ID
      const audioId = `passage_${taskId}_${Date.now()}`;
      
      // Prepare metadata
      const metadata = {
        contentType: 'audio/mp3',
        generated_at: new Date().toISOString(),
        task_id: taskId,
        original_filename: filePath,
        type: 'reading_passage',
        language,
        title: existingText.text_title
      };
      
      // Add form fields as expected by Python worker
      formData.append('file', audioBlob, filePath);
      formData.append('audioId', audioId);
      formData.append('metadata', JSON.stringify(metadata));
      
      console.log('[generate-passage-audio] Uploading to R2:', {
        audioId,
        filePath,
        audioBufferSize: audioBuffer.byteLength
      });
      
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
        console.error('[generate-passage-audio] R2 worker upload failed:', {
          status: workerResponse.status,
          statusText: workerResponse.statusText,
          error: errorText
        });
        throw new Error(`R2 worker upload failed: ${workerResponse.status} ${errorText}`);
      }
      
      const workerResult = await workerResponse.json();
      
      // Get the public URL from the worker response
      const publicUrl = workerResult.publicUrl || workerResult.url || `${process.env.R2_PUBLIC_URL}/${workerResult.key || filePath}`;
      
      const uploadTime = Date.now() - uploadStartTime;
      console.log('[generate-passage-audio] Upload completed:', {
        publicUrl,
        uploadTime: `${uploadTime}ms`,
        workerUploadTime: `${workerUploadTime}ms`
      });
      
      // Update the database with the audio URL
      const dbStartTime = Date.now();
      const { error: updateError, data: updateData } = await supabase
        .from('reading_exercises')
        .update({
          audio_url: publicUrl
        })
        .eq('task_id', taskId)
        .select();
      
      const dbTime = Date.now() - dbStartTime;

      if (updateError) {
        console.error('[generate-passage-audio] Database update error:', {
          error: updateError,
          taskId,
          publicUrl,
          dbTime: `${dbTime}ms`
        });
        // If database update fails, still return the R2 URL
      } else {
        console.log('[generate-passage-audio] Database updated successfully:', {
          taskId,
          publicUrl,
          dbTime: `${dbTime}ms`
        });
      }
      
      return NextResponse.json({ audioUrl: publicUrl });
      
    } catch (uploadError) {
      const uploadTime = Date.now() - uploadStartTime;
      console.error('[generate-passage-audio] R2 upload process failed:', {
        error: uploadError instanceof Error ? uploadError.message : uploadError,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        filePath,
        uploadTime: `${uploadTime}ms`,
        audioBufferSize: audioBuffer.byteLength
      });
      
      // If R2 upload fails, fall back to base64 data URL (not ideal for large passages)
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      
      console.warn('[generate-passage-audio] Falling back to base64 data URL due to upload failure');
      return NextResponse.json({ 
        audioUrl,
        warning: 'Using temporary audio URL due to upload failure'
      });
    }

  } catch (error) {
    console.error('[generate-passage-audio] Error generating passage audio:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate audio' },
      { status: 500 }
    );
  }
}