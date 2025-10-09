import { z } from 'zod';
import { randomUUID } from 'crypto';
import { tool } from 'ai';
import { createClient } from '@supabase/supabase-js';

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
  MASTERED: 5,
} as const;

// Note: Direct database operations have been moved to dedicated API routes
// This improves security and separation of concerns

// Helper function to save conversation message
async function saveConversationMessage(
  conversationId: string,
  userId: string,
  taskId: string,
  role: string,
  content: string,
  toolCalls?: any[],
  toolResults?: any[]
) {
  try {
    const { error } = await supabase.from('conversation_log').insert({
      conversation_id: conversationId,
      user_id: userId,
      task_id: taskId,
      role: role,
      message_content: content,
      tool_calls: toolCalls ? JSON.stringify(toolCalls) : null,
      tool_results: toolResults ? JSON.stringify(toolResults) : null,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('[VOCAB TOOLS] Conversation logging error:', error);
    }
  } catch (error) {
    console.error('[VOCAB TOOLS] Conversation logging exception:', error);
  }
}

/**
 * Creates vocabulary learning tools for the German tutor
 * These tools include real database integration and conversation logging
 */
export function createVocabularyTools(userId: string, taskId: string) {
  return {
    fillInTheBlanks: tool({
      description: 'Create a fill-in-the-blanks exercise to test German vocabulary recall (Stage 3 tool)',
      inputSchema: z.object({
        sentence: z.string().describe('The sentence with blanks marked as _____'),
        correctAnswer: z.string().describe('The German word that goes in the blank'),
        hint: z.string().optional().describe('Optional hint about the word'),
        englishTranslation: z.string().optional().describe('English translation of the complete sentence'),
      }),
      execute: async ({ sentence, correctAnswer, hint, englishTranslation }) => {
        console.log('[VOCAB TOOLS] fillInTheBlanks executed:', { sentence, correctAnswer, hint, englishTranslation });
        
        // Validate that sentence contains blank
        if (!sentence.includes('_____')) {
          console.error('[VOCAB TOOLS] Sentence must contain _____ for blank');
          throw new Error('Sentence must contain _____ to mark the blank');
        }
        
        return {
          sentence,
          correctAnswer,
          hint,
          englishTranslation,
          id: randomUUID(),
        };
      }
    }),

    matchingExercise: tool({
      description: 'Create a matching exercise connecting German words with English meanings',
      inputSchema: z.object({
        leftItems: z.array(z.object({
          id: z.string(),
          text: z.string()
        })).describe('Array of left side items'),
        rightItems: z.array(z.object({
          id: z.string(),
          text: z.string()
        })).describe('Array of right side items'),
        correctPairs: z.array(z.object({
          leftId: z.string(),
          rightId: z.string()
        })).describe('Array of correct pairs'),
        instructions: z.string().describe('Instructions for the exercise'),
      }),
      execute: async ({ leftItems, rightItems, correctPairs, instructions }) => {
        console.log('[VOCAB TOOLS] matchingExercise executed:', { leftItems, rightItems, correctPairs, instructions });
        
        // Validate equal number of items
        if (leftItems.length !== rightItems.length) {
          console.error('[VOCAB TOOLS] Unequal items:', leftItems.length, '!==', rightItems.length);
          throw new Error('Left and right items must have equal length for matching exercise');
        }
        
        // Validate correct pairs reference valid IDs
        const leftIds = new Set(leftItems.map(item => item.id));
        const rightIds = new Set(rightItems.map(item => item.id));
        
        for (const pair of correctPairs) {
          if (!leftIds.has(pair.leftId)) {
            console.error('[VOCAB TOOLS] Invalid leftId in pair:', pair.leftId);
            throw new Error(`Invalid leftId ${pair.leftId} in correct pairs`);
          }
          if (!rightIds.has(pair.rightId)) {
            console.error('[VOCAB TOOLS] Invalid rightId in pair:', pair.rightId);
            throw new Error(`Invalid rightId ${pair.rightId} in correct pairs`);
          }
        }
        
        return {
          leftItems,
          rightItems,
          correctPairs,
          instructions,
          id: randomUUID(),
        };
      }
    }),

    pronunciationExercise: tool({
      description: 'Create a pronunciation practice exercise for German words',
      inputSchema: z.object({
        word: z.string().describe('The German word to practice'),
        phonetic: z.string().describe('Phonetic pronunciation guide'),
        explanation: z.string().describe('Explanation or tips for pronunciation'),
        meaning: z.string().describe('English meaning of the word'),
      }),
      execute: async ({ word, phonetic, explanation, meaning }) => {
        console.log('[VOCAB TOOLS] pronunciationExercise executed:', { word, phonetic, explanation, meaning });
        return {
          word,
          phonetic,
          explanation,
          meaning,
          id: randomUUID(),
        };
      }
    }),

    sentenceBuilder: tool({
      description: 'Create a sentence building exercise where students arrange German words in correct order',
      inputSchema: z.object({
        instructions: z.string().describe('Instructions for the exercise'),
        germanWords: z.array(z.string()).min(2).describe('Array of German words for building the sentence (will be shuffled)'),
        englishTranslation: z.string().optional().describe('English translation of the correct sentence'),
      }),
      execute: async ({ instructions, germanWords, englishTranslation }) => {
        console.log('[VOCAB TOOLS] sentenceBuilder executed:', { instructions, germanWords, englishTranslation });
        
        // Validate minimum words
        if (germanWords.length < 2) {
          console.error('[VOCAB TOOLS] Too few words for sentence builder:', germanWords.length);
          throw new Error('Sentence builder requires at least 2 words');
        }
        
        // Validate no empty words
        if (germanWords.some(word => !word || word.trim() === '')) {
          console.error('[VOCAB TOOLS] Empty words found in germanWords:', germanWords);
          throw new Error('All German words must be non-empty');
        }
        
        // Create correct order (0, 1, 2, etc.) before shuffling
        const correctOrder = germanWords.map((_, index) => index);
        
        return {
          instructions,
          germanWords, // Frontend expects this exact property
          correctOrder, // Frontend expects this exact property  
          englishTranslation,
          id: randomUUID(),
        };
      }
    }),

    updateVocabularyProgress: tool({
      description: 'Update learning progress for specific German vocabulary using the vocabulary record ID (0-5 scale: 0=not started, 1=introduced, 2=partially learned, 3=well practiced, 4=nearly mastered, 5=mastered). IMPORTANT: Use the vocabulary ID from the context, not the word text. Always use the USER_ID constant provided in the context. When a word reaches mastery level (status 5), this will check if the overall lesson should be completed (requires 80% of all words to reach mastery).',
      inputSchema: z.object({
        vocabularyId: z.number().describe('The database ID of the vocabulary record (from context)'),
        newStatus: z.number().min(0).max(5).describe('New learning status (0-5)'),
        notes: z.string().optional().describe('Optional notes about the learning progress'),
        courseId: z.string().optional().describe('Course ID for lesson progress tracking (e.g., "goethe-a1")'),
        continue_conversation: z.string().optional().describe('Continue the natural conversation flow after updating progress. This should be your next conversational response to the student - NOT a separate question. Write as if you are naturally continuing to talk to them in the same response (e.g., "Great! Now that you know Hallo, let me tell you about another common greeting..." or "Perfect! Hallo is such a warm way to greet someone. Speaking of greetings, have you heard..."). Make it feel like one flowing conversation.'),
      }),
      execute: async ({ vocabularyId, newStatus, notes, courseId, continue_conversation }) => {
        console.log('=== VOCAB API TOOL CALL START ===');
        console.log('[VOCAB API TOOL] Tool called with parameters:', { 
          vocabularyId, 
          newStatus, 
          notes,
          courseId,
          continue_conversation,
          userId, 
          taskId 
        });
        
        try {
          // Step 1: Call the dedicated API route for vocabulary updates
          console.log('[VOCAB API TOOL] Calling vocabulary update API...');
          const apiUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/vocabulary/update-progress`;
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              vocabularyId,
              newStatus,
              notes,
              userId
            })
          });

          console.log('[VOCAB API TOOL] API response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error('[VOCAB API TOOL] API error response:', errorData);
            
            return {
              success: false,
              error: `API request failed: ${response.status} ${response.statusText}`,
              vocabularyId,
              newStatus,
              notes,
              courseId,
              continue_conversation,
              timestamp: new Date().toISOString(),
              id: randomUUID(),
            };
          }

          const apiResult = await response.json();
          console.log('[VOCAB API TOOL] API success response:', apiResult);

          // Step 2: Update lesson progress only when a word reaches mastery (status 5)
          // The lesson progress API will determine if the overall lesson is complete based on all vocabulary
          let lessonProgressResult = null;
          if (courseId && newStatus >= 5) {
            console.log('[VOCAB API TOOL] Word reached mastery, checking lesson completion status...');
            
            try {
              const progressApiUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/vocabulary/update-lesson-progress`;
              
              const progressResponse = await fetch(progressApiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  taskId: apiResult.taskId,
                  courseId
                })
              });

              if (progressResponse.ok) {
                lessonProgressResult = await progressResponse.json();
                console.log('[VOCAB API TOOL] Lesson progress updated:', lessonProgressResult);
              } else {
                console.log('[VOCAB API TOOL] Lesson progress update failed, continuing with vocab update...');
              }
            } catch (progressError) {
              console.error('[VOCAB API TOOL] Lesson progress update error:', progressError);
              // Don't fail the whole operation if lesson progress update fails
            }
          }

          const result = {
            success: apiResult.success,
            vocabularyId: apiResult.vocabularyId,
            term: apiResult.term,
            taskId: apiResult.taskId,
            previousStatus: apiResult.previousStatus,
            newStatus: apiResult.newStatus,
            notes: notes,
            courseId,
            lessonProgress: lessonProgressResult,
            continue_conversation,
            timestamp: apiResult.timestamp,
            id: randomUUID(),
          };
          
          console.log('[VOCAB API TOOL] Final tool result:', result);
          console.log('=== VOCAB API TOOL CALL END (SUCCESS) ===');
          
          return result;

        } catch (error) {
          console.error('[VOCAB API TOOL] Exception during API call:', error);
          console.error('[VOCAB API TOOL] Exception details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });

          const result = {
            success: false,
            error: `Exception: ${error instanceof Error ? error.message : String(error)}`,
            vocabularyId,
            newStatus,
            notes,
            courseId,
            continue_conversation,
            timestamp: new Date().toISOString(),
            id: randomUUID(),
          };

          console.log('[VOCAB API TOOL] Error result:', result);
          console.log('=== VOCAB API TOOL CALL END (ERROR) ===');
          
          return result;
        }
      }
    })
  };
}