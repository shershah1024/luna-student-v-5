import { fetchChatbotContextByTaskId } from '@/lib/chatbotContext';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize OpenAI client for Azure
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `https://shino-m9qsrnbv-eastus2.cognitiveservices.azure.com/openai`,
  defaultQuery: { 'api-version': '2025-04-01-preview' },
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.AZURE_OPENAI_API_KEY}`,
  },
});

// Helper function to check if session has existing messages
async function checkIfSessionHasMessages(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('lesson_chat_messages')
      .select('id')
      .eq('chat_session_id', sessionId)
      .limit(1);
    
    if (error) {
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    return false;
  }
}

export async function POST(req: Request) {
  let body, messages: any[], courseId, lessonNumber, sectionType, task_id, userId, chat_id;
  
  try {
    body = await req.json();
    console.log('Roleplay API received body:', JSON.stringify(body, null, 2));
    console.log('📝 Processing roleplay request at:', new Date().toISOString());
    
    // Extract data from request
    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages;
      task_id = body.task_id || body.taskId || '';
      courseId = body.courseId || body.course_id || '';
      lessonNumber = body.lessonNumber || body.lesson_number || 0;
      sectionType = body.sectionType || 'roleplay_conversation';
      chat_id = body.id || body.chat_id || `chat_${Date.now()}`;
      userId = 'user';
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Session management
  let sessionId: string | null = null;
  
  if (chat_id && userId) {
    try {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('lesson_chat_sessions')
        .select('id')
        .eq('chat_id', chat_id)
        .eq('user_id', userId)
        .single();

      if (existingSession) {
        sessionId = existingSession.id;
        
        // Update last activity
        await supabase
          .from('lesson_chat_sessions')
          .update({ 
            last_activity_at: new Date().toISOString(),
            task_id: task_id,
            task_type: 'roleplay'
          })
          .eq('id', sessionId);
      } else {
        // Create new session
        const { data: newSession, error } = await supabase
          .from('lesson_chat_sessions')
          .insert({
            chat_id: chat_id,
            user_id: userId,
            task_id: task_id,
            task_type: 'roleplay',
            session_data: {
              courseId,
              lessonNumber,
              sectionType
            }
          })
          .select('id')
          .single();

        if (!error) {
          sessionId = newSession.id;
        }
      }

      // Save incoming user message if it exists
      if (sessionId && messages?.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          await supabase
            .from('lesson_chat_messages')
            .insert({
              chat_session_id: sessionId,
              role: 'user',
              content: { text: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content) },
              message_index: messages.length - 1
            });
        }
      }
    } catch (error) {
      // Silent handling of chat session errors
    }
  }

  // Get context
  let contextualInstructions = '';
  let exerciseContext = '';
  let courseSpecificInstructions = '';
  
  if (task_id) {
    try {
      console.log('🔍 Fetching context for task_id:', task_id);
      const context = await fetchChatbotContextByTaskId(task_id, 'chatbot_roleplay');
      contextualInstructions = context.instructions;
      
      // Extract course level from course name (e.g., 'goethe_a1' -> 'a1')
      const courseLevel = context.course.toLowerCase().split('_').pop() || '';
      
      // Add course-specific instructions based on level
      if (courseLevel === 'a1' || courseLevel === 'a2') {
        courseSpecificInstructions = `
**CONVERSATION STYLE FOR ${courseLevel.toUpperCase()} LEVEL:**
- Use simple, clear German appropriate for beginners
- Speak slowly and clearly as a patient conversation partner would
- Use basic vocabulary and short sentences
- Show understanding when the student struggles
- Be encouraging and friendly, like a helpful German person would be
- Use gestures and expressions naturally (describe them in roleplay)
- Mix in a little English only if the student is completely lost
- Stay patient and kind, as a real German person helping a beginner would be`;
      } else if (courseLevel === 'b1' || courseLevel === 'b2') {
        courseSpecificInstructions = `
