import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';


export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  console.log('[WhatsApp Send API] 📨 Manual send request received');
  
  try {
    const { to, message } = await request.json();

    console.log('[WhatsApp Send API] 📋 Request data:', {
      to: to || 'MISSING',
      messageLength: message?.length || 0,
      preview: message ? message.substring(0, 50) + (message.length > 50 ? '...' : '') : 'MISSING'
    });

    if (!to || !message) {
      console.error('[WhatsApp Send API] ❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    console.log('[WhatsApp Send API] 🚀 Calling sendWhatsAppMessage...');
    const result = await sendWhatsAppMessage(to, message);
    
    console.log('[WhatsApp Send API] ✅ Message sent successfully:', {
      messageId: result.messages?.[0]?.id,
      recipientId: result.contacts?.[0]?.wa_id
    });
    
    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      data: result
    });
  } catch (error) {
    console.error('[WhatsApp Send API] ❌ Error sending message:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}