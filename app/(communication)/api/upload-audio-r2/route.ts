import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const customFileName = formData.get('fileName') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('[upload-audio-r2] Processing audio upload:', {
      fileName: customFileName || audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      userId
    });

    // Generate filename
    const fileName = customFileName || `user_audio_${Date.now()}.wav`;
    
    // Get audio buffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    console.log('[upload-audio-r2] Starting R2 upload:', {
      fileName,
      bufferSize: audioBuffer.byteLength
    });

    // Upload to R2 via Python Worker (matching the expected format)
    const uploadFormData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
    
    // Generate audio ID (matching Python worker format)  
    const audioId = `user_${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`;
    
    // Prepare metadata (matching Python worker format)
    const metadata = {
      contentType: audioFile.type,
      generated_at: new Date().toISOString(),
      test_id: '',
      original_filename: fileName,
      uploaded_by: userId
    };
    
    // Add form fields as expected by Python worker
    uploadFormData.append('file', audioBlob, fileName);
    uploadFormData.append('audioId', audioId);
    uploadFormData.append('metadata', JSON.stringify(metadata));
    
    console.log('[upload-audio-r2] Uploading to Python R2 worker:', {
      workerUrl: process.env.R2_WORKER_URL,
      uploadEndpoint: `${process.env.R2_WORKER_URL}/upload`,
      fileName,
      audioId,
      blobSize: audioBlob.size,
      metadata
    });
    
    const uploadStartTime = Date.now();
    const workerResponse = await fetch(`${process.env.R2_WORKER_URL}/upload`, {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    });
    const uploadTime = Date.now() - uploadStartTime;
    
    console.log('[upload-audio-r2] Python R2 worker response:', {
      status: workerResponse.status,
      statusText: workerResponse.statusText,
      ok: workerResponse.ok,
      uploadTime: `${uploadTime}ms`
    });
    
    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      console.error('[upload-audio-r2] Python R2 worker upload failed:', {
        status: workerResponse.status,
        statusText: workerResponse.statusText,
        error: errorText
      });
      throw new Error(`Python R2 worker upload failed: ${workerResponse.status} ${errorText}`);
    }
    
    const workerResult = await workerResponse.json();
    console.log('[upload-audio-r2] Python R2 worker upload result:', workerResult);
    
    // Get the public URL from the worker response
    const publicUrl = workerResult.publicUrl || workerResult.url || `${process.env.R2_PUBLIC_URL}/${workerResult.key || fileName}`;
    
    console.log('[upload-audio-r2] Upload completed:', {
      publicUrl,
      uploadTime: `${uploadTime}ms`,
      success: true
    });

    return NextResponse.json({ 
      success: true,
      audioUrl: publicUrl 
    });

  } catch (error) {
    console.error('[upload-audio-r2] Upload error:', {
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