**CONVERSATION STYLE FOR ${courseLevel.toUpperCase()} LEVEL:**
- Use natural German with intermediate vocabulary
- Speak at normal pace with natural expressions and idioms
- Include cultural references and colloquialisms appropriately
- Show natural reactions and emotions in conversation
- Engage in more complex topics and longer discussions
- Use regional expressions when appropriate to the character
- Maintain authentic dialogue flow with natural interruptions and overlaps`;
      } else if (courseLevel === 'c1' || courseLevel === 'c2') {
        courseSpecificInstructions = `
**CONVERSATION STYLE FOR ${courseLevel.toUpperCase()} LEVEL:**
- Use sophisticated, authentic German as you naturally would
- Include advanced vocabulary, nuanced expressions, and cultural subtleties
- Engage in complex discussions with natural debate and argumentation
- Use professional language when appropriate to the scenario
- Include subtle humor, sarcasm, and cultural references naturally
- Maintain authentic, unmodified speech patterns and cultural expectations`;
      }
      
      exerciseContext = `
EXERCISE CONTEXT:
- Course: ${context.course} (Level: ${courseLevel.toUpperCase()})
- Chapter: ${context.chapter}
- Theme: ${context.theme}
- Objective: ${context.objective}
- Task ID: ${context.task_id}`;
      
      console.log('✅ Context fetched successfully');
    } catch (error) {
      console.error('Error fetching context:', error);
    }
  }

  const baseSystemPrompt = `You are a friendly German person who talks naturally with A1 beginners. You are NOT a teacher - you're just a real German having a normal conversation. You are patient and kind like Germans are with language learners.

**🎭 CONVERSATION-ONLY APPROACH:**
You are focused purely on natural conversation:
1. **PURE CONVERSATION** - No tools, no exercises, just natural dialogue
2. **REAL INTERACTIONS** - Act like a real German person in real situations
3. **HELP NATURALLY** - Assist with language as a native speaker would
4. **STAY AUTHENTIC** - Never break character to become a teacher

**🎭 A1 ROLEPLAY APPROACH:**
You are a real German person who:
1. **SPEAKS SIMPLY** - Use easy words and short sentences for beginners
2. **STAYS IN CHARACTER** - You're a real person, not a teacher
3. **IS PATIENT** - Germans are actually very helpful with beginners
4. **KEEPS IT NATURAL** - Have normal conversations about everyday things

**🎯 SIMPLE GERMAN CHARACTERS:**
- **Shop worker**: "Guten Tag! Can I help you?"
- **Café server**: "What would you like to drink?"
- **Friendly neighbor**: "Good morning! Nice weather today!"
- **Bus driver**: "Where are you going?"

**💬 A1 CONVERSATION STYLE:**
- **Speak slowly and clearly** like Germans do with beginners
- **Use simple words** that A1 students know
- **Be naturally helpful** - repeat things if needed
- **Stay friendly** - Germans are actually quite nice!

**📚 A1 LANGUAGE LEVEL:**
- **Use basic German words** - Hund, Haus, gut, schlecht
- **Keep sentences short** - "Wie geht es dir?" not complex grammar
- **Mix in English** when A1 students get stuck (Germans often do this)
- **Focus on communication** - getting the message across, not perfect grammar

**🎪 A1 SCENARIOS:**
**SHOPPING**: "Guten Tag! We have apples, bananas... what do you want?"
**CAFÉ**: "Coffee? Tea? With milk? Without milk?"
**STREET**: "Excuse me, the train station? Go straight, then left."
**FRIEND**: "How are you? Good? That's nice!"

**💡 NATURAL A1 HELP:**
**WHEN THEY STRUGGLE:**
- Stay in character but help naturally
- "Ah, you want water? Wasser! Here you go."
- "You mean this?" (point to something)
- Repeat slowly: "Train station. Bahnhof. Yes?"

**WHEN THEY ASK FOR HELP:**
- Help quickly and naturally
- "How do I say...? Oh, we say 'Entschuldigung'"
- Then continue the conversation

