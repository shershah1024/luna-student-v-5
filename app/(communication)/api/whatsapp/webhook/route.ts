import type { NextRequest } from 'next/server';
import { sendWhatsAppMessage, downloadWhatsAppMedia, transcribeAudio } from '@/lib/whatsapp';
import { 
  generateWhatsAppAIResponse, 
  detectPronunciationRequest, 
  generateWordAudio,
  detectGrammarRequest,
  checkGrammar,
  getConversationHistoryFromDatabase,
  explainGrammar
} from '@/lib/whatsapp-ai-response';
// Removed // logWebhookEvent import - not needed for build


export const dynamic = "force-dynamic";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

interface WebhookBody {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        messaging_product?: string;
        metadata?: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          audio?: {
            id: string;
            mime_type: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
            caption?: string;
          };
          video?: {
            id: string;
            mime_type: string;
            sha256: string;
            caption?: string;
          };
          document?: {
            id: string;
            mime_type: string;
            sha256: string;
            filename: string;
            caption?: string;
          };
        }>;
        contacts?: Array<{
          profile: {
            name: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  console.log('[WhatsApp Webhook] GET request received');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[WhatsApp Webhook] Verification params:', {
      mode,
      token: token ? 'PROVIDED' : 'MISSING',
      challenge: challenge ? 'PROVIDED' : 'MISSING',
      expectedToken: VERIFY_TOKEN ? 'SET' : 'NOT SET'
    });

    // Log verification attempt - removed for build

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WhatsApp Webhook] ✅ Webhook verified successfully');
        return new Response(challenge);
      }
      console.error('[WhatsApp Webhook] ❌ Invalid verification token');
      return new Response('Forbidden', { status: 403 });
    }
    console.error('[WhatsApp Webhook] ❌ Missing mode or token');
    return new Response('Bad Request', { status: 400 });
  } catch (error) {
    console.error('[WhatsApp Webhook] ❌ Error in webhook verification:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // IMPORTANT: This webhook ALWAYS returns 200 OK to prevent WhatsApp from retrying
  // Even on errors, we return 200 to avoid duplicate message processing
  // Actual errors are logged but don't affect the HTTP response
  
  console.log('[WhatsApp Webhook] POST request received');
  console.log('[WhatsApp Webhook] Headers:', {
    'content-type': request.headers.get('content-type'),
    'x-hub-signature': request.headers.get('x-hub-signature') ? 'PROVIDED' : 'MISSING'
  });
  
  try {
    const body = await request.json() as WebhookBody;
    console.log('[WhatsApp Webhook] Parsed body:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry[0];
      const change = entry.changes[0].value;
      
      // Security: Validate phone_number_id matches our configured one
      const webhookPhoneNumberId = change.metadata?.phone_number_id;
      
      if (!webhookPhoneNumberId) {
        console.warn('[WhatsApp Security] ⚠️ Webhook missing phone_number_id in metadata');
        // Return 200 OK to prevent WhatsApp retries, but don't process the message
        return new Response('OK', { status: 200 });
      }
      
      if (webhookPhoneNumberId !== PHONE_NUMBER_ID) {
        console.error('[WhatsApp Security] ❌ Unauthorized webhook attempt:', {
          webhookPhoneNumberId,
          expectedPhoneNumberId: PHONE_NUMBER_ID ? 'SET' : 'NOT_SET',
          displayPhoneNumber: change.metadata?.display_phone_number
        });
        
        
        // Return 200 OK to prevent WhatsApp retries, but don't process the message
        return new Response('OK', { status: 200 });
      }
      
      console.log('[WhatsApp Security] ✅ Phone number validation passed:', {
        phoneNumberId: webhookPhoneNumberId,
        displayPhoneNumber: change.metadata?.display_phone_number
      });

      if (change.messages && change.messages[0]) {
        const message = change.messages[0];
        const from = message.from;
        const contact = change.contacts?.[0]?.profile;

        try {
          const contactName = contact?.name || `WhatsApp User (${from})`;
          console.log('[WhatsApp Message] 📱 New message received:', {
            messageId: message.id,
            type: message.type,
            from: from,
            contactName: contactName,
            timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
          });
          
          // Log incoming message

          switch (message.type) {
            case 'text': {
              if (message.text?.body) {
                const userMessage = message.text.body;
                console.log('[WhatsApp Text] 💬 Message content:', userMessage);
                console.log('[WhatsApp Text] Message length:', userMessage.length);

                // Check for commands first (following Albert's pattern)
                const commands = ['/pronounce', '/explain', '/clear_logs'];
                const hasCommand = commands.some(cmd => userMessage.toLowerCase().includes(cmd));
                
                if (hasCommand) {
                  console.log('[WhatsApp Commands] 🤖 Processing command:', userMessage);
                  
                  // Handle /pronounce command
                  if (userMessage.toLowerCase().includes('/pronounce')) {
                    let word = userMessage.replace(/\/pronounce/gi, '').trim();
                    if (!word) {
                      await sendWhatsAppMessage(from, 'Bitte geben Sie ein Wort nach dem /pronounce Befehl ein. Zum Beispiel: /pronounce Hallo', webhookPhoneNumberId);
                      return new Response('OK', { status: 200 });
                    }
                    
                    console.log('[WhatsApp Pronounce] 🎵 Generating audio for:', word);
                    const audioResult = await generateWordAudio(word);
                    
                    if (audioResult?.audioUrl) {
                      // Send audio via WhatsApp (this would require additional implementation)
                      // For now, send a text response with explanation
                      const responseText = `🎵 Aussprache für "${word}": 
Die Audiodatei wurde generiert${audioResult.cached ? ' (aus Cache)' : ''}. 
Möchten Sie ein anderes Wort hören? Verwenden Sie: /pronounce [Wort]`;
                      
                      await sendWhatsAppMessage(from, responseText, webhookPhoneNumberId);
                    } else {
                      // Provide helpful suggestion for common typos
                      let suggestion = '';
                      if (word.toLowerCase().includes('aug wiedersehen')) {
                        suggestion = '\n\nMeinten Sie "Auf Wiedersehen"? Versuchen Sie: /pronounce Auf Wiedersehen';
                      }
                      await sendWhatsAppMessage(from, `Entschuldigung, ich konnte keine Audio für "${word}" generieren. Versuchen Sie ein anderes Wort.${suggestion}`, webhookPhoneNumberId);
                    }
                    return new Response('OK', { status: 200 });
                  }
                  
                  // Handle /explain command (like Albert)
                  if (userMessage.toLowerCase().includes('/explain')) {
                    console.log('[WhatsApp Explain] 📚 Explaining last grammar error');
                    
                    // Get the last user message from conversation history for explanation
                    const conversationHistory = await getConversationHistoryFromDatabase(from);
                    const lastUserMessage = conversationHistory
                      .filter(msg => msg.role === 'user')
                      .pop()?.content;
                    
                    if (!lastUserMessage) {
                      await sendWhatsAppMessage(from, 'Ich kann keine vorherige Nachricht finden, die ich erklären könnte.', webhookPhoneNumberId);
                      return new Response('OK', { status: 200 });
                    }
                    
                    // Use dedicated explanation endpoint
                    const explanationResult = await explainGrammar(lastUserMessage, undefined, 'A1');
                    
                    if (explanationResult?.explanation) {
                      await sendWhatsAppMessage(from, explanationResult.explanation, webhookPhoneNumberId);
                    } else {
                      await sendWhatsAppMessage(from, 'Ihr letzter Text war grammatisch korrekt! 👍', webhookPhoneNumberId);
                    }
                    return new Response('OK', { status: 200 });
                  }
                  
                  // Handle /clear_logs command
                  if (userMessage.toLowerCase().includes('/clear_logs')) {
                    // This would clear conversation history - implement if needed
                    await sendWhatsAppMessage(from, 'Gesprächsverlauf wurde zurückgesetzt! 🔄', webhookPhoneNumberId);
                    return new Response('OK', { status: 200 });
                  }
                }
                
                // Check for natural language requests (pronunciation and grammar)
                const pronunciationWord = detectPronunciationRequest(userMessage);
                if (pronunciationWord) {
                  console.log('[WhatsApp Natural Pronounce] 🎵 Detected pronunciation request for:', pronunciationWord);
                  const audioResult = await generateWordAudio(pronunciationWord);
                  
                  if (audioResult?.audioUrl) {
                    const responseText = `🎵 So spricht man "${pronunciationWord}" aus:
${audioResult.cached ? 'Gespeicherte' : 'Neue'} Audiodatei wurde geladen.

Für mehr Wörter verwenden Sie: /pronounce [Wort]`;
                    
                    await sendWhatsAppMessage(from, responseText, webhookPhoneNumberId);
                  } else {
                    // Provide helpful suggestion for common typos
                    let suggestion = '';
                    if (pronunciationWord.toLowerCase().includes('aug wiedersehen')) {
                      suggestion = '\n\nMeinten Sie "Auf Wiedersehen"? Versuchen Sie: /pronounce Auf Wiedersehen';
                    }
                    await sendWhatsAppMessage(from, `Entschuldigung, ich konnte keine Audio für "${pronunciationWord}" generieren.${suggestion}`, webhookPhoneNumberId);
                  }
                  return new Response('OK', { status: 200 });
                }
                

                // Normal conversation flow - Generate AI tutor response (following Albert's pattern)
                console.log('[AI Integration] 🤖 Generating AI response...');
                const startTime = Date.now();
                
                try {
                  // First, automatically check grammar (like Albert does)
                  console.log('[WhatsApp Grammar Auto] 📝 Automatically checking grammar...');
                  const grammarResult = await checkGrammar(userMessage, 'A1');
                  
                  // Use enhanced API with level detection and conversation history
                  const responseData = await generateWhatsAppAIResponse(userMessage, from);
                  const processingTime = Date.now() - startTime;
                  
                  console.log('[AI Integration] ✅ AI response generated:', {
                    success: responseData.success,
                    responseLength: responseData.message?.length,
                    processingTimeMs: processingTime,
                    level: responseData.level,
                    usage: responseData.usage,
                    hasGrammarCorrection: grammarResult?.hasCorrection
                  });
                  
                  // Send the AI response back via WhatsApp
                  if (responseData.success && responseData.message) {
                    let finalMessage = responseData.message;
                    
                    // If there's a grammar correction, append it with /explain (like Albert)
                    if (grammarResult?.hasCorrection && grammarResult.feedback && grammarResult.feedback !== "Perfect! 👍") {
                      finalMessage = grammarResult.feedback + "\n\n" + responseData.message + "\n\n/explain";
                      console.log('[WhatsApp Grammar Auto] ✅ Added automatic grammar correction with /explain');
                    }
                    
                    console.log('[WhatsApp Send] 📤 Sending AI response to user...');
                    await sendWhatsAppMessage(from, finalMessage, webhookPhoneNumberId);
                    console.log('[WhatsApp Send] ✅ Response sent successfully');
                    
                    // Log successful interaction
                  } else {
                    console.error('[AI Integration] ❌ AI response generation failed:', responseData.error);
                    await sendWhatsAppMessage(from, 'Entschuldigung, ich hatte Probleme beim Verstehen Ihrer Nachricht. Können Sie es noch einmal versuchen?', webhookPhoneNumberId);
                  }
                } catch (aiError) {
                  console.error('[AI Integration] ❌ AI generation error:', {
                    error: aiError instanceof Error ? aiError.message : aiError,
                    stack: aiError instanceof Error ? aiError.stack : undefined,
                    processingTimeMs: Date.now() - startTime
                  });
                  await sendWhatsAppMessage(from, 'Entschuldigung, ich bin momentan nicht verfügbar. Bitte versuchen Sie es später noch einmal.', webhookPhoneNumberId);
                }
              }
              break;
            }

            case 'audio': {
              const mediaInfo = message.audio!;
              console.log('[WhatsApp Audio] 🎤 Audio message received:', {
                mediaId: mediaInfo.id,
                mimeType: mediaInfo.mime_type
              });

              try {
                // Download and transcribe audio
                console.log('[WhatsApp Audio] ⬇️ Downloading audio file...');
                const downloadStart = Date.now();
                const { buffer, mime_type } = await downloadWhatsAppMedia(mediaInfo.id);
                console.log('[WhatsApp Audio] ✅ Audio downloaded:', {
                  sizeBytes: buffer.length,
                  sizeKB: Math.round(buffer.length / 1024),
                  mimeType: mime_type,
                  downloadTimeMs: Date.now() - downloadStart
                });

                // Transcribe the audio using Azure OpenAI STT
                const transcription = await transcribeAudio(buffer, mime_type);
                
                console.log('[WhatsApp Audio] 📝 Transcription result:', {
                  text: transcription,
                  length: transcription.length
                });

                // Check if transcription was successful (not an error message)
                const isTranscriptionError = 
                  transcription.includes('Entschuldigung') || 
                  transcription.includes('nicht verstehen') ||
                  transcription.includes('not configured') ||
                  transcription.includes('nicht verfügbar');

                if (transcription && !isTranscriptionError) {
                  // Successful transcription - get AI response
                  console.log('[AI Integration] 🤖 Generating AI response for transcribed audio...');
                  const aiStartTime = Date.now();
                  
                  try {
                    // Use enhanced API for transcribed audio too
                    const responseData = await generateWhatsAppAIResponse(transcription, from);
                    const aiProcessingTime = Date.now() - aiStartTime;
                    
                    console.log('[AI Integration] ✅ AI response for audio:', {
                      success: responseData.success,
                      responseLength: responseData.message?.length,
                      processingTimeMs: aiProcessingTime,
                      level: responseData.level
                    });

                    // Send transcription and AI response
                    if (responseData.success && responseData.message) {
                      const responseMessage = `🎤 Ich habe verstanden: "${transcription}"\n\n${responseData.message}`;
                      await sendWhatsAppMessage(from, responseMessage, webhookPhoneNumberId);
                      
                      // Log successful audio interaction
                    } else {
                      console.error('[AI Integration] ❌ AI response generation failed for audio:', responseData.error);
                      await sendWhatsAppMessage(from, `🎤 Ich habe verstanden: "${transcription}"\n\nEntschuldigung, ich hatte Probleme beim Antworten. Können Sie Ihre Frage wiederholen?`, webhookPhoneNumberId);
                    }
                  } catch (aiError) {
                    console.error('[AI Integration] ❌ AI generation error for audio:', {
                      error: aiError instanceof Error ? aiError.message : aiError,
                      stack: aiError instanceof Error ? aiError.stack : undefined
                    });
                    await sendWhatsAppMessage(from, `🎤 Ich habe verstanden: "${transcription}"\n\nEntschuldigung, ich hatte Probleme beim Antworten. Können Sie Ihre Frage wiederholen?`, webhookPhoneNumberId);
                  }
                } else {
                  // Transcription failed or returned error message
                  console.error('[WhatsApp Audio] ❌ Transcription failed or returned error:', transcription);
                  await sendWhatsAppMessage(from, transcription || 'Entschuldigung, ich konnte Ihre Sprachnachricht nicht verstehen. Können Sie es noch einmal versuchen?', webhookPhoneNumberId);
                }
              } catch (error) {
                console.error('[WhatsApp Audio] ❌ Audio processing error:', {
                  error: error instanceof Error ? error.message : error,
                  stack: error instanceof Error ? error.stack : undefined
                });
                await sendWhatsAppMessage(from, 'Entschuldigung, ich hatte Probleme beim Verarbeiten Ihrer Sprachnachricht.', webhookPhoneNumberId);
              }
              break;
            }

            case 'image':
            case 'video':
            case 'document': {
              console.log('[WhatsApp Media] 📎 Unsupported media type received:', {
                type: message.type,
                mediaId: (message[message.type as keyof typeof message] as any)?.id,
                caption: (message[message.type as keyof typeof message] as any)?.caption
              });
              await sendWhatsAppMessage(
                from,
                `Danke für Ihr ${message.type === 'image' ? 'Bild' : message.type === 'video' ? 'Video' : 'Dokument'}! Als Deutschtutor kann ich Ihnen am besten mit Text- oder Sprachnachrichten helfen. Haben Sie Fragen zum Deutschlernen?`,
                webhookPhoneNumberId
              );
              break;
            }

            default:
              console.log('[WhatsApp Message] ❓ Unknown message type:', message.type);
              await sendWhatsAppMessage(
                from,
                'Entschuldigung, ich kann diesen Nachrichtentyp nicht verarbeiten. Bitte senden Sie mir eine Text- oder Sprachnachricht.',
                webhookPhoneNumberId
              );
          }
        } catch (error) {
          console.error('[WhatsApp Message] ❌ Processing error:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            messageType: message.type,
            from: from
          });
          await sendWhatsAppMessage(
            from,
            'Entschuldigung, ich hatte ein Problem beim Verarbeiten Ihrer Nachricht. Bitte versuchen Sie es noch einmal.',
            webhookPhoneNumberId
          );
        }

        return new Response('OK', { status: 200 });
      }

      // Handle message statuses
      if (change.statuses && change.statuses[0]) {
        const status = change.statuses[0];
        console.log('[WhatsApp Status] 📊 Message delivery update:', {
          messageId: status.id,
          status: status.status,
          recipient: status.recipient_id,
          timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
        });
        return new Response('OK', { status: 200 });
      }
    }

    console.log('[WhatsApp Webhook] ℹ️ No actionable webhook data found');
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] ❌ Fatal error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    // IMPORTANT: Always return 200 OK to prevent WhatsApp from retrying
    // Even if we have an error, we don't want duplicate processing
    return new Response('OK', { status: 200 });
  }
}