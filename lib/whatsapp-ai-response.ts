import { createClient } from '@supabase/supabase-js';
import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

export interface WhatsAppAIResponse {
  success: boolean;
  message?: string;
  usage?: any;
  error?: string;
  level?: string;
  sessionId?: string;
}

// Store conversation history per phone number
const conversationHistory = new Map<string, any[]>();
const FIXED_SYSTEM_MESSAGES = 10; // Messages 1-10: Non-removable system messages
const DIALOGUE_WINDOW_SIZE = 50; // Messages 11-60: Rolling dialogue window
const DIALOGUE_CLEANUP_COUNT = 5; // Remove oldest 5 when limit reached
const MAX_TOTAL_MESSAGES = FIXED_SYSTEM_MESSAGES + DIALOGUE_WINDOW_SIZE; // 60 total

// Level-specific system prompts
const LEVEL_PROMPTS = {
  'A1': `You are Luna, a friendly AI German teacher for complete beginners.

**WHATSAPP MESSAGING RULES:**
• KEEP RESPONSES VERY SHORT (max 3-4 lines total)
• Use simple, friendly tone like texting a friend
• NO long explanations or lists
• Focus on ONE concept per message

**A1 TEACHING:**
• Every German word needs (English translation)
• Use only present tense, basic vocabulary
• Break complex ideas into separate short messages
• Example: "Hallo! (Hello!) Wie geht's? (How are you?)"

**MESSAGE FORMAT:**
• 1-2 German phrases with translations
• Maybe 1 quick tip or question
• Keep it conversational and encouraging
• Use emojis sparingly: 😊 👍 ✨

**AVOID:**
• Long paragraphs or bullet points
• Multiple topics in one message  
• Complex grammar explanations
• Overwhelming vocabulary lists`,

  'A2': `You are Luna, a supportive AI German teacher for elementary learners.

**WHATSAPP MESSAGING RULES:**
• KEEP RESPONSES SHORT (max 4-5 lines)
• Focus on practical, everyday German
• NO lengthy grammar explanations

**A2 TEACHING:**
• Use simple German, add English for new/complex words only
• Topics: daily life, shopping, work, hobbies
• Introduce past tense and modal verbs naturally
• Example: "Ich war gestern einkaufen. (I was shopping yesterday) Und du?"

**MESSAGE STYLE:**
• Conversational and natural
• Ask follow-up questions to keep chat flowing
• Give quick, practical tips
• Keep it friendly and encouraging`,

  'B1': `You are Luna, an experienced AI German teacher for intermediate learners.

**WHATSAPP MESSAGING RULES:**
• SHORT responses (max 3-4 lines)
• Primarily German, minimal English explanations
• Keep conversations flowing naturally

**B1 TEACHING:**
• Use more complex German structures naturally
• Topics: opinions, experiences, plans, advice
• Introduce different tenses as needed in context
• Example: "Was denkst du darüber? Ich würde das anders machen."

**MESSAGE STYLE:**
• More like chatting with a German friend
• Challenge with questions and opinions
• Use varied vocabulary and expressions
• Encourage longer German responses`,

  'B2': `You are Luna, a sophisticated AI German teacher for upper-intermediate learners.

**WHATSAPP MESSAGING RULES:**
• BRIEF messages (max 3 lines)
• Exclusively German unless specifically asked
• Natural, educated conversation style

**B2 TEACHING:**
• Discuss abstract concepts, current events, culture
• Use sophisticated vocabulary and structures naturally
• Example: "Wie siehst du die aktuelle Situation? Meiner Meinung nach..."

**MESSAGE STYLE:**
• Intellectual but approachable conversations
• Encourage nuanced discussions
• Challenge with complex topics
• Like texting an educated German colleague`,

  'C1': `You are Luna, an expert AI German teacher for advanced learners.

**WHATSAPP MESSAGING RULES:**
• CONCISE responses (max 2-3 lines)
• Only German (English only if explicitly requested)
• Sophisticated, natural conversation

**C1 TEACHING:**
• Specialized topics, philosophy, literature, professional contexts
• Expect near-native German fluency
• Example: "Interessante Perspektive! Inwiefern beeinflusst das Ihre Sichtweise?"

**MESSAGE STYLE:**
• Like chatting with a native German intellectual
• Complex vocabulary and subtle expressions
• Challenge with abstract concepts
• Expect sophisticated German responses`
};

