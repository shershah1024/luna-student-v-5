/**
 * Worksheet Image Generation API
 * Second stage of worksheet creation - generates visual worksheet using Azure DALL-E
 * based on formatted content from the content generation stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Initialize Supabase client  
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Azure DALL-E configuration
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const DALLE_DEPLOYMENT = 'gpt-image-1'; // DALL-E 3 deployment name
const API_VERSION = '2025-04-01-preview';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      task_id,
      dalle_prompt,
      size = '1024x1536', // Default to portrait for worksheets (Azure sizes: 1024x1024, 1024x1536, 1536x1024)
      quality = 'high', // High quality for text clarity (Azure values: low, medium, high, auto)
      style = 'natural', // Natural style for educational content
      regenerate = false
    } = body;

    // Validate required fields
    if (!task_id) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    console.log('[Worksheet Image] Starting generation for task:', task_id);

    // If no prompt provided, fetch from database
    let promptToUse = dalle_prompt;
    if (!promptToUse) {
      const { data: worksheet, error } = await supabase
        .from('worksheet_tasks')
        .select('dalle_prompt, content')
        .eq('task_id', task_id)
        .single();

      if (error || !worksheet) {
        console.error('[Worksheet Image] Failed to fetch worksheet:', error);
        return NextResponse.json(
          { error: 'Worksheet not found' },
          { status: 404 }
        );
      }

      promptToUse = worksheet.dalle_prompt;
    }

    if (!promptToUse) {
      return NextResponse.json(
        { error: 'No prompt available for image generation' },
        { status: 400 }
      );
    }

    // Update status to generating
    await supabase
      .from('worksheet_tasks')
      .update({ 
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('task_id', task_id);

    // Prepare DALL-E request
    const dalleUrl = `${AZURE_ENDPOINT}/openai/deployments/${DALLE_DEPLOYMENT}/images/generations?api-version=${API_VERSION}`;
    
    // Azure DALL-E specific parameters
    const dalleRequest = {
      prompt: promptToUse,
      size: size,
      quality: quality,
      n: 1
      // Azure returns b64_json by default
    };

    console.log('[Worksheet Image] Calling Azure DALL-E with:', {
      deployment: DALLE_DEPLOYMENT,
      size,
      quality,
      promptLength: promptToUse.length
    });

    // Call Azure DALL-E API
    const dalleResponse = await fetch(dalleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_API_KEY
      },
      body: JSON.stringify(dalleRequest)
    });

    if (!dalleResponse.ok) {
      const errorText = await dalleResponse.text();
      console.error('[Worksheet Image] DALL-E API error:', {
        status: dalleResponse.status,
        error: errorText
      });
      
      // Update worksheet with error status
      await supabase
        .from('worksheet_tasks')
        .update({
          status: 'error',
          last_error: `DALL-E generation failed: ${dalleResponse.status}`,
          error_count: 1, // Will increment manually if needed
          updated_at: new Date().toISOString()
        })
        .eq('task_id', task_id);

      return NextResponse.json(
        { 
          error: 'Image generation failed',
          details: errorText
        },
        { status: dalleResponse.status }
      );
    }

    const dalleResult = await dalleResponse.json();
    
    if (!dalleResult.data || !dalleResult.data[0] || !dalleResult.data[0].b64_json) {
      console.error('[Worksheet Image] Invalid DALL-E response:', dalleResult);
      throw new Error('Invalid response from DALL-E API');
    }

    const base64Image = dalleResult.data[0].b64_json;
    const previewUrl = `data:image/png;base64,${base64Image}`;

    // Update worksheet with preview image
    const updateData: any = {
      preview_image_url: previewUrl,
      status: 'preview',
      updated_at: new Date().toISOString()
    };

    // Note: Increment will be handled differently if needed

    const { error: updateError } = await supabase
      .from('worksheet_tasks')
      .update(updateData)
      .eq('task_id', task_id);

    if (updateError) {
      console.error('[Worksheet Image] Failed to update worksheet:', updateError);
    }

    console.log('[Worksheet Image] Generation successful for task:', task_id);

    return NextResponse.json({
      success: true,
      task_id,
      preview_url: previewUrl,
      image_size: size,
      message: 'Worksheet image generated successfully'
    });

  } catch (error) {
    console.error('[Worksheet Image] Unexpected error:', error);
    
    // Try to update error status in database
    if (req.body) {
      try {
        const { task_id } = await req.json();
        if (task_id) {
          await supabase
            .from('worksheet_tasks')
            .update({
              status: 'error',
              last_error: error instanceof Error ? error.message : 'Unknown error',
              error_count: 1, // Will increment manually if needed
              updated_at: new Date().toISOString()
            })
            .eq('task_id', task_id);
        }
      } catch {
        // Ignore errors in error handling
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate worksheet image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}