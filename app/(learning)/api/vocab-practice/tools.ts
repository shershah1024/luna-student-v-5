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

// Helper function to update word progress in database
async function updateWordProgressInDatabase(userId: string, taskId: string, word: string, newStatus: number) {
  try {
    const { error } = await supabase
      .from('user_vocabulary')
      .update({ 
        learning_status: newStatus
      })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .ilike('term', word);

    if (error) {
      console.error('[VOCAB TOOLS] Database update error:', error);
      return false;
    }
    
    console.log(`[VOCAB TOOLS] Successfully updated ${word} to status ${newStatus}`);
    return true;
  } catch (error) {
    console.error('[VOCAB TOOLS] Database update exception:', error);
    return false;
  }
}

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

    updateWordProgressBackend: tool({
      description: 'Update learning progress for specific German vocabulary words (0-5 scale: 0=not started, 1=introduced, 2=partially learned, 3=well practiced, 4=nearly mastered, 5=mastered)',
      inputSchema: z.object({
        word: z.string().describe('The German word to update progress for'),
        newStatus: z.number().min(0).max(5).describe('New learning status (0-5)'),
        notes: z.string().optional().describe('Optional notes about the learning progress'),
        continue_conversation: z.string().optional().describe('Continue the natural conversation flow after updating progress. This should be your next conversational response to the student - NOT a separate question. Write as if you are naturally continuing to talk to them in the same response (e.g., "Great! Now that you know Hallo, let me tell you about another common greeting..." or "Perfect! Hallo is such a warm way to greet someone. Speaking of greetings, have you heard..."). Make it feel like one flowing conversation.'),
      }),
      execute: async ({ word, newStatus, notes, continue_conversation }) => {
        console.log('[VOCAB TOOLS] updateWordProgressBackend executed:', { word, newStatus, notes, continue_conversation, userId, taskId });
        
        // Get current status before updating
        let previousStatus = 0;
        try {
          const { data: currentData } = await supabase
            .from('user_vocabulary')
            .select('learning_status')
            .eq('user_id', userId)
            .eq('task_id', taskId)
            .ilike('term', word)
            .single();
          
          previousStatus = currentData?.learning_status || 0;
        } catch (error) {
          console.log('[VOCAB TOOLS] No existing record found for word, will use status 0');
        }
        
        // Update the word progress in database
        const updateSuccess = await updateWordProgressInDatabase(userId, taskId, word, newStatus);
        
        return {
          success: updateSuccess,
          word,
          previousStatus,
          newStatus,
          notes,
          continue_conversation,
          timestamp: new Date().toISOString(),
          id: randomUUID(),
        };
      }
    })
  };
}