function getLevelFromCourse(courseId: string): string {
  const level = courseId.match(/[abc][12]/i)?.[0]?.toUpperCase();
  return level || 'A1';
}

export async function generateWhatsAppAIResponse(
  userMessage: string,
  phoneNumber: string
): Promise<WhatsAppAIResponse> {
  try {
    console.log('[WhatsApp AI Enhanced] 📱 Starting response generation:', {
      userMessage: userMessage.substring(0, 50) + '...',
      phoneNumber: phoneNumber
    });
    
    // Get user's enrollment to determine their level
    let userLevel = 'A1';
    let enrollmentCourse = null;
    
    if (phoneNumber) {
      const { data: enrollment } = await supabase
        .from('user_enrollments')
        .select('course_id')
        .eq('user_id', phoneNumber)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .single();

      if (enrollment?.course_id) {
        userLevel = getLevelFromCourse(enrollment.course_id);
        enrollmentCourse = enrollment.course_id;
        console.log(`[WhatsApp AI Enhanced] User ${phoneNumber} enrolled in ${enrollment.course_id}, using level ${userLevel}`);
      }
    }
    
    // Get conversation history from database first, fallback to memory
    let messages = await getConversationHistoryFromDatabase(phoneNumber);
    
    // If no database history, check memory storage
    if (messages.length === 0) {
      messages = conversationHistory.get(phoneNumber) || [];
    }
    
    // Add the new user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Trim history using the new system: keep fixed system messages + dialogue window
    if (messages.length > MAX_TOTAL_MESSAGES) {
      console.log('[WhatsApp AI Enhanced] ✂️ Trimming in-memory conversation history:', {
        currentLength: messages.length,
        maxAllowed: MAX_TOTAL_MESSAGES
      });
      
      // Keep first 10 messages (system messages) + most recent dialogue messages
      const systemMessages = messages.slice(0, FIXED_SYSTEM_MESSAGES);
      const dialogueMessages = messages.slice(FIXED_SYSTEM_MESSAGES);
      
      // Keep only the most recent dialogue messages that fit in the window
      const trimmedDialogue = dialogueMessages.slice(-(DIALOGUE_WINDOW_SIZE));
      
      messages = [...systemMessages, ...trimmedDialogue];
      
      console.log('[WhatsApp AI Enhanced] ✅ Memory history trimmed to:', {
        systemMessages: systemMessages.length,
        dialogueMessages: trimmedDialogue.length,
        totalMessages: messages.length
      });
    }
    
    // Prepare system prompt
    const systemPrompt = LEVEL_PROMPTS[userLevel as keyof typeof LEVEL_PROMPTS] || LEVEL_PROMPTS['A1'];
    
    console.log(`[WhatsApp AI Enhanced] 🌐 Making request to Azure OpenAI for ${userLevel} level`);

    // Use AI SDK instead of direct API call
    const result = await generateText({
      model: azure('gpt-5-mini'),
      system: systemPrompt + `\n\n**IMPORTANT**: You are currently teaching at ${userLevel} level. Adapt all responses accordingly.`,
      messages,
      temperature: 0.7
    });

    const aiMessage = result.text;
    
    if (!aiMessage) {
      console.error('[WhatsApp AI Enhanced] ❌ No message in response:', result);
      return {
        success: false,
        error: 'No message received from AI'
      };
    }
    
    // Add assistant response to history
    messages.push({
      role: 'assistant',
      content: aiMessage
    });
    
    // Update stored history
    conversationHistory.set(phoneNumber, messages);
    
    // Save to database
    await saveConversationToDatabase(phoneNumber, userMessage, aiMessage, userLevel, enrollmentCourse);
    
    console.log('[WhatsApp AI Enhanced] ✅ Response generated:', {
      responseLength: aiMessage.length,
      level: userLevel,
      preview: aiMessage.substring(0, 100) + '...'
    });

    return {
      success: true,
      message: aiMessage,
      usage: result.usage,
      level: userLevel,
      sessionId: result.response?.id
    };
  } catch (error) {
    console.error('[WhatsApp AI Enhanced] ❌ Fatal Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      phoneNumber: phoneNumber,
      userMessage: userMessage.substring(0, 100)
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getConversationHistoryFromDatabase(phoneNumber: string): Promise<any[]> {
  try {
    const taskId = `whatsapp_${phoneNumber}`;
    
    const { data, error } = await supabase
      .from('task_conversation_logs')
      .select('role, message, turn_index, created_at, payload')
      .eq('task_id', taskId)
      .eq('conversation_id', taskId)
      .order('turn_index', { ascending: true })
      .limit(MAX_TOTAL_MESSAGES); // Get up to 60 messages
    
    if (error) {
      console.error('[WhatsApp AI Enhanced] ❌ Failed to get conversation history:', error);
      return [];
    }
    
    console.log('[WhatsApp AI Enhanced] 📚 Retrieved conversation history from database:', {
      phoneNumber,
      messageCount: data?.length || 0,
      breakdown: {
        systemMessages: data?.filter(m => (m.message_index || 0) <= FIXED_SYSTEM_MESSAGES).length || 0,
        dialogueMessages: data?.filter(m => (m.message_index || 0) > FIXED_SYSTEM_MESSAGES).length || 0
      }
    });
    
    return data?.map(msg => ({
      role: msg.role,
      content: msg.message,
      messageIndex: msg.turn_index,
      payload: msg.payload
    })) || [];
  } catch (error) {
    console.error('[WhatsApp AI Enhanced] ❌ Database history retrieval error:', error);
    return [];
  }
}

async function manageConversationHistory(phoneNumber: string): Promise<number> {
  try {
    const taskId = `whatsapp_${phoneNumber}`;
    
    // Get current message count
    const { count } = await supabase
      .from('task_conversation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId)
      .eq('conversation_id', taskId);
    
    const currentCount = count || 0;
    
    // If we're at or over the limit, clean up dialogue messages
    if (currentCount >= MAX_TOTAL_MESSAGES) {
      console.log('[WhatsApp AI Enhanced] 🧹 Cleaning up conversation history:', {
        phoneNumber,
        currentCount,
        limit: MAX_TOTAL_MESSAGES
      });
      
      // Delete the oldest dialogue messages (messages 11-15 range)
      const { error: deleteError } = await supabase
        .from('task_conversation_logs')
        .delete()
        .eq('task_id', taskId)
        .eq('conversation_id', taskId)
        .gt('turn_index', FIXED_SYSTEM_MESSAGES) // Only dialogue messages
        .lte('turn_index', FIXED_SYSTEM_MESSAGES + DIALOGUE_CLEANUP_COUNT); // Remove 11-15
      
      if (deleteError) {
        console.error('[WhatsApp AI Enhanced] ❌ History cleanup error:', deleteError);
        return currentCount;
      }
      
      // Reindex remaining dialogue messages to maintain sequence
      const { data: remainingMessages } = await supabase
        .from('task_conversation_logs')
        .select('id, turn_index')
        .eq('task_id', taskId)
        .eq('conversation_id', taskId)
        .gt('turn_index', FIXED_SYSTEM_MESSAGES)
        .order('turn_index', { ascending: true });
      
      if (remainingMessages && remainingMessages.length > 0) {
        // Update indices for remaining dialogue messages
        for (let i = 0; i < remainingMessages.length; i++) {
          const newIndex = FIXED_SYSTEM_MESSAGES + 1 + i;
          await supabase
            .from('task_conversation_logs')
            .update({ turn_index: newIndex })
            .eq('id', remainingMessages[i].id);
        }
      }
      
      console.log('[WhatsApp AI Enhanced] ✅ History cleanup completed');
      return currentCount - DIALOGUE_CLEANUP_COUNT;
    }
    
    return currentCount;
  } catch (error) {
    console.error('[WhatsApp AI Enhanced] ❌ History management error:', error);
    return 0;
  }
}

async function saveConversationToDatabase(
  phoneNumber: string, 
  userMessage: string, 
  aiMessage: string, 
  userLevel: string, 
  enrollmentCourse: string | null
) {
  try {
    const taskId = `whatsapp_${phoneNumber}`;
    const userId = `whatsapp_${phoneNumber}`;
    
    console.log('[WhatsApp AI Enhanced] 💾 Saving conversation to task_conversation_logs:', {
      taskId,
      userId,
      phoneNumber,
      userLevel,
      enrolledCourse: enrollmentCourse
    });
    
    // Manage conversation history before adding new messages
    const currentMessageCount = await manageConversationHistory(phoneNumber);
    
    // Calculate next message indices
    const userMessageIndex = currentMessageCount + 1;
    const assistantMessageIndex = currentMessageCount + 2;
    
    console.log('[WhatsApp AI Enhanced] 📊 Message indexing:', {
      currentCount: currentMessageCount,
      userIndex: userMessageIndex,
      assistantIndex: assistantMessageIndex,
      isSystemMessage: userMessageIndex <= FIXED_SYSTEM_MESSAGES
    });
    
    // Save user message
    const { error: userError } = await supabase
      .from('task_conversation_logs')
      .insert({
        role: 'user',
        task_id: taskId,
        user_id: userId,
        conversation_id: taskId,
        turn_index: userMessageIndex,
        message: userMessage,
        payload: {
          phone_number: phoneNumber,
          level: userLevel,
          course: enrollmentCourse
        }
      });

    if (userError) {
      console.error('[WhatsApp AI Enhanced] ❌ User message save error:', userError);
      return;
    }

    // Save AI response
    const { error: assistantError } = await supabase
      .from('task_conversation_logs')
      .insert({
        role: 'assistant',
        task_id: taskId,
        user_id: userId,
        conversation_id: taskId,
        turn_index: assistantMessageIndex,
        message: aiMessage,
        payload: {
          phone_number: phoneNumber,
          level: userLevel,
          course: enrollmentCourse
        }
      });

    if (assistantError) {
      console.error('[WhatsApp AI Enhanced] ❌ Assistant message save error:', assistantError);
      return;
    }

    console.log('[WhatsApp AI Enhanced] ✅ Conversation saved successfully to task_conversation_logs');
  } catch (error) {
    console.error('[WhatsApp AI Enhanced] ❌ Database save error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      phoneNumber: phoneNumber
    });
    // Don't throw - conversation should continue even if DB save fails
  }
}

// Helper function to clear conversation history for a phone number
export function clearConversationHistory(phoneNumber: string) {
  conversationHistory.delete(phoneNumber);
  console.log(`[WhatsApp AI Enhanced] 🗑️ Cleared conversation history for ${phoneNumber}`);
}

// Helper function to get conversation history
export function getConversationHistory(phoneNumber: string): any[] {
  return conversationHistory.get(phoneNumber) || [];
}

// Helper function to detect pronunciation requests
export function detectPronunciationRequest(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();
  
  // Common pronunciation request patterns
  const pronunciationPatterns = [
    /(?:how do (?:you )?(?:i )?pronounce|pronunciation (?:of |for )?)([\w\säöüß]+)/i,
    /(?:say|speak|pronounce) ([\w\säöüß]+)/i,
    /(?:audio (?:for |of )?)([\w\säöüß]+)/i,
    /(?:wie spricht man) ([\w\säöüß]+)(?: aus)?/i,
    /aussprache (?:von |für )?([\w\säöüß]+)/i
  ];

  for (const pattern of pronunciationPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      // Extract and clean the word
      const word = match[1].trim().replace(/[?!.]/g, '');
      if (word && word.length > 0 && word.length < 50) { // Reasonable word length
        return word;
      }
    }
  }

  return null;
}

// Helper function to detect grammar check requests
export function detectGrammarRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Grammar check request patterns
  const grammarPatterns = [
    /check.*grammar/i,
    /grammar.*check/i,
    /correct.*german/i,
    /is.*correct/i,
    /fehler.*finden/i, // find errors
    /grammatik.*prüfen/i, // check grammar
    /richtig.*oder.*falsch/i, // correct or wrong
    /korrigier/i, // correct (imperative)
    /stimmt.*das/i // is this correct
  ];

  return grammarPatterns.some(pattern => pattern.test(lowerMessage));
}

// Helper function to check grammar using dedicated endpoint
export async function checkGrammar(message: string, userLevel: string = 'A1', previousMessage?: string): Promise<{ feedback: string; hasCorrection: boolean } | null> {
  try {
    console.log('[WhatsApp Grammar] 📝 Using dedicated grammar correction endpoint for:', message.substring(0, 50) + '...');
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/grammar-correction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: message,
        userLevel: userLevel,
        previousMessage: previousMessage || null
      })
    });

    if (!response.ok) {
      console.error('[WhatsApp Grammar] ❌ Grammar correction failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('[WhatsApp Grammar] ✅ Grammar correction completed:', {
        hasCorrection: data.hasCorrection,
        feedback: data.feedback?.substring(0, 30) + '...'
      });
      return {
        feedback: data.feedback,
        hasCorrection: data.hasCorrection
      };
    } else {
      console.error('[WhatsApp Grammar] ❌ Grammar correction failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('[WhatsApp Grammar] ❌ Grammar correction error:', error);
    return null;
  }
}

