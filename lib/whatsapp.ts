
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export interface WhatsAppMessage {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
}

// Function to send text message
export async function sendWhatsAppMessage(to: string, message: string): Promise<WhatsAppMessage> {
  console.log('[WhatsApp Send] 📤 Preparing to send message:', {
    to: to,
    messageLength: message.length,
    preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
  });
  
  if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    console.error('[WhatsApp Send] ❌ Missing environment variables:', {
      PHONE_NUMBER_ID: PHONE_NUMBER_ID ? 'SET' : 'MISSING',
      WHATSAPP_TOKEN: WHATSAPP_TOKEN ? 'SET' : 'MISSING'
    });
    throw new Error('Missing required environment variables: WHATSAPP_TOKEN or PHONE_NUMBER_ID');
  }

  try {
    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };
    
    console.log('[WhatsApp Send] 🌐 API Request:', {
      url: url,
      phoneNumberId: PHONE_NUMBER_ID
    });
    
    const startTime = Date.now();
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json() as { error: { message: string; code?: number; type?: string } };
      console.error('[WhatsApp Send] ❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error,
        responseTimeMs: Date.now() - startTime
      });
      throw new Error(`Failed to send message: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as WhatsAppMessage;
    console.log('[WhatsApp Send] ✅ Message sent successfully:', {
      messageId: data.messages?.[0]?.id,
      recipientId: data.contacts?.[0]?.wa_id,
      responseTimeMs: Date.now() - startTime
    });
    
    return data;
  } catch (error) {
    console.error('[WhatsApp Send] ❌ Fatal error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      to: to
    });
    throw error;
  }
}

// Function to download media from WhatsApp
export async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer; mime_type: string }> {
  console.log('[WhatsApp Media] 📥 Starting media download:', { mediaId });
  
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('[WhatsApp Media] ❌ Missing environment variables:', {
      PHONE_NUMBER_ID: PHONE_NUMBER_ID ? 'SET' : 'MISSING',
      WHATSAPP_TOKEN: WHATSAPP_TOKEN ? 'SET' : 'MISSING'
    });
    throw new Error('Missing required environment variables: WHATSAPP_TOKEN or PHONE_NUMBER_ID');
  }

  try {
    // Step 1: Get the media URL
    const mediaUrlEndpoint = `${WHATSAPP_API_URL}/${mediaId}?phone_number_id=${PHONE_NUMBER_ID}`;
    console.log('[WhatsApp Media] 🔗 Step 1: Fetching media URL...');
    
    const urlFetchStart = Date.now();
    const mediaUrlResponse = await fetch(mediaUrlEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`
      }
    });

    if (!mediaUrlResponse.ok) {
      const error = await mediaUrlResponse.text();
      console.error('[WhatsApp Media] ❌ Failed to get media URL:', {
        status: mediaUrlResponse.status,
        statusText: mediaUrlResponse.statusText,
        error: error,
        responseTimeMs: Date.now() - urlFetchStart
      });
      throw new Error(`Failed to get media URL: ${error}`);
    }

    const mediaUrlData = await mediaUrlResponse.json();
    console.log('[WhatsApp Media] ✅ Media URL retrieved:', {
      hasUrl: !!mediaUrlData.url,
      mimeType: mediaUrlData.mime_type,
      urlFetchTimeMs: Date.now() - urlFetchStart
    });

    if (!mediaUrlData.url || !mediaUrlData.mime_type) {
      console.error('[WhatsApp Media] ❌ Invalid media data:', mediaUrlData);
      throw new Error('Missing required media data in response');
    }

    const { url, mime_type } = mediaUrlData;

    // Step 2: Download the actual media using the URL
    console.log('[WhatsApp Media] 📦 Step 2: Downloading media content...');
    
    const downloadStart = Date.now();
    const mediaResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`
      }
    });

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.error('[WhatsApp Media] ❌ Media download failed:', {
        status: mediaResponse.status,
        statusText: mediaResponse.statusText,
        body: errorText,
        downloadTimeMs: Date.now() - downloadStart
      });
      throw new Error(`Failed to download media: ${mediaResponse.status} ${mediaResponse.statusText}`);
    }

    // Step 3: Get the binary data
    const arrayBuffer = await mediaResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const totalTime = Date.now() - urlFetchStart;
    console.log('[WhatsApp Media] ✅ Media download complete:', {
      sizeBytes: buffer.length,
      sizeKB: Math.round(buffer.length / 1024),
      mimeType: mime_type,
      downloadTimeMs: Date.now() - downloadStart,
      totalTimeMs: totalTime
    });

    return {
      buffer,
      mime_type
    };
  } catch (error) {
    console.error('[WhatsApp Media] ❌ Fatal download error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      mediaId: mediaId
    });
    throw error;
  }
}

// Function to transcribe audio using Azure OpenAI STT
export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  console.log('[WhatsApp Transcription] 🎯 Starting audio transcription:', {
    bufferSize: buffer.length,
    mimeType: mimeType
  });
  
  try {
    // Check if Azure OpenAI API key is configured
    const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
    
    if (!AZURE_API_KEY) {
      console.warn('[WhatsApp Transcription] ⚠️ Azure OpenAI API key not configured');
      return 'Audio transcription not configured. Please send text messages for now.';
    }
    
    let audioBuffer = buffer;
    let finalMimeType = mimeType;
    let fileName = 'audio.ogg';
    
    // Handle OGG format - direct transcription without conversion
    if (mimeType.includes('ogg') || mimeType.includes('opus')) {
      console.log('[WhatsApp Transcription] 🔄 OGG/Opus format detected - attempting direct transcription...');
      finalMimeType = 'audio/ogg';
      fileName = 'audio.ogg';
    }
    
    // Create a File object from the (possibly converted) buffer
    const audioFile = new File([audioBuffer], fileName, { type: finalMimeType });
    
    // Create form data for the STT endpoint
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'gpt-4o-transcribe');
    formData.append('language', 'de');
    formData.append('response_format', 'json');
    
    console.log('[WhatsApp Transcription] 📋 FormData prepared:', {
      fileName: audioFile.name,
      fileType: audioFile.type,
      fileSize: audioFile.size
    });
    
    console.log('[WhatsApp Transcription] 🚀 Sending to Azure OpenAI STT...', {
      fileName: fileName,
      mimeType: finalMimeType,
      fileSize: audioBuffer.length
    });
    
    const startTime = Date.now();
    
    const response = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4o-transcribe/audio/transcriptions?api-version=2025-03-01-preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AZURE_API_KEY}`,
      },
      body: formData,
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp Transcription] ❌ STT API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        processingTimeMs: processingTime,
        audioFormat: finalMimeType
      });
      
      // If it's a format error and we tried OGG, let the user know
      if (finalMimeType === 'audio/ogg' && (
        errorText.includes('format') || 
        errorText.includes('unsupported') || 
        response.status === 400
      )) {
        return 'Entschuldigung, das Audioformat wird derzeit nicht unterstützt. Bitte senden Sie eine Textnachricht.';
      }
      
      return 'Entschuldigung, ich konnte Ihre Sprachnachricht nicht verstehen.';
    }
    
    const result = await response.json();
    
    console.log('[WhatsApp Transcription] ✅ Transcription successful:', {
      transcription: result.text?.substring(0, 100) + '...',
      language: result.language,
      processingTimeMs: processingTime
    });
    
    return result.text || 'Keine Transkription verfügbar.';
    
  } catch (error) {
    console.error('[WhatsApp Transcription] ❌ Transcription error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return 'Entschuldigung, ich hatte Probleme beim Verarbeiten Ihrer Sprachnachricht.';
  }
}

// Function to send audio message
export async function sendWhatsAppAudioMessage(to: string, audioUrl: string): Promise<WhatsAppMessage> {
  console.log('[WhatsApp Audio Send] 🔊 Preparing to send audio:', {
    to: to,
    audioUrl: audioUrl?.substring(0, 50) + '...'
  });
  
  if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    console.error('[WhatsApp Audio Send] ❌ Missing environment variables');
    throw new Error('Missing required environment variables: WHATSAPP_TOKEN or PHONE_NUMBER_ID');
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'audio',
          audio: {
            link: audioUrl
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json() as { error: { message: string } };
      console.error('[WhatsApp Audio Send] ❌ API Error:', {
        status: response.status,
        error: errorData.error
      });
      throw new Error('Failed to send audio message');
    }

    const data = await response.json() as WhatsAppMessage;
    console.log('[WhatsApp Audio Send] ✅ Audio sent successfully:', {
      messageId: data.messages?.[0]?.id,
      recipientId: data.contacts?.[0]?.wa_id
    });
    
    return data;
  } catch (error) {
    console.error('[WhatsApp Audio Send] ❌ Fatal error:', {
      error: error instanceof Error ? error.message : error,
      to: to
    });
    throw error;
  }
}