import { NextResponse } from 'next/server';


export const dynamic = "force-dynamic";
// Simple in-memory storage for webhook events (for debugging)
// In production, you'd use a database or logging service
let webhookEvents: any[] = [];
const MAX_EVENTS = 50;

function logWebhookEvent(event: any) {
  webhookEvents.unshift({
    ...event,
    timestamp: new Date().toISOString()
  });
  
  // Keep only the last MAX_EVENTS
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents = webhookEvents.slice(0, MAX_EVENTS);
  }
}

export async function GET() {
  const envStatus = {
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN ? '✅ SET' : '❌ MISSING',
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID ? '✅ SET' : '❌ MISSING',
    VERIFY_TOKEN: process.env.VERIFY_TOKEN ? '✅ SET' : '❌ MISSING',
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY ? '✅ SET' : '❌ MISSING',
    CLOUDCONVERT_API_KEY: process.env.CLOUDCONVERT_API_KEY ? '✅ SET' : '❌ MISSING',
  };

  const phoneNumberId = process.env.PHONE_NUMBER_ID || 'NOT_SET';
  const webhookUrl = `https://your-domain.com/api/whatsapp/webhook`;
  
  return NextResponse.json({
    status: 'WhatsApp Integration Status',
    environment: envStatus,
    config: {
      phoneNumberId: phoneNumberId,
      webhookUrl: webhookUrl,
      verifyToken: 'maitrise (configured in .env.local)'
    },
    recentWebhookEvents: webhookEvents,
    instructions: {
      verification: 'If webhook verification failed, check the logs for error messages',
      testing: 'Send a message to your WhatsApp Business number to test the integration',
      logs: 'Check your server logs for detailed debugging information'
    }
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}