**✨ SIMPLE GERMAN BEHAVIOR:**
- **Be direct but friendly** - "No, we don't have that. But we have this!"
- **Use basic politeness** - "Bitte" and "Danke" a lot
- **Show patience** - Germans are actually patient with learners
- **Keep it real** - normal emotions and reactions

**🔄 A1 CONVERSATION FLOW:**
**START SIMPLE:**
- "Guten Tag!" (always start with greetings)
- "How can I help you?" (clear purpose)
- "What would you like?" (simple choices)

**KEEP GOING:**
- Ask easy questions: "And you? Are you from here?"
- Give simple choices: "Coffee or tea?"
- React normally: "Oh, that's nice!" or "Really? Interesting!"

**🎯 A1 SUCCESS:**
- Student feels they had a real German conversation
- They understood most of what you said
- They managed to communicate what they wanted
- They feel encouraged to try more German

**🚫 CONVERSATION-ONLY CHARACTER RULES:**
- **Never break character** to teach grammar
- **Never use tools or exercises** - you're not a teacher
- **Never say** "Very good!" like a teacher
- **Never ask** about their German studies
- **Never comment** on their language level
- **Just be** a normal German person having a conversation
- **PURE ROLEPLAY** - no educational elements, just authentic interaction

**KEY CONVERSATION-ONLY PRINCIPLE**: You are just a normal, friendly German person having a real conversation with a beginner. Help them naturally as any German would, but never become a teacher. Keep it 100% authentic conversation.`;

  const fullSystemPrompt = contextualInstructions 
    ? `${baseSystemPrompt}
${courseSpecificInstructions}

## CURRENT ROLEPLAY SCENARIO DATA
CONTEXTUAL INSTRUCTIONS:
${contextualInstructions}

