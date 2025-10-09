import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';

export const dynamic = "force-dynamic";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('gpt-5-mini');

export async function POST(req: NextRequest) {
  try {
    const { level, language, age_range } = await req.json();
    
    if (!level || !language || !age_range) {
      return NextResponse.json(
        { error: 'Level, language, and age range are required' },
        { status: 400 }
      );
    }

    const prompt = `Generate a creative and engaging story topic for ${language} language learners.

Target audience:
- Age range: ${age_range} years old
- Language level: ${level}

Requirements:
- Specifically appropriate for ${age_range} year olds (interests, themes, complexity)
- Suitable for ${level} language complexity
- Engaging and interesting for this age group
- Encourages creativity and imagination
- Clear and specific enough to guide the story
- Avoid topics that are too childish or too mature for the age range

Return ONLY the topic title, nothing else. For example:
"A Magical Day at the Zoo"
"My Robot Friend"
"The Secret Garden Adventure"`;

    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 50
    });

    const topic = text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present

    return NextResponse.json({ topic });
  } catch (error) {
    console.error('[Generate Story Topic] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate topic' },
      { status: 500 }
    );
  }
}