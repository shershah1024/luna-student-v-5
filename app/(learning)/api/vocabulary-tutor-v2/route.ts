import { createAzure } from '@ai-sdk/azure';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { chatRequestBodySchema } from '@/app/(communication)/api/chat-schema';


export const dynamic = "force-dynamic";
export const maxDuration = 30;

const azure = createAzure({
  baseURL: `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.cognitiveservices.azure.com/openai`,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || "preview",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Learning status progression
const LEARNING_STATUS = {
  NOT_STARTED: 0,
  INTRODUCED: 1,
  PARTIALLY_LEARNED: 2,
  SECOND_CHANCE: 3,
  REVIEWING: 4,
  MASTERED: 5
} as const;

// Helper function to get all user vocabulary (not tied to specific task) - OPTIMIZED
async function getAllUserVocabularyBatch(userId: string, offset: number = 0) {
  const { data, error } = await supabase
    .from('user_vocabulary')
    .select('term, learning_status')
    .eq('user_id', userId)
    .lt('learning_status', 5) // Only fetch words not yet mastered
    .order('learning_status', { ascending: true })
    .order('created_at', { ascending: true }) // Use created_at instead of last_practiced for better performance
    .range(offset, offset + 9); // Get 10 words (0-indexed)
  
  if (error) {
    console.error('[getAllUserVocabularyBatch] Error fetching user vocabulary:', error);
    return [];
  }
  
  // Map term to word for consistency and add minimal required fields
  return (data || []).map(item => ({
    term: item.term,
    word: item.term, // For consistency with existing code
    learning_status: item.learning_status || 0,
    test_id: item.test_id,
    task_id: item.task_id
  }));
}

// Helper function to get total vocabulary count - OPTIMIZED (only non-mastered words)
async function getTotalVocabularyCount(userId: string) {
  const { count, error } = await supabase
    .from('user_vocabulary')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lt('learning_status', 5); // Only count words not yet mastered
  
  if (error) {
    console.error('[getTotalVocabularyCount] Error getting count:', error);
    return 0;
  }
  
  return count || 0;
}

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

// Helper function to update word progress (works across all vocabulary)
async function updateWordProgress(userId: string, word: string, newStatus: number, isCorrect: boolean = false) {
  const { error } = await supabase
    .from('user_vocabulary')
    .update({ learning_status: newStatus })
    .eq('user_id', userId)
    .ilike('term', word);
  
  if (error) {
    console.error('Error updating word progress:', error);
  }
}

export async function POST(req: Request) {
  
  let body, messages: UIMessage[], userId, chatId;
  
  try {
    body = await req.json();
    
    // Detect format and convert if needed
    if (body.id && body.message && body.selectedChatModel) {
      // Luna v4 format - validate and convert
      const validatedBody = chatRequestBodySchema.parse(body);
      
      // Convert Luna v4 message format to UIMessage format
      const textParts = validatedBody.message.parts.filter(part => part.type === 'text');
      const messageText = textParts.map(part => part.text).join(' ');
      
      messages = [
        {
          id: validatedBody.message.id,
          role: validatedBody.message.role,
          content: messageText
        }
      ];

      // Extract user context (may be provided through other means in Luna v4)
      userId = body.userId || body.user_id;
      chatId = body.chatId || body.chat_id || validatedBody.id; // Use conversation id as chat id
    } else {
      // Original format
      ({ messages, userId, chatId } = body);
    }
    
    if (!userId) {
      console.error('[vocabulary-tutor-v2] Missing userId:', { body, userId, userIdType: typeof userId });
      return new Response(JSON.stringify({ 
        error: 'User ID is required',
        debug: { receivedUserId: userId, bodyKeys: Object.keys(body) }
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!messages || !Array.isArray(messages)) {
      console.error('[vocabulary-tutor-v2] Invalid messages:', { messages, messagesType: typeof messages, isArray: Array.isArray(messages) });
      return new Response(JSON.stringify({ 
        error: 'Messages array is required',
        debug: { receivedMessages: messages, messagesType: typeof messages }
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('[vocabulary-tutor-v2] Error parsing request body:', error);
    return new Response(JSON.stringify({ 
      error: 'Invalid request body',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let sessionId: string | null = null;
  
  // Initialize or get chat session
  if (chatId && userId) {
    try {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('lesson_chat_sessions')
        .select('id, session_data')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (existingSession) {
        sessionId = existingSession.id;
        
        // Update last activity
        await supabase
          .from('lesson_chat_sessions')
          .update({ 
            last_activity_at: new Date().toISOString(),
            task_type: 'vocabulary_tutor_v2'
          })
          .eq('id', sessionId);
      } else {
        // Create new session
        const { data: newSession, error } = await supabase
          .from('lesson_chat_sessions')
          .insert({
            chat_id: chatId,
            user_id: userId,
            task_type: 'vocabulary_tutor_v2',
            session_data: {
              currentOffset: 0
            }
          })
          .select('id')
          .single();

        if (error) {
          console.error('[vocabulary-tutor-v2] Error creating session:', error);
        } else {
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
              content: { text: typeof (lastMessage as any).content === 'string' ? (lastMessage as any).content : JSON.stringify((lastMessage as any).content) },
              message_index: messages.length - 1
            });
        }
      }
    } catch (error) {
      console.error('[vocabulary-tutor-v2] Error managing chat session:', error);
    }
  }

  // Check if this is an initialization message
  const isInitMessage = messages?.length === 1 && 
    messages[0]?.role === 'user' && 
    (typeof (messages[0] as any).content === 'string') &&
    ((messages[0] as any).content.includes("I'm ready to help you practice") || 
     (messages[0] as any).content === 'hello' ||
     (messages[0] as any).content.includes("ready to help") ||
     (messages[0] as any).content.includes("ready to practice"));

  const courseSpecificInstructions = `
**VOCABULARY TUTOR MODE - NEW WORKFLOW:**
- Personal vocabulary collection from all courses and lessons
- Use fetchVocabularyWords tool AFTER welcoming user to load words
- Use updateWordProgressBackend for silent progress tracking (fast)
- Use showProgressMilestone ONLY for levels 3 and 5 celebrations
- Mix English and German to aid understanding
- Keep responses SHORT and conversational
- Focus on practical usage and real-world application
- Work through 10 words at a time systematically
- ALWAYS end every message with a question to keep conversation flowing
`;

  const baseSystemPrompt = `<role>
You are Luna, a charismatic German vocabulary coach who makes word learning ADDICTIVE through natural conversation, cultural storytelling, and genuine connection. You're famous for helping students fall in love with German words through authentic, engaging experiences.
</role>

<personality>
**Core Identity:**
- **Word Whisperer**: You make every German word feel alive with stories and cultural context
- **Conversational Genius**: You teach through natural dialogue, not mechanical drills
- **Cultural Bridge**: You connect every word to authentic German life and experiences
- **Empathetic Coach**: You read student energy and adapt your teaching style instantly
- **Memory Magician**: You create unforgettable connections that make words stick forever

**Teaching Philosophy:**
- Words are living pieces of German culture, not just sounds to memorize
- Every vocabulary lesson is a window into German thinking and lifestyle
- Conversation beats tools - tools only enhance natural learning moments
- One deeply understood word beats ten superficially learned ones
- Students learn best when they feel genuinely curious and excited
</personality>

<language_mastery>
**🚨 CRITICAL LANGUAGE RULE - A1 FOUNDATION:**
- **ENGLISH DOMINANCE**: Use 90% English, 10% German for A1 students
- **German ONLY for**: The specific vocabulary word being taught + simple 2-3 word examples
- **ALL explanations, stories, and feedback in English** to ensure comprehension
- **Cultural context in English** so students can fully appreciate the background
- **Never use German phrases** like "Sehr gut!", "Heute lernen wir", "Kannst du"
- **Self-correction**: If you slip into German, immediately switch back with "Sorry, let me say that in English..."
</language_mastery>

<natural_teaching_flow>
**ORGANIC CONVERSATION PRINCIPLES:**

**COMPLETE FREEDOM TO:**
- Start conversations based on student's mood and energy
- Follow natural tangents that deepen word understanding
- Use cultural stories, personal anecdotes, or fun facts
- Skip tools entirely if conversation is flowing well
- Teach multiple related words if naturally connected
- Respond to student curiosity with immediate exploration
- Create spontaneous learning moments

**TOOL USAGE - STRATEGIC & INTUITIVE:**
- **multipleChoice**: When testing understanding feels natural
- **matchingExercise**: When connections need reinforcement
- **sentenceBuilder**: When word usage practice is needed
- **pronunciationExercise**: When pronunciation matters for confidence
- **updateWordProgress**: Always track meaningful progress
- **table**: When presenting vocabulary overview
- **NO TOOLS**: When pure conversation creates better learning

**FORBIDDEN MECHANICAL BEHAVIOR:**
❌ Don't follow rigid word-introduction formulas
❌ Don't force tool usage if conversation works better
❌ Don't stick to artificial "one word only" rules if connections arise
❌ Don't ignore student interests to follow a preset plan
❌ Don't be predictable - surprise and delight them
</natural_teaching_flow>

**✨ AUTHENTIC TEACHING MOMENTS:**

**🎭 Scenario 1: High-Energy Enthusiast**
*Student radiates excitement and curiosity*

"I love your energy! You remind me of my students in Munich who couldn't wait to learn new words. Speaking of energy, there's this perfect German word **lebhaft** that captures exactly what I'm seeing from you right now. Want to guess what it might mean? Hint: it's what you're being right now!"

**🎭 Scenario 2: Cultural Explorer**
*Student shows interest in German culture*

"You know what I find magical about German vocabulary? Every word tells a story about how Germans see the world. Take **Gemütlichkeit** - there's literally no English equivalent because it represents something uniquely German. It's about cozy warmth, belonging, and that special feeling when everything feels just right. Have you ever experienced something like that?"

**🎭 Scenario 3: Gentle Encourager**
*Student seems hesitant or overwhelmed*

"I can sense you might be feeling a bit overwhelmed, and that's completely normal! Learning new words is like meeting new people - sometimes it takes a moment to feel comfortable. Let's start with something gentle and friendly. The German word **Freund** is probably one of the most important words you'll ever learn. What do you think it might mean?"

**✅ NATURAL CONVERSATION EXAMPLES:**

**Cultural Opening:**
"Picture this: you're walking through a German Christmas market, and you hear someone say **Lebkuchen**. The smell is incredible - cinnamon, nutmeg, honey... What do you think **Lebkuchen** might be?"

**Personal Connection:**
"I remember my first day in Berlin - I was so nervous! But then a kind stranger said **Willkommen** to me, and I immediately felt better. Can you guess what **Willkommen** means?"

**Story-Based Introduction:**
"Here's something that always makes me smile: Germans have a word **Fernweh** that describes the ache you feel when you want to travel to distant places. It's like homesickness, but for places you've never been! Have you ever felt **Fernweh**?"

**✅ AUTHENTIC RESPONSES:**
- "That's exactly right! I love how you're connecting with these words!"
- "Interesting guess! Let me share the real meaning with a little story..."
- "You're so close! Here's a cultural clue that might help..."

**❌ MECHANICAL PATTERNS TO AVOID:**
- Rigid "word + translation + exercise" sequences
- Immediate tool deployment without conversation
- Generic praise without personal connection
- Moving through words like a checklist

**ORGANIC VOCABULARY MASTERY:**
*   Words emerge naturally through conversation and cultural context
*   Deep cultural understanding accompanies every vocabulary item
*   Tools enhance but never replace authentic human interaction
*   Stories and personal connections make words unforgettable

**📈 NATURAL LEARNING PROGRESSION:**

**Discovery Phase:** Word introduced through story, culture, or curiosity
**Connection Phase:** Student relates word to personal experience or cultural understanding
**Practice Phase:** Natural usage through conversation, tools only when helpful
**Mastery Phase:** Student uses word confidently in authentic contexts

**🎯 ADAPTIVE PROGRESSION PRINCIPLES:**
*   Follow student curiosity - if they're fascinated by a word family, explore it
*   Use **updateWordProgress** after genuine learning moments, not arbitrary checkpoints
*   Allow natural connections between related words to emerge
*   Trust the learning process - authentic engagement creates lasting retention

**🔧 STRATEGIC TOOL DEPLOYMENT:**

**pronunciationExercise:** When student struggles with or asks about pronunciation
**multipleChoice:** When cultural context or usage needs reinforcement
**matchingExercise:** When word relationships require visual organization
**sentenceBuilder:** When contextual usage needs practice
**table:** When presenting vocabulary overview or batch introduction

**⚡ NATURAL LEARNING FLOW:**
1. **Cultural introduction** through story, experience, or curiosity
2. **Conversational exploration** of meaning, context, and personal connections
3. **Intuitive tool selection** only when it genuinely enhances understanding
4. **Organic progression** to related words or new concepts as interest guides

**🎯 INTUITIVE TEACHING DECISIONS:**
*   Read student energy and interest level constantly
*   Adapt approach based on their learning style and preferences
*   Follow fascinating tangents that deepen understanding
*   Trust your teaching instincts over rigid protocols

**📈 AUTHENTIC PROGRESS TRACKING:**
*   Use **updateWordProgress** after genuine breakthrough moments
*   Include meaningful **conversation_continue** that builds on the learning
*   Allow natural progression - some words need one interaction, others need five

**🔄 DYNAMIC LEARNING JOURNEY:**
1. **Cultural hook**: "Let me tell you about something uniquely German... [story that introduces word naturally]"
2. **Curiosity building**: "Have you ever experienced something like this?"
3. **Word emergence**: "There's a perfect German word for this feeling: **[word]**"
4. **Personal connection**: "How does this word relate to your own experiences?"
5. **Natural deepening**: Follow student interest with tools, stories, or related concepts

**✅ CAPTIVATING CONVERSATION STARTERS:**

**Cultural Immersion Opening:**
"Imagine you're at a traditional German *Biergarten* on a warm summer evening. Families are gathered, children are playing, and there's this wonderful sense of community that Germans call **Gemütlichkeit**. Can you feel that warmth just from my description?"

**Personal Story Approach:**
"I'll never forget my first German winter - everything was so different! But then I learned this beautiful word **Geborgenheit** that perfectly captures that feeling of being safe and protected. Have you ever felt completely **geborgen**?"

**Curiosity-Driven Feedback:**
"I can see that word really resonates with you! That's exactly how I felt when I first discovered it."
"Ah, that's a thoughtful connection! Let me share how that word reflects German culture..."

**🎯 AUTHENTIC SUCCESS INDICATORS:**
✅ Student shows genuine curiosity and engagement
✅ Cultural connections create memorable learning moments
✅ Words stick because they're learned through meaningful context
✅ Student feels excited to discover more German culture through vocabulary

**💬 NATURAL ENGAGEMENT APPROACH:**
- Ask thought-provoking questions: "Have you ever felt that way?" "What does this remind you of?"
- Share cultural insights: "Here's something fascinating about how Germans think..."
- Build authentic connections: "That's exactly the spirit of this word!"
- Create wonder: "Wait until you hear the story behind this word..."

**🌟 TEACHING MASTERY REMINDER:**
You're not just teaching vocabulary - you're opening doors to German culture, thinking, and soul. Every word is an opportunity to create a lasting connection between student and German-speaking world. Trust your instincts, follow curiosity, and let authentic human connection guide the learning journey.

**🚨 COMMUNICATION GUIDELINES:**
- Adapt language complexity to student level and comprehension
- Prioritize clarity and understanding over arbitrary language rules
- Use cultural context to make words unforgettable
- Create safe, encouraging environment where curiosity thrives

**📱 INITIALIZATION BEHAVIOR:**
${isInitMessage ? `**THIS IS AN INITIALIZATION MESSAGE** - The student is just starting their vocabulary practice session.

**NEW WORKFLOW - OPTIMIZED FETCHING:**
1. **Warm welcome** - Greet them as Luna with genuine enthusiasm
2. **Explain the session** - Let them know this is their personal vocabulary collection
3. **Start conversationally** - Ask about their vocabulary learning experience or goals
4. **THEN use fetchVocabularyWords tool** - Load ONLY words that need work (not mastered yet)
5. **Begin teaching** - Focus on the loaded words that need practice

**EXAMPLE OPENING:**
"Welcome to your personal vocabulary practice! I'm Luna, and I'm so excited to help you with the German words you've been collecting. How are you feeling about your German vocabulary journey so far? Are there any words that have been particularly challenging or exciting for you?"

**FOLLOW STUDENT INTEREST** - After their response, use fetchVocabularyWords to load their collection and begin practice.` : '**THIS IS A CONTINUED CONVERSATION** - Respond naturally to the student\'s message and continue the vocabulary practice.'}

**🔧 TOOL USAGE - NEW SYSTEM:**
- **fetchVocabularyWords**: Load user's vocabulary collection (use after welcome, include conversation_continue to tell user what was loaded)
- **updateWordProgressBackend**: Silent progress tracking (use frequently, won't slow chat)
- **showProgressMilestone**: Celebrate ONLY at levels 3 and 5 (meaningful moments)
- **Other tools**: multipleChoice, matchingExercise, etc. as needed

${courseSpecificInstructions}`;


  // Convert UI messages to model messages format with error handling
  let modelMessages;
  try {
    modelMessages = convertToModelMessages(messages);
  } catch (error) {
    console.error('[vocabulary-tutor-v2] Error converting messages:', error);
    
    // Filter out messages with incomplete tool calls and retry
    const filteredMessages = messages.filter((message: any) => {
      // Skip messages that might have incomplete tool data
      if (message.role === 'assistant') {
        // Check parts array if it exists
        if (message.parts && Array.isArray(message.parts)) {
          const hasIncompleteToolParts = message.parts.some((part: any) => {
            if (part.type?.startsWith('tool-')) {
              // More strict checking for tool parts
              const hasValidInput = part.input !== undefined;
              const hasToolCallId = part.toolCallId && typeof part.toolCallId === 'string';
              
              // If it's a tool part but missing critical data, consider it incomplete
              return !hasValidInput || !hasToolCallId;
            }
            return false;
          });
          
          if (hasIncompleteToolParts) {
            return false;
          }
        }
        
        // Check toolInvocations array if it exists
        if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
          const hasIncompleteToolInvocations = message.toolInvocations.some((tool: any) => {
            const hasToolCallId = tool.toolCallId && typeof tool.toolCallId === 'string';
            const hasToolName = tool.toolName && typeof tool.toolName === 'string';
            const hasState = tool.state && typeof tool.state === 'string';
            
            return !hasToolCallId || !hasToolName || !hasState || tool.state === 'partial-call';
          });
          
          if (hasIncompleteToolInvocations) {
            return false;
          }
        }
      }
      return true;
    });
    
    
    try {
      modelMessages = convertToModelMessages(filteredMessages);
    } catch (retryError) {
      console.error('[vocabulary-tutor-v2] Retry also failed:', retryError);
      
      // Final fallback: use only the last user message to continue the conversation
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
      if (lastUserMessage) {
        try {
          modelMessages = convertToModelMessages([lastUserMessage]);
        } catch (fallbackError) {
          console.error('[vocabulary-tutor-v2] Final fallback also failed:', fallbackError);
          return new Response(JSON.stringify({ 
            error: 'Message conversion failed completely',
            details: retryError instanceof Error ? retryError.message : String(retryError) 
          }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        console.error('[vocabulary-tutor-v2] No user message found for fallback');
        return new Response(JSON.stringify({ 
          error: 'Message conversion failed - no valid messages',
          details: retryError instanceof Error ? retryError.message : String(retryError) 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
  
  
  const result = await streamText({
    model: azure('gpt-5-mini'),
    system: baseSystemPrompt,
    messages: modelMessages,
    providerOptions: {
      azure: {
        reasoningEffort: 'minimal'
      }
    },
    onFinish: (result) => {
      
      // Special detailed logging for fetchVocabularyWords
      if (result.toolCalls && result.toolCalls.length > 0) {
        const fetchVocabCalls = result.toolCalls.filter(tc => tc.toolName === 'fetchVocabularyWords');
        if (fetchVocabCalls.length > 0) {
        }
      }
      
      // Additional detailed logging for tool calls
      if (result.toolCalls && result.toolCalls.length > 0) {
        result.toolCalls.forEach((tc, index) => {
        });
      }
    },
    tools: {
      fetchVocabularyWords: tool({
        description: 'Load the user\'s vocabulary collection. Use AFTER welcoming the user to get their saved words from all courses.',
        inputSchema: z.object({
          offset: z.number().default(0).describe('Starting position for loading words (0 for first batch, 10 for second batch, etc.)'),
          includeContext: z.boolean().default(true).describe('Whether to include learning context and instructions'),
          conversation_continue: z.string().describe('Enthusiastic teacher message taking charge of the lesson. Be proactive! Ask engaging questions like "Ready to master these German beauties?" or "Shall we dive into some cultural word magic?" Never ask what they want - YOU decide the learning approach!')
        }),
        execute: async ({ offset = 0, includeContext = true, conversation_continue }) => {
          
          if (!userId) {
            return {
              error: 'User ID required to fetch vocabulary',
              hasWords: false,
              totalCount: 0,
              conversation_continue
            };
          }

          // Get the current session and update offset if needed
          if (sessionId) {
            await supabase
              .from('lesson_chat_sessions')
              .update({ 
                session_data: { currentOffset: offset }
              })
              .eq('id', sessionId);
          }

          const currentBatch = await getAllUserVocabularyBatch(userId, offset);
          
          const totalCount = await getTotalVocabularyCount(userId);
          
          // Since we only fetch non-mastered words, no need to check for mastered words
          // If current batch is empty but there are more words, auto-advance to next batch
          if (currentBatch.length === 0 && offset + 10 < totalCount) {
            const newOffset = offset + 10;
            const newBatch = await getAllUserVocabularyBatch(userId, newOffset);
            
            // Update session with new offset
            if (sessionId) {
              await supabase
                .from('lesson_chat_sessions')
                .update({ 
                  session_data: { currentOffset: newOffset }
                })
                .eq('id', sessionId);
            }
            
            const result = {
              hasWords: newBatch.length > 0,
              words: newBatch,
              totalCount,
              currentOffset: newOffset,
              batchProgress: 0, // Since we only fetch non-mastered words, batchProgress is always 0
              batchSize: Math.min(10, newBatch.length),
              autoAdvanced: true,
              instructions: includeContext ? 'Auto-advanced to next batch. Focus on words that need work.' : '',
              conversation_continue
            };
            
            return result;
          }

          if (currentBatch.length === 0) {
            return {
              hasWords: false,
              totalCount,
              message: 'No vocabulary words found. User should save words from lessons to build their collection.',
              instructions: includeContext ? 'Explain that they need to click on words in lessons to save them. Suggest exploring courses to build vocabulary.' : '',
              conversation_continue
            };
          }

          // Since we only fetch non-mastered words, all words in currentBatch need work
          const result = {
            hasWords: true,
            words: currentBatch,
            totalCount,
            currentOffset: offset,
            batchProgress: 0, // Since we only fetch non-mastered words, no mastered words in batch
            batchSize: currentBatch.length,
            wordsNeedingWork: currentBatch.length, // All words need work since we only fetch non-mastered
            instructions: includeContext ? `Focus on these ${currentBatch.length} words that need work. Work systematically through words based on learning status. Use updateWordProgressBackend to track progress silently.` : '',
            conversation_continue
          };
          
          return result;
        },
      }),

      updateWordProgressBackend: tool({
        description: 'Silently update word progress in database without UI feedback. Use frequently during teaching - this won\'t slow down the chat.',
        inputSchema: z.object({
          word: z.string().describe('The German vocabulary word to update'),
          newStatus: z.number().min(0).max(5).describe('New learning status: 0=not_started, 1=introduced, 2=partially_learned, 3=second_chance, 4=reviewing, 5=mastered'),
          isCorrect: z.boolean().default(false).describe('Whether the student answered correctly this time'),
          conversation_continue: z.string().describe('Message to continue the conversation after updating progress. Keep the conversation flowing naturally without mentioning the database update.')
        }),
        execute: async ({ word, newStatus, isCorrect, conversation_continue }) => {
          
          // Update the database silently
          if (userId) {
            await updateWordProgress(userId, word, newStatus, isCorrect);
          } else {
            console.warn('[vocabulary-tutor-v2] ⚠️ Skipping database update - missing userId');
          }
          
          return {
            word,
            newStatus,
            conversation_continue,
            updated: true
          };
        },
      }),

      showProgressMilestone: tool({
        description: 'Show progress celebration UI ONLY for meaningful milestones (levels 3 and 5). Use sparingly for maximum impact.',
        inputSchema: z.object({
          word: z.string().describe('The German vocabulary word that reached the milestone'),
          milestoneLevel: z.number().min(3).max(5).describe('Milestone level reached (3 or 5 only)'),
          previousStatus: z.number().min(0).max(4).describe('Previous learning status'),
          celebrationMessage: z.string().describe('Congratulatory message explaining the achievement'),
          nextSteps: z.string().describe('What happens next in their learning journey')
        }),
        execute: async ({ word, milestoneLevel, previousStatus, celebrationMessage, nextSteps }) => {
          
          // Validate milestone level
          if (milestoneLevel !== 3 && milestoneLevel !== 5) {
            console.warn('[vocabulary-tutor-v2] ⚠️ Invalid milestone level:', milestoneLevel);
            return {
              error: 'Milestone celebrations only for levels 3 and 5'
            };
          }

          const result = {
            word,
            previousStatus,
            newStatus: milestoneLevel,
            isCorrect: true,
            isMilestone: true,
            milestoneLevel,
            celebrationMessage,
            nextSteps,
            conversation_continue: `${celebrationMessage} ${nextSteps}`
          };
          
          return result;
        },
      }),
      
      pronunciationExercise: tool({
        description: 'Create a pronunciation learning experience that includes audio playback AND pronunciation practice exercise. Students can listen to the word and then test their own pronunciation. Use when the student asks how to pronounce a word or needs help with pronunciation. No follow-up conversation needed as the exercise provides its own feedback.',
        inputSchema: z.object({
          word: z.string().describe('The German word to pronounce and practice'),
          explanation: z.string().optional().describe('Optional explanation about pronunciation tips or challenging sounds')
        }),
        execute: async ({ word, explanation }) => {
          return { word, explanation };
        },
      }),
      
      matchingExercise: tool({
        description: 'Create vocabulary matching exercises ONLY when you have EQUAL numbers of items to match. Use for German words ↔ English meanings (3 words = 3 meanings). NEVER use for single word with multiple situations.',
        inputSchema: z.object({
          instructions: z.string().describe('Instructions for the vocabulary matching exercise'),
          leftItems: z.array(z.object({
            id: z.string().describe('Unique identifier for this item'),
            text: z.string().describe('German word or phrase')
          })).describe('German words or phrases with unique IDs'),
          rightItems: z.array(z.object({
            id: z.string().describe('Unique identifier for this item'),
            text: z.string().describe('English translation, definition, or thematic connection')
          })).describe('English translations/meanings with unique IDs'),
          correctPairs: z.array(z.object({
            leftId: z.string().describe('ID of the German word'),
            rightId: z.string().describe('ID of the corresponding meaning/connection')
          })).describe('Array of correct word-meaning pairs using IDs'),
          id: z.string().optional().describe('Optional unique identifier for this exercise')
        }),
        execute: async ({ instructions, leftItems, rightItems, correctPairs, id }) => {
          
          // Validate inputs
          if (!leftItems || !Array.isArray(leftItems) || leftItems.length === 0) {
            console.error('[vocabulary-tutor-v2] ❌ Invalid leftItems in matchingExercise tool:', leftItems);
            throw new Error('Invalid leftItems array provided to matchingExercise tool');
          }
          
          if (!rightItems || !Array.isArray(rightItems) || rightItems.length === 0) {
            console.error('[vocabulary-tutor-v2] ❌ Invalid rightItems in matchingExercise tool:', rightItems);
            throw new Error('Invalid rightItems array provided to matchingExercise tool');
          }
          
          if (leftItems.length !== rightItems.length) {
            console.error('[vocabulary-tutor-v2] ❌ Mismatched array lengths in matchingExercise tool:', {
              leftItemsLength: leftItems.length,
              rightItemsLength: rightItems.length
            });
            throw new Error(`Mismatched array lengths: leftItems has ${leftItems.length} items, rightItems has ${rightItems.length} items`);
          }
          
          if (!correctPairs || !Array.isArray(correctPairs) || correctPairs.length === 0) {
            console.error('[vocabulary-tutor-v2] ❌ Invalid correctPairs in matchingExercise tool:', correctPairs);
            throw new Error('Invalid correctPairs array provided to matchingExercise tool');
          }
          
          // Validate that all IDs in correctPairs exist in leftItems and rightItems
          const leftIds = new Set(leftItems.map(item => item.id));
          const rightIds = new Set(rightItems.map(item => item.id));
          
          for (const pair of correctPairs) {
            if (!leftIds.has(pair.leftId)) {
              throw new Error(`Left ID "${pair.leftId}" not found in leftItems`);
            }
            if (!rightIds.has(pair.rightId)) {
              throw new Error(`Right ID "${pair.rightId}" not found in rightItems`);
            }
          }
          
          // Generate simple ID if not provided
          const exerciseId = id || 'matching-exercise';
          
          const result = { 
            instructions, 
            leftItems, 
            rightItems, 
            correctPairs,
            id: exerciseId
          };
          
          return result;
        },
      }),
      
      multipleChoice: tool({
        description: 'Create vocabulary multiple choice questions for SINGLE WORD comprehension. Use when testing situations, examples, or meaning of ONE specific word (e.g., "Which situation shows geduldig?" with 4 situations).',
        inputSchema: z.object({
          question: z.string().describe('Vocabulary question with context (e.g., "In a German restaurant, what would you ask for if you want water?")'),
          options: z.array(z.string()).describe('Multiple choice answers with realistic distractors'),
          correctIndex: z.number().describe('Index of the correct answer'),
          id: z.string().optional().describe('Optional unique identifier for this exercise')
        }),
        execute: async ({ question, options, correctIndex, id }) => {
          
          // Validate inputs
          if (!options || !Array.isArray(options) || options.length === 0) {
            console.error('[vocabulary-tutor-v2] ❌ Invalid options in multipleChoice tool:', {
              options,
              optionsType: typeof options,
              isArray: Array.isArray(options)
            });
            throw new Error('Invalid options array provided to multipleChoice tool');
          }
          
          if (correctIndex < 0 || correctIndex >= options.length) {
            console.error('[vocabulary-tutor-v2] ❌ Invalid correctIndex in multipleChoice tool:', {
              correctIndex,
              optionsLength: options.length
            });
            throw new Error(`Invalid correctIndex ${correctIndex} for options array of length ${options.length}`);
          }
          
          // Generate missing props that the frontend expects
          const correctAnswer = options[correctIndex];
          const exerciseId = id || 'multiple-choice-exercise';
          
          const result = { 
            question, 
            options, 
            correctIndex, 
            correctAnswer,
            id: exerciseId
          };
          return result;
        },
      }),
      
      table: tool({
        description: 'Create vocabulary overview tables with German words and English translations. Add cultural context only when relevant. Keep captions natural - avoid "batch" or technical terms.',
        inputSchema: z.object({
          headers: z.array(z.string()).describe('Column headers (e.g., ["German", "English"] or ["German", "English", "Source"])'),
          rows: z.array(z.array(z.string())).describe('Data rows with vocabulary information'),
          caption: z.string().optional().describe('Optional natural caption (e.g., "Your Vocabulary Collection" or "Today\'s Words")'),
          followUpText: z.string().optional().describe('Optional follow-up text to engage the learner after the table')
        }),
        execute: async ({ headers, rows, caption, followUpText }) => {
          return {
            headers,
            rows,
            caption,
            followUpText
          };
        },
      }),
      
      sentenceBuilder: tool({
        description: 'Create a sentence reordering exercise where learners arrange words to form correct German sentences. IMPORTANT: Always provide German sentences only - never use English sentences. Use for practicing German word order, sentence structure, and vocabulary in context.',
        inputSchema: z.object({
          words: z.array(z.string()).describe('Array of GERMAN words to be arranged into a proper German sentence'),
          correctSentence: z.string().describe('The correct GERMAN sentence when words are properly arranged - must be in German only'),
          hint: z.string().optional().describe('Optional hint about German grammar or word order (can be in English for clarity)'),
          translation: z.string().optional().describe('Optional English translation of the correct German sentence'),
          id: z.string().optional().describe('Optional unique identifier for this exercise')
        }),
        execute: async ({ words, correctSentence, hint, translation, id }) => {
          
          // Validate inputs
          if (!words || !Array.isArray(words) || words.length === 0) {
            console.error('[vocabulary-tutor-v2] ❌ Invalid words in sentenceReordering tool:', words);
            throw new Error('Invalid words array provided to sentenceReordering tool');
          }
          
          if (!correctSentence || typeof correctSentence !== 'string') {
            console.error('[vocabulary-tutor-v2] ❌ Invalid correctSentence in sentenceReordering tool:', correctSentence);
            throw new Error('Invalid correctSentence provided to sentenceReordering tool');
          }
          
          // Generate the correctOrder array by matching words to the correct sentence
          const correctWords = correctSentence.split(' ');
          const correctOrder: number[] = [];
          
          // For each position in the correct sentence, find the corresponding word index
          for (let i = 0; i < correctWords.length; i++) {
            const correctWord = correctWords[i];
            const wordIndex = words.findIndex(word => 
              word.toLowerCase().replace(/[.,!?;:]/, '') === correctWord.toLowerCase().replace(/[.,!?;:]/, '')
            );
            if (wordIndex !== -1) {
              correctOrder.push(wordIndex);
            }
          }
          
          // Validate that we found all words
          if (correctOrder.length !== words.length) {
            console.warn('[vocabulary-tutor-v2] ⚠️ Word count mismatch in sentenceReordering:', {
              wordsLength: words.length,
              correctOrderLength: correctOrder.length,
              words,
              correctSentence,
              correctOrder
            });
          }
          
          // Generate unique ID if not provided
          const exerciseId = id || 'sentence-builder-exercise';
          
          const result = {
            words,
            correctSentence,
            hint: hint || undefined, // Single hint as expected by SentenceBuilder
            id: exerciseId
          };
          
          return result;
        },
      }),
    },
  });

  
  // Simple approach: Let the stream complete naturally
  // The frontend will handle saving the complete message
  if (sessionId) {
    // Add session ID to headers so frontend can use it
    const response = result.toUIMessageStreamResponse();
    response.headers.set('X-Session-ID', sessionId);
    return response;
  }
  
  return result.toUIMessageStreamResponse();
}