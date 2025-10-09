/**
 * Streaming Chat Completion API using Azure OpenAI
 * Uses Server-Sent Events (SSE) for real-time streaming
 */
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, temperature = 0.7, max_tokens = 150 } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Azure OpenAI configuration
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1';
    const apiVersion = '2024-10-01-preview';
    
    if (!endpoint || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Azure OpenAI not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Call Azure OpenAI Chat Completion with streaming
    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    console.log('[Streaming Chat] Starting stream...');
    
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens,
        stream: true, // Enable streaming
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Streaming Chat] Azure error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response', details: errorText }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a TransformStream to handle SSE formatting
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Send final message
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }
            
            // Parse SSE chunks
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    // Send content as SSE
                    const sseMessage = `data: ${JSON.stringify({ content })}\n\n`;
                    controller.enqueue(encoder.encode(sseMessage));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('[Streaming Chat] Stream error:', error);
          controller.error(error);
        }
      },
    });
    
    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('[Streaming Chat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}