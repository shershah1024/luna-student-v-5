/**
 * Worksheet R2 Upload API
 * Uploads worksheet images to Cloudflare R2 for permanent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Convert base64 to buffer
function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_id } = body;

    // Validate required fields
    if (!task_id) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    console.log('[Worksheet R2 Upload] Starting upload for task:', task_id);

    // Fetch worksheet from database
    const { data: worksheet, error: fetchError } = await supabase
      .from('worksheet_tasks')
      .select('preview_image_url, worksheet_type, topic, grade_level')
      .eq('task_id', task_id)
      .single();

    if (fetchError || !worksheet) {
      console.error('[Worksheet R2 Upload] Failed to fetch worksheet:', fetchError);
      return NextResponse.json(
        { error: 'Worksheet not found' },
        { status: 404 }
      );
    }

    if (!worksheet.preview_image_url) {
      return NextResponse.json(
        { error: 'No preview image available to upload' },
        { status: 400 }
      );
    }

    // Generate filename for R2
    const timestamp = Date.now();
    const sanitizedTopic = worksheet.topic.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `worksheet_${worksheet.worksheet_type}_${sanitizedTopic}_${worksheet.grade_level}_${timestamp}.png`;
    const r2Key = `worksheets/${fileName}`;

    console.log('[Worksheet R2 Upload] Generated filename:', {
      fileName,
      r2Key
    });

    // Convert base64 image to buffer
    const imageBuffer = base64ToBuffer(worksheet.preview_image_url);
    
    // Create form data for R2 worker
    const formData = new FormData();
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    
    // Prepare metadata
    const metadata = {
      contentType: 'image/png',
      worksheet_type: worksheet.worksheet_type,
      topic: worksheet.topic,
      grade_level: worksheet.grade_level,
      task_id: task_id,
      uploaded_at: new Date().toISOString()
    };
    
    // Add form fields as expected by Python worker
    formData.append('file', imageBlob, fileName);
    formData.append('audioId', r2Key); // Using audioId field for compatibility
    formData.append('metadata', JSON.stringify(metadata));
    
    console.log('[Worksheet R2 Upload] Uploading to Python R2 worker:', {
      workerUrl: process.env.R2_WORKER_URL,
      fileName,
      imageSize: imageBuffer.byteLength,
      metadata
    });
    
    const uploadStartTime = Date.now();
    const workerResponse = await fetch(`${process.env.R2_WORKER_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    });
    const uploadTime = Date.now() - uploadStartTime;
    
    console.log('[Worksheet R2 Upload] Python R2 worker response:', {
      status: workerResponse.status,
      statusText: workerResponse.statusText,
      ok: workerResponse.ok,
      uploadTime: `${uploadTime}ms`
    });
    
    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error('[Worksheet R2 Upload] Python R2 worker upload failed:', {
        status: workerResponse.status,
        statusText: workerResponse.statusText,
        error: errorText
      });
      throw new Error(`Python R2 worker upload failed: ${workerResponse.status} ${errorText}`);
    }
    
    const workerResult = await workerResponse.json();
    console.log('[Worksheet R2 Upload] Python R2 worker upload result:', workerResult);
    
    // Get the public URL from the worker response
    const publicUrl = workerResult.publicUrl || workerResult.url || `${process.env.R2_PUBLIC_URL}/${workerResult.key || r2Key}`;
    
    // Update worksheet with published URL
    const { error: updateError } = await supabase
      .from('worksheet_tasks')
      .update({
        published_image_url: publicUrl,
        r2_key: r2Key,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('task_id', task_id);

    if (updateError) {
      console.error('[Worksheet R2 Upload] Failed to update worksheet:', updateError);
      throw updateError;
    }

    console.log('[Worksheet R2 Upload] Upload completed:', {
      publicUrl,
      uploadTime: `${uploadTime}ms`,
      success: true
    });

    return NextResponse.json({ 
      success: true,
      task_id,
      public_url: publicUrl,
      r2_key: r2Key,
      message: 'Worksheet uploaded successfully'
    });

  } catch (error) {
    console.error('[Worksheet R2 Upload] Upload error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}