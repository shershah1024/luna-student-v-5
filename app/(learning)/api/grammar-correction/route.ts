import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';

export const dynamic = "force-dynamic";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userMessage, userLevel = 'A1', previousMessage = null } = await request.json();
    
    if (!userMessage) {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    console.log('[Grammar Correction] 📝 Checking text for level:', userLevel);
    console.log('[Grammar Correction] 📝 Text:', userMessage.substring(0, 100) + '...');

    // Grammar correction system message (following Albert's pattern)
    const grammarSystemMessage = `You are a German grammar correction assistant. Your job is to identify and suggest corrections for German text.

**YOUR TASK:**
1. Analyze the German text for grammar, spelling, and vocabulary errors
2. If there are NO errors, respond with exactly: "None"
3. If there are errors, provide ONLY the corrected version - NO explanations

**CORRECTION FORMAT (only if errors exist):**
- Show ONLY the corrected German text
- Do NOT provide explanations or reasons
- Keep it simple and direct
- Be encouraging with a checkmark

**LEVEL-APPROPRIATE CORRECTIONS:**
- A1/A2: Focus on basic grammar (articles, verb conjugation, word order)
- B1/B2: Include more advanced grammar and vocabulary suggestions
- C1/C2: Focus on style, nuanced grammar, and sophisticated expressions

**EXAMPLES:**
Input: "Ich bin gehen nach Hause"
Output: "✅ Ich gehe nach Hause"

Input: "Hallo, wie geht es dir?"
Output: "None"

Input: "Der Buch ist interessant"
Output: "✅ Das Buch ist interessant"

Input: "Ich sehe der Mann"
Output: "✅ Ich sehe den Mann"

**CRITICAL RULES:**
- Only respond with "None" if the text is grammatically correct
- NEVER provide explanations in the correction
- Only show the corrected German text with checkmark
- Focus on the most important error if multiple exist
- Explanations will be handled separately by /explain command`;

    // Check for grammar errors using GPT-5-nano for focused grammar checking
    const result = await generateText({
      model: azure('gpt-5-nano'),
      system: grammarSystemMessage,
      prompt: `Please check this German text for grammar errors at ${userLevel} level: "${userMessage}"${previousMessage ? `\n\nContext of previous conversation: "${previousMessage}"` : ''}`,
      maxTokens: 150,
      temperature: 0.1  // Lower temperature for more consistent grammar checking
    });

    const correctionResponse = result.text.trim();
    
    // Determine if there was a correction
    const hasCorrection = correctionResponse !== "None" && 
                         !correctionResponse.toLowerCase().includes("none") &&
                         correctionResponse.length > 4;

    console.log('[Grammar Correction] ✅ Correction result:', {
      hasCorrection,
      responseLength: correctionResponse.length,
      response: correctionResponse.substring(0, 50) + '...'
    });

    return NextResponse.json({
      success: true,
      feedback: correctionResponse,
      hasCorrection: hasCorrection,
      originalMessage: userMessage,
      level: userLevel
    });

  } catch (error) {
    console.error('[Grammar Correction] ❌ Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Grammar correction failed' 
      },
      { status: 500 }
    );
  }
}