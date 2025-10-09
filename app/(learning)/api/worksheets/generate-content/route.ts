/**
 * Worksheet Content Generation API
 * First stage of worksheet creation - generates educational content using LLM
 * based on teacher's high-level requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAzure } from '@ai-sdk/azure';
import { generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Azure OpenAI configuration
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_OPENAI_API_KEY!,
});

const model = azure('gpt-5-mini');

// Schema for worksheet content
const WorksheetQuestionSchema = z.object({
  number: z.number(),
  question: z.string(),
  answer_space: z.string().optional(),
  answer: z.string(),
  hint: z.string().optional()
});

const WorksheetContentSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  questions: z.array(WorksheetQuestionSchema),
  layout_suggestion: z.enum(['single_column', 'two_column', 'grid']),
  decorative_elements: z.string().optional()
});

// Grade level guidelines for content generation
function getGradeLevelGuidelines(level: string): string {
  switch (level.toUpperCase()) {
    case 'A1':
      return `
        - Use only present tense and very simple sentence structures
        - Vocabulary: basic everyday words (family, colors, numbers 1-20, simple foods)
        - Grammar: subject + verb + object, no subordinate clauses
        - Topics: personal information, daily routines, simple descriptions
        - Keep instructions to 5-7 words maximum
      `;
    case 'A2':
      return `
        - Use present and simple past tense
        - Vocabulary: common everyday situations (shopping, travel, work)
        - Grammar: simple connectors (and, but, because), basic questions
        - Topics: familiar matters, immediate environment, basic personal history
        - Instructions can be 10-12 words
      `;
    case 'B1':
      return `
        - Use present, past, and future tenses
        - Vocabulary: topics of personal interest, work, school, leisure
        - Grammar: subordinate clauses, conditional sentences (if/then)
        - Topics: experiences, events, dreams, ambitions, opinions
        - Clear multi-step instructions allowed
      `;
    case 'B2':
      return `
        - Use all major tenses including perfect forms
        - Vocabulary: abstract concepts, technical terms in familiar areas
        - Grammar: complex sentence structures, passive voice
        - Topics: contemporary issues, advantages/disadvantages, detailed descriptions
        - Detailed instructions with multiple requirements
      `;
    case 'C1':
      return `
        - Use sophisticated grammar and varied sentence structures
        - Vocabulary: wide range including idiomatic expressions
        - Grammar: nuanced expression, implied meanings
        - Topics: complex abstract topics, implicit meanings
        - Complex instructions with subtle requirements
      `;
    case 'C2':
      return `
        - Near-native complexity in all aspects
        - Vocabulary: subtle distinctions, colloquialisms, technical terms
        - Grammar: full range of structures used naturally
        - Topics: any topic with precision and subtlety
        - Sophisticated instructions with nuanced tasks
      `;
    default:
      return 'Use age-appropriate language and concepts.';
  }
}

// Content generators for language-focused worksheet types

function generateVocabularyPrompt(params: any): string {
  const { topic, grade_level, num_questions, language, special_requirements } = params;
  
  return `Create a VISUAL vocabulary EXERCISE worksheet for ${grade_level} level ${language} learners.
    Topic: ${topic}
    Number of EXERCISES: ${Math.min(num_questions, 6)}
    Target language: ${language}
    
    ${getGradeLevelGuidelines(grade_level)}
    
    Create CLEAR EXERCISES with these formats:
    
    Exercise 1-2: MATCHING
    - Format: "1. [Picture of apple] → a) [word1]  b) [word2]  c) [word3]"
    - Student task: Circle the correct word
    
    Exercise 3-4: FILL IN THE BLANK
    - Format: "3. [Picture of cat] C___t" (missing letters)
    - Student task: Complete the word
    
    Exercise 5-6: WRITE THE WORD
    - Format: "5. [Picture of dog] _________" (blank line)
    - Student task: Write the complete word
    
    CRITICAL:
    - Each item MUST be a clear exercise with a specific task
    - Include answer spaces (______ or multiple choice options)
    - Use pictures as prompts, not decorations
    - Keep vocabulary simple and concrete
    ${special_requirements ? `Special requirements: ${special_requirements}` : ''}
    
    Main instruction: "${language} Vocabulary Exercises"
    Sub-instructions per exercise type in ${language} (with translations if needed)`;
}

// Removed non-vocabulary worksheet generators - focusing only on vocabulary

// Format content for DALL-E image generation with EXACT content
function formatForDALLE(content: any): string {
  // Format the exact worksheet content that should appear
  const formatExercises = () => {
    return content.questions.map((q: any) => {
      // Include the exact text and format for each exercise
      let exerciseText = `${q.number}. ${q.question}`;
      
      // Add answer spaces based on question type
      if (q.answer_space) {
        exerciseText += `\n   ${q.answer_space}`;
      } else if (q.question.includes('___')) {
        // Already has blanks
      } else if (q.question.includes('a)') || q.question.includes('b)')) {
        // Multiple choice - already formatted
      } else {
        // Add a default answer line
        exerciseText += '\n   _______________________';
      }
      
      return exerciseText;
    }).slice(0, 8).join('\n\n'); // Limit to 8 exercises for space
  };

  const worksheetContent = `
EXACT WORKSHEET CONTENT TO RENDER:

${content.title}
${'='.repeat(content.title.length)}

${content.instructions}

${formatExercises()}
`;

  // Visual style instructions for vocabulary worksheets
  const styleInstructions = `
VISUAL STYLE REQUIREMENTS:
- Clean, professional educational worksheet design
- Clear, readable fonts (size 14-16pt for questions, 18-20pt for title)
- White background with subtle decorative elements
- Organized layout with numbered exercises
- Clear answer spaces (blank lines, boxes for multiple choice)
- Age-appropriate decorative elements in margins
- Include simple illustrations next to each vocabulary item
- Use colorful but not distracting images
- Picture dictionary style with clear word-image associations
- Visual boxes or sections for each vocabulary group`;

  // Construct the complete DALL-E prompt
  return `Create an educational worksheet with the following EXACT content:

${worksheetContent}

${styleInstructions}

CRITICAL REQUIREMENTS:
1. ALL text content shown above MUST be clearly visible and readable
2. Maintain exact numbering and formatting of exercises
3. Include appropriate blank spaces/lines where indicated with underscores
4. Add helpful visual elements WITHOUT obscuring the exercise text
5. Professional educational worksheet appearance
6. The worksheet should be immediately usable by students

LAYOUT:
- A4 portrait orientation
- Title at top in large, clear font
- Instructions below title in medium font
- Exercises arranged in clear sections
- Adequate white space between exercises
- Decorative elements only in margins or as backgrounds
- All text must be perfectly legible

IMPORTANT: This is a real worksheet that students will complete. Every word of the content above must be clearly readable!`;
}

export async function POST(req: NextRequest) {
  try {
    // Get user ID (with fallback for testing)
    let teacherId: string;
    try {
      const { userId } = await auth();
      teacherId = userId || 'anonymous_teacher';
    } catch {
      teacherId = req.headers.get('x-user-id') || 'anonymous_teacher';
    }

    const body = await req.json();
    const {
      topic,
      grade_level,
      num_questions = 10,
      language = 'English',
      special_requirements,
      task_id // Optional: for updating existing worksheet
    } = body;

    // Validate required fields
    if (!topic || !grade_level) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, grade_level' },
        { status: 400 }
      );
    }
    

    console.log('[Worksheet Content] Generating vocabulary worksheet for:', {
      topic,
      grade_level,
      num_questions,
      language,
      teacherId
    });

    // Generate vocabulary prompt (only type supported)
    const prompt = generateVocabularyPrompt({ topic, grade_level, num_questions, language, special_requirements });

    // Generate structured content using LLM
    console.log('[Worksheet Content] Sending prompt to LLM:', {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 200) + '...'
    });
    
    const { object: worksheetContent } = await generateObject({
      model,
      prompt,
      schema: WorksheetContentSchema,
    });
    
    console.log('[Worksheet Content] LLM Response:', {
      title: worksheetContent.title,
      instructions: worksheetContent.instructions,
      numQuestions: worksheetContent.questions.length,
      layout: worksheetContent.layout_suggestion,
      firstThreeQuestions: worksheetContent.questions.slice(0, 3)
    });

    // Extract answers for answer key
    const answerKey = worksheetContent.questions.map(q => ({
      number: q.number,
      answer: q.answer,
      hint: q.hint
    }));

    // Format content for DALL-E (vocabulary worksheets only)
    const dallePrompt = formatForDALLE(worksheetContent);
    
    console.log('[Worksheet Content] DALL-E Prompt Generated:', {
      promptLength: dallePrompt.length,
      promptPreview: dallePrompt.substring(0, 300) + '...',
      fullPrompt: dallePrompt // Log the full prompt to see exactly what we're sending
    });

    // Save or update in database
    let savedTaskId = task_id;
    
    if (task_id) {
      // Update existing worksheet
      const { error } = await supabase
        .from('worksheet_tasks')
        .update({
          content: worksheetContent,
          answer_key: answerKey,
          dalle_prompt: dallePrompt,
          status: 'preview',
          updated_at: new Date().toISOString(),
          times_regenerated: 1 // Will increment manually if needed
        })
        .eq('task_id', task_id);

      if (error) {
        console.error('[Worksheet Content] Database update error:', error);
        throw error;
      }
    } else {
      // Create new worksheet entry
      const { data, error } = await supabase
        .from('worksheet_tasks')
        .insert({
          teacher_id: teacherId,
          worksheet_type: 'vocabulary',
          topic,
          grade_level,
          num_questions,
          language,
          special_requirements,
          content: worksheetContent,
          answer_key: answerKey,
          dalle_prompt: dallePrompt,
          title: worksheetContent.title,
          status: 'preview'
        })
        .select('task_id')
        .single();

      if (error) {
        console.error('[Worksheet Content] Database insert error:', error);
        throw error;
      }

      savedTaskId = data.task_id;
    }

    console.log('[Worksheet Content] Content generated successfully:', {
      task_id: savedTaskId,
      title: worksheetContent.title,
      num_questions: worksheetContent.questions.length
    });

    return NextResponse.json({
      success: true,
      task_id: savedTaskId,
      worksheet_content: worksheetContent,
      answer_key: answerKey,
      dalle_prompt: dallePrompt,
      message: 'Content generated successfully. Ready for image generation.'
    });

  } catch (error) {
    console.error('[Worksheet Content] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate worksheet content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}