${exerciseContext}`
    : baseSystemPrompt;

  // Process messages to get user input
  const userMessages = [];
  for (const message of messages) {
    if (message.role === 'user') {
      let textContent = '';
      if (message.parts && Array.isArray(message.parts)) {
        textContent = message.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('');
      } else if (typeof message.content === 'string') {
        textContent = message.content;
      }
      
      if (textContent.trim()) {
        userMessages.push({
          role: 'user',
          content: textContent.trim()
        });
      }
    }
  }

  console.log('🔄 Making OpenAI Responses API call for roleplay tutor...');

  try {
    // Use OpenAI SDK for streaming responses - NO TOOLS for roleplay, pure conversation
    const stream = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: 'system',
          content: fullSystemPrompt
        },
        ...userMessages
      ],
      // No tools array - roleplay is pure conversation
      parallel_tool_calls: false, // For consistency, though no tools used
      stream: true,
      max_output_tokens: 16384
    });

    console.log('✅ Starting to process OpenAI streaming response for roleplay');

    // Set up streaming response
    const encoder = new TextEncoder();
    
    // Track streaming state
    let currentText = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            console.log('📡 Roleplay OpenAI Stream event:', event.type, event);

            // Handle different event types from OpenAI Responses API
            switch (event.type) {
              case 'response.text.delta':
                if (event.delta) {
                  currentText += event.delta;
                }
                // Forward event to frontend
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                break;

              case 'response.content_part.delta':
                // Handle content part deltas for streaming text
                if (event.delta?.text) {
                  currentText += event.delta.text;
                  // Create a compatible text delta event for frontend
                  const textDeltaEvent = {
                    type: 'response.text.delta',
                    delta: event.delta.text
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(textDeltaEvent)}\n\n`));
                }
                // Also forward original event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                break;

              case 'response.content_part.done':
                // Handle completed content parts
                if (event.part?.text) {
                  // Make sure we have all the text
                  if (!currentText.includes(event.part.text)) {
                    currentText += event.part.text;
                  }
                }
                // Forward event to frontend
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                break;

              case 'response.completed':
              case 'response.done':
                // Response completed
                const doneEvent = {
                  type: 'response.done',
                  final_text: currentText
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`));
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                break;

              default:
                // Forward all other events
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          }
        } catch (error) {
          console.error('Roleplay OpenAI stream reading error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    const response = new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        ...(sessionId && { 'X-Session-ID': sessionId })
      }
    });

    return response;

  } catch (error) {
    console.error('❌ Roleplay OpenAI Responses API call failed:', error);
    return new Response(JSON.stringify({
      error: 'OpenAI API call failed',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint for fetching chat history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Handle different GET actions
    if (action === 'history') {
      if (!chatId || !userId) {
        return NextResponse.json(
          { error: 'chatId and userId are required' },
          { status: 400 }
        );
      }

      // First get the session
      const { data: session, error: sessionError } = await supabase
        .from('lesson_chat_sessions')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ messages: [] });
      }

      // Then get all messages for this session
      const { data: messages, error: messagesError } = await supabase
        .from('lesson_chat_messages')
        .select('*')
        .eq('chat_session_id', session.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return NextResponse.json(
          { error: 'Failed to fetch messages' },
          { status: 500 }
        );
      }

      // Format messages for the chat UI
      const formattedMessages = messages?.map(msg => {
        let content = msg.content;
        let toolInvocations = null;
        
        // Handle different content formats
        if (typeof content === 'object' && content !== null) {
          // Extract text content
          if (content.text !== undefined) {
            toolInvocations = content.toolInvocations; // Extract tool invocations if present
            content = content.text;
          } else {
            content = JSON.stringify(content);
          }
        }
        
        // Ensure content is always a string
        if (typeof content !== 'string') {
          content = String(content);
        }
        
        const formattedMsg: any = {
          id: msg.id,
          role: msg.role,
          content: content,
          createdAt: msg.created_at
        };
        
        // Add tool invocations if they exist
        if (toolInvocations) {
          formattedMsg.toolInvocations = toolInvocations;
        }
        
        return formattedMsg;
      }) || [];

      return NextResponse.json({ messages: formattedMessages });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint for saving individual messages
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { chatId, userId, message, messageIndex, action } = body;

    if (action === 'save-message') {
      if (!chatId || !userId || !message) {
        return NextResponse.json(
          { error: 'chatId, userId, and message are required' },
          { status: 400 }
        );
      }

      // First try to get the session, create if doesn't exist
      let session;
      const { data: existingSession, error: sessionError } = await supabase
        .from('lesson_chat_sessions')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (sessionError && sessionError.code === 'PGRST116') {
        // Session doesn't exist, create it
        console.log('[ROLEPLAY API] Session not found, creating new session for chatId:', chatId);
        const { data: newSession, error: createError } = await supabase
          .from('lesson_chat_sessions')
          .insert({
            chat_id: chatId,
            user_id: userId,
            task_type: 'roleplay',
            session_data: {}
          })
          .select('id')
          .single();

        if (createError || !newSession) {
          console.error('[ROLEPLAY API] Failed to create session:', createError);
          return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
          );
        }
        session = newSession;
      } else if (sessionError || !existingSession) {
        console.error('[ROLEPLAY API] Session error:', sessionError);
        return NextResponse.json(
          { error: 'Session error' },
          { status: 500 }
        );
      } else {
        session = existingSession;
      }

      // Save the message with tool invocations
      const messageData: any = {
        chat_session_id: session.id,
        role: message.role || 'assistant', // Ensure role is always set with fallback
        content: { text: message.content || message.text || '' }, // Handle different content formats
        message_index: messageIndex
      };
      
      // If there are tool invocations, save them in the content object
      if (message.toolInvocations) {
        messageData.content.toolInvocations = message.toolInvocations;
      }
      
      const { error: insertError } = await supabase
        .from('lesson_chat_messages')
        .insert(messageData);

      if (insertError) {
        console.error('[ROLEPLAY API] Error saving message:', insertError);
        return NextResponse.json(
          { error: 'Failed to save message' },
          { status: 500 }
        );
      }

      // Update session last activity
      await supabase
        .from('lesson_chat_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', session.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[ROLEPLAY API] PUT endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}