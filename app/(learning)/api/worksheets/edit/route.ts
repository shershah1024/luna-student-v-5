/**
 * Worksheet Edit API
 * Allows teachers to edit existing worksheet images using Azure DALL-E's edit capability
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
const DALLE_DEPLOYMENT = 'gpt-image-1';
const API_VERSION = '2025-04-01-preview';

// Convert base64 to blob for multipart upload
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      task_id,
      edit_prompt,
      mask_image, // Optional: base64 mask image for specific area edits
      size = '1024x1024' // Azure edit endpoint only supports square images
    } = body;

    // Validate required fields
    if (!task_id || !edit_prompt) {
      return NextResponse.json(
        { error: 'task_id and edit_prompt are required' },
        { status: 400 }
      );
    }

    console.log('[Worksheet Edit] Starting edit for task:', task_id);

    // Fetch current worksheet image from database
    const { data: worksheet, error: fetchError } = await supabase
      .from('worksheet_tasks')
      .select('preview_image_url, published_image_url')
      .eq('task_id', task_id)
      .single();

    if (fetchError || !worksheet) {
      console.error('[Worksheet Edit] Failed to fetch worksheet:', fetchError);
      return NextResponse.json(
        { error: 'Worksheet not found' },
        { status: 404 }
      );
    }

    // Use preview image if available, otherwise use published image
    const currentImage = worksheet.preview_image_url || worksheet.published_image_url;
    
    if (!currentImage) {
      return NextResponse.json(
        { error: 'No existing image found for this worksheet' },
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

    // Prepare form data for DALL-E edit endpoint
    const formData = new FormData();
    
    // Convert base64 image to blob and add to form data
    const imageBlob = base64ToBlob(currentImage);
    formData.append('image', imageBlob, 'worksheet.png');
    
    // Add mask if provided
    if (mask_image) {
      const maskBlob = base64ToBlob(mask_image);
      formData.append('mask', maskBlob, 'mask.png');
    }
    
    // Add the edit prompt
    formData.append('prompt', edit_prompt);
    formData.append('size', size);
    formData.append('n', '1');
    // Azure returns b64_json by default, no need to specify

    // Prepare DALL-E edit request URL
    const dalleUrl = `${AZURE_ENDPOINT}/openai/deployments/${DALLE_DEPLOYMENT}/images/edits?api-version=${API_VERSION}`;

    console.log('[Worksheet Edit] Calling Azure DALL-E edit API with:', {
      deployment: DALLE_DEPLOYMENT,
      size,
      hasMAsk: !!mask_image,
      promptLength: edit_prompt.length
    });

    // Call Azure DALL-E Edit API
    const dalleResponse = await fetch(dalleUrl, {
      method: 'POST',
      headers: {
        'api-key': AZURE_API_KEY
      },
      body: formData
    });

    if (!dalleResponse.ok) {
      const errorText = await dalleResponse.text();
      console.error('[Worksheet Edit] DALL-E API error:', {
        status: dalleResponse.status,
        error: errorText
      });
      
      // Update worksheet with error status
      await supabase
        .from('worksheet_tasks')
        .update({
          status: 'error',
          last_error: `DALL-E edit failed: ${dalleResponse.status}`,
          error_count: 1, // Will increment manually if needed
          updated_at: new Date().toISOString()
        })
        .eq('task_id', task_id);

      return NextResponse.json(
        { 
          error: 'Image edit failed',
          details: errorText
        },
        { status: dalleResponse.status }
      );
    }

    const dalleResult = await dalleResponse.json();
    
    if (!dalleResult.data || !dalleResult.data[0] || !dalleResult.data[0].b64_json) {
      console.error('[Worksheet Edit] Invalid DALL-E response:', dalleResult);
      throw new Error('Invalid response from DALL-E API');
    }

    const base64Image = dalleResult.data[0].b64_json;
    const editedImageUrl = `data:image/png;base64,${base64Image}`;
    
    console.log('[Worksheet Edit] Generated edited image URL, length:', editedImageUrl.length);

    // Update worksheet with edited image
    const { error: updateError } = await supabase
      .from('worksheet_tasks')
      .update({
        preview_image_url: editedImageUrl,
        status: 'preview',
        times_edited: 1, // Will increment manually if needed
        updated_at: new Date().toISOString()
      })
      .eq('task_id', task_id);

    if (updateError) {
      console.error('[Worksheet Edit] Failed to update worksheet:', updateError);
    }

    console.log('[Worksheet Edit] Edit successful for task:', task_id);

    return NextResponse.json({
      success: true,
      task_id,
      edited_image_url: editedImageUrl,
      message: 'Worksheet edited successfully'
    });

  } catch (error) {
    console.error('[Worksheet Edit] Unexpected error:', error);
    
    // Try to update error status in database
    try {
      const body = await req.json();
      if (body.task_id) {
        await supabase
          .from('worksheet_tasks')
          .update({
            status: 'error',
            last_error: error instanceof Error ? error.message : 'Unknown error',
            error_count: 1, // Will increment manually if needed
            updated_at: new Date().toISOString()
          })
          .eq('task_id', body.task_id);
      }
    } catch {
      // Ignore errors in error handling
    }

    return NextResponse.json(
      { 
        error: 'Failed to edit worksheet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}