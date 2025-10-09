/**
 * OpenAI Realtime API WebSocket Relay Server
 * Proxies WebSocket connections between the client and OpenAI's Realtime API
 * Handles authentication and manages the connection lifecycle
 */
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// WebSocket relay configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REALTIME_API_URL = 'wss://api.openai.com/v1/realtime';

/**
 * GET /api/realtime
 * Establishes WebSocket connection to OpenAI Realtime API
 */
export async function GET(request: NextRequest) {
  // Check for API key
  if (!OPENAI_API_KEY) {
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  // Get model from query params (default to gpt-4o-realtime-preview)
  const searchParams = request.nextUrl.searchParams;
  const model = searchParams.get('model') || 'gpt-4o-realtime-preview-2024-12-17';

  // Create the WebSocket URL with model parameter
  const url = `${REALTIME_API_URL}?model=${model}`;

  // Create headers for OpenAI authentication
  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'OpenAI-Beta': 'realtime=v1',
  };

  // Log connection attempt (remove in production)
  console.log('[Realtime API] Connecting to OpenAI:', {
    model,
    timestamp: new Date().toISOString()
  });

  // Return WebSocket upgrade response
  // Note: In production Next.js, you'll need to use a separate WebSocket server
  // This is a simplified example for development
  return new Response('WebSocket relay endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'X-Relay-URL': url,
      'X-Relay-Headers': JSON.stringify(headers)
    }
  });
}

/**
 * POST /api/realtime
 * Alternative endpoint for session initialization
 */
export async function POST(request: NextRequest) {
  try {
    const { model = 'gpt-4o-realtime-preview-2024-12-17' } = await request.json();

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return connection details for client-side WebSocket
    return new Response(JSON.stringify({
      url: REALTIME_API_URL,
      model,
      // Note: Never send the API key to the client in production
      // Instead, use a proxy server or edge function
      headers: {
        'OpenAI-Beta': 'realtime=v1',
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Realtime API] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to initialize session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}