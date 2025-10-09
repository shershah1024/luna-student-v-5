/**
 * Real-time Streaming Transcription API using Azure OpenAI Whisper
 * Processes audio chunks as they arrive for ultra-low latency
 * Uses chunked transfer encoding for streaming response
 */
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Create a TransformStream for streaming response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Process the request asynchronously
  (async () => {
    try {
      // Azure OpenAI configuration
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const deploymentName = 'gpt-4o-transcribe';
      const apiVersion = '2025-03-01-preview';
      
      if (!endpoint || !apiKey) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Azure OpenAI not configured' })}\n\n`));
        await writer.close();
        return;
      }

      // Get the audio stream from the request
      const reader = request.body?.getReader();
      if (!reader) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'No body stream' })}\n\n`));
        await writer.close();
        return;
      }

      // Buffer to accumulate audio chunks
      const audioChunks: Uint8Array[] = [];
      let totalSize = 0;
      const MIN_CHUNK_SIZE = 16000; // Minimum bytes before processing (approx 0.5s of audio)
      let lastTranscript = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          audioChunks.push(value);
          totalSize += value.length;
        }
        
        // Process when we have enough data or when stream ends
        if ((totalSize >= MIN_CHUNK_SIZE || done) && audioChunks.length > 0) {
          // Combine chunks into a single buffer
          const audioBuffer = new Uint8Array(totalSize);
          let offset = 0;
          for (const chunk of audioChunks) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
          }
          
          // Create blob from buffer
          const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
          
          // Create form data for Azure OpenAI
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'gpt-4o-transcribe');
          formData.append('response_format', 'json');
          formData.append('prompt', lastTranscript); // Use previous transcript as context
          
          // Call Azure OpenAI Whisper API
          const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/audio/transcriptions?api-version=${apiVersion}`;
          
          try {
            const response = await fetch(azureUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
              },
              body: formData,
            });
            
            if (response.ok) {
              const data = await response.json();
              const transcript = data.text || '';
              
              // Only send if we have new content
              if (transcript && transcript !== lastTranscript) {
                // Send incremental update
                const increment = transcript.substring(lastTranscript.length);
                if (increment.trim()) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'transcript',
                    text: increment,
                    fullText: transcript
                  })}\n\n`));
                }
                lastTranscript = transcript;
              }
            }
          } catch (error) {
            console.error('[Realtime Transcription] Processing error:', error);
          }
          
          // Clear processed chunks
          audioChunks.length = 0;
          totalSize = 0;
        }
        
        if (done) {
          // Send final transcript
          if (lastTranscript) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              type: 'final',
              text: lastTranscript
            })}\n\n`));
          }
          break;
        }
      }
      
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      await writer.close();
      
    } catch (error) {
      console.error('[Realtime Transcription] Error:', error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ 
        error: 'Internal server error' 
      })}\n\n`));
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}