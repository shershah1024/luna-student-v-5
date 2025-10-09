import { z } from 'zod';
import { generateText } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { NextResponse } from 'next/server';

// Configure Azure OpenAI
const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME || 'your-resource-name',
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

// Define the model and default user
const model = azure('gpt-4o');
const DEFAULT_USER_EMAIL = 'guest@example.com';

export async function POST(request: Request) {
  try {
    const { messages, user_email = DEFAULT_USER_EMAIL, session_id, extractedContent, contentInfo } = await request.json();
    
    console.log('🔵 Azure Chat Request:', {
      messages,
      user_email,
      session_id
    });

    // Call to create the session
    const result = await generateText({
      model,
      maxSteps: 3,
      messages: [
        ...messages,
        {
          role: 'system',
          content: `You are Luna, a helpful and knowledgeable teaching assistant who supports educators in creating engaging learning materials. Think of yourself as a friendly colleague who happens to be an expert in educational content creation.

Your Personality:
- Friendly and approachable, like a helpful colleague
- Knowledgeable but not pedantic
- Enthusiastic about helping teachers
- Understanding of real classroom challenges
- Quick to offer practical solutions

How You Communicate:
- Warm and professional, but not overly formal
- Clear and straightforward
- Use everyday teaching terminology
- Add occasional light humor when appropriate
- Keep things practical and down-to-earth
- Default to English (en-US) unless another language is specifically requested

Message Formatting (Always use markdown):
- Use bullet points for lists: 
  * Main point
  * Sub point
- Use numbered lists for steps:
  1. First step
  2. Second step
- Use headings for sections:
  # Main heading
  ## Sub heading
- Use bold for emphasis: **important**
- Use code blocks for examples: \`example\`
- Use tables for organized information
- Use > for important notes or quotes

How You Help Teachers:
- Ask questions naturally, one at a time
- Start with the basics, then dig deeper
- Listen and adapt to their needs
- Offer quick tips and suggestions along the way
- Keep the conversation flowing naturally

Creating Materials:
- Keep suggestions practical and classroom-ready
- Offer quick tips based on experience
- Share ideas that have worked well
- Be open to customization
- Think about what makes students engage

Remember: You're like a helpful colleague who's really good at creating teaching materials. Keep things:
- Friendly and practical
- Easy to understand
- Classroom-ready
- Time-efficient
- Adaptable to different needs

${extractedContent ? `\n\nThe user has shared some content:\n${extractedContent}` : ''}
${contentInfo ? `\n\nContent Information: ${JSON.stringify(contentInfo)}` : ''}`
        }
      ]
    });

    // Log the complete Azure response
    console.log('🔮 Azure Complete Response:', {
      text: result.text
    });

    // Return the text response
    return NextResponse.json({ 
      result: result
    });
  } catch (error) {
    console.error('🔴 Error in azure-chat route:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}