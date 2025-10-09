/**
 * Azure OpenAI Chat Completion API
 * Handles LLM interactions for the speaking pipeline
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, temperature = 0.7, max_tokens = 150 } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }
    
    // Azure OpenAI configuration
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1'; // Use existing GPT-4.1 deployment
    const apiVersion = '2024-10-01-preview';
    
    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }
    
    // Call Azure OpenAI Chat Completion
    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
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
        stream: false,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Chat Completion] Azure error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get AI response', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ content });
    
  } catch (error) {
    console.error('[Chat Completion] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}