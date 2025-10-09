/**
 * Test endpoint for Azure OpenAI Realtime API
 * Tests the connection and credentials
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Azure configuration from environment
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = 'gpt-realtime';
    const apiVersion = '2024-10-01-preview';
    
    if (!endpoint || !apiKey) {
      return NextResponse.json({
        error: 'Azure OpenAI credentials not configured',
        endpoint: !!endpoint,
        apiKey: !!apiKey
      }, { status: 500 });
    }
    
    // Test connection to Azure OpenAI
    // Note: We can't establish WebSocket from server-side, but we can verify the endpoint
    const testUrl = `https://${endpoint}/openai/deployments/${deploymentName}?api-version=${apiVersion}`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
      },
    });
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      config: {
        endpoint: endpoint,
        deployment: deploymentName,
        apiVersion: apiVersion,
        realtimeUrl: `wss://${endpoint}/openai/realtime?api-version=${apiVersion}&deployment=${deploymentName}`
      },
      message: response.ok 
        ? 'Azure OpenAI credentials are valid. WebSocket URL is ready for client-side connection.'
        : `Azure OpenAI connection test failed: ${response.status} ${response.statusText}`
    });
    
  } catch (error) {
    console.error('[Test Azure Realtime] Error:', error);
    return NextResponse.json({
      error: 'Failed to test Azure OpenAI connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}