// Helper function to explain grammar using dedicated endpoint
export async function explainGrammar(originalMessage: string, correctedMessage?: string, userLevel: string = 'A1'): Promise<{ explanation: string } | null> {
  try {
    console.log('[WhatsApp Grammar Explain] 📚 Using dedicated explanation endpoint for:', originalMessage.substring(0, 50) + '...');
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/grammar-explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: originalMessage,
        correctedMessage: correctedMessage || null,
        userLevel: userLevel
      })
    });

    if (!response.ok) {
      console.error('[WhatsApp Grammar Explain] ❌ Explanation failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('[WhatsApp Grammar Explain] ✅ Explanation generated successfully');
      return {
        explanation: data.explanation
      };
    } else {
      console.error('[WhatsApp Grammar Explain] ❌ Explanation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('[WhatsApp Grammar Explain] ❌ Explanation error:', error);
    return null;
  }
}

// Helper function to generate audio for a word using existing API
export async function generateWordAudio(word: string): Promise<{ audioUrl: string; cached?: boolean } | null> {
  try {
    console.log('[WhatsApp Audio] 🎵 Generating audio for word using existing API:', word);
    
    const response = await fetch(`german.thesmartlanguage.com/api/generate-word-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whatsapp-request': 'true' // Mark this as a WhatsApp request to bypass auth
      },
      body: JSON.stringify({
        word: word,
        language: 'de' // German language
      })
    });

    if (!response.ok) {
      console.error('[WhatsApp Audio] ❌ Audio generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.audioUrl) {
      console.log('[WhatsApp Audio] ✅ Audio generated successfully using existing API');
      return {
        audioUrl: data.audioUrl,
        cached: !!data.cached // Existing API doesn't return cached flag, so we assume it's from cache if it exists
      };
    } else {
      console.error('[WhatsApp Audio] ❌ Audio generation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('[WhatsApp Audio] ❌ Audio generation error:', error);
    return null;
  }
}