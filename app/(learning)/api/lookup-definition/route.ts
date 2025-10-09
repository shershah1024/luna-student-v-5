import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server';


export const dynamic = "force-dynamic";

/**
 * API handler for looking up word definitions
 * Checks if definition exists in database, otherwise generates it with AI
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requestData = await request.json()
    const { term, context, test_id, task_id, language = 'de' } = requestData // Default to German for backward compatibility

    if (!term) {
      return NextResponse.json({ error: 'Term must be provided' }, { status: 400 })
    }

    if (!test_id && !task_id) {
      return NextResponse.json({ error: 'task_id or test_id must be provided' }, { status: 400 })
    }
    
    // userId is already validated by Clerk auth

    // Query Supabase for existing entry in vocabulary_definitions with specific test_id and language
    const normalizedTerm = term.toLowerCase()

    let definitionQuery = supabase
      .from('vocabulary_definitions')
      .select('id, term, definition')
      .eq('term', normalizedTerm)
      .eq('language', language)

    if (task_id) {
      definitionQuery = definitionQuery.eq('task_id', task_id)
    } else if (test_id) {
      definitionQuery = definitionQuery.eq('test_id', test_id)
    }

    const { data: existingEntry, error } = await definitionQuery.single()

    if (!error && existingEntry) {
      // Check if user already has this term for this specific test_id and language
      let userVocabularyCheck = supabase
        .from('user_vocabulary')
        .select('id')
        .eq('user_id', userId)
        .eq('term', normalizedTerm)

      if (task_id) {
        userVocabularyCheck = userVocabularyCheck.eq('task_id', task_id)
      }

      if (test_id) {
        userVocabularyCheck = userVocabularyCheck.eq('test_id', test_id)
      }

      const { data: existingUserTerm, error: userCheckError } = await userVocabularyCheck.single()

      // Only insert if the term doesn't exist in user vocabulary
      if (!existingUserTerm || userCheckError) {
        const userVocabularyPayload: Record<string, any> = {
          user_id: userId,
          term: normalizedTerm,
          definition: existingEntry.definition,
          language,
          learning_status: 0
        }

        if (task_id) {
          userVocabularyPayload.task_id = task_id
        }

        if (test_id) {
          userVocabularyPayload.test_id = test_id
        }

        const { data: insertedItem, error: insertError } = await supabase
          .from('user_vocabulary')
          .insert({ 
            ...userVocabularyPayload
          })
          .select()

        if (insertError) {
          console.error('[lookupDefinition] Error inserting into user_vocabulary:', insertError)
        }
      }

      return NextResponse.json({ definition: existingEntry.definition })
    }

    // If no existing entry, generate definition using Azure OpenAI Responses API
    console.log('[lookupDefinition] No existing definition found, generating with AI:', {
      term,
      test_id,
      context_length: context?.length || 0
    });

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Azure OpenAI API key is missing');
    }

    const endpoint = `${process.env.AZURE_URL}/openai/responses?api-version=2025-04-01-preview`;
    
    // Adjust prompt based on language
    const languageInstruction = language === 'en' 
      ? `Give a simple 3-word definition or synonym.`
      : `Translate to English in 3 words or less.`;
    
    const userPrompt = `You are a teaching assistant. For the term "${term}", ${languageInstruction} It has to be connected to the following context. Don't give any preface or additional comment. Just the concise explanation. No preface or notes required.\n\nContext:\n${context}\n\nTerm to define:\n${term}`;

    console.log('[lookupDefinition] Making API call to Azure OpenAI:', {
      endpoint,
      model: 'gpt-5-nano',
      max_output_tokens: 500,
      reasoning_effort: 'minimal',
      prompt_length: userPrompt.length
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: userPrompt,
        max_output_tokens: 500,
        model: 'gpt-5-nano',
        reasoning: {
          effort: 'minimal'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[lookupDefinition] Azure OpenAI API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Azure OpenAI API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('[lookupDefinition] Azure OpenAI API response:', {
      status: response.status,
      response_structure: {
        has_output_text: !!data.output_text,
        has_output_array: !!data.output,
        response_status: data.status,
        model: data.model,
        usage: data.usage
      },
      full_response: data
    });

    // Check if response is incomplete due to token limit
    if (data.status === 'incomplete' && data.incomplete_details?.reason === 'max_output_tokens') {
      console.error('[lookupDefinition] Response incomplete due to token limit:', {
        max_output_tokens: data.max_output_tokens,
        output_tokens: data.usage?.output_tokens || 0
      });
      throw new Error('Token limit too low for response generation. Need to increase max_output_tokens.');
    }

    // Azure OpenAI Responses API structure parsing
    let definition;
    
    console.log('[lookupDefinition] Full response data structure:', {
      data_keys: Object.keys(data),
      output_length: data.output?.length,
      output_details: data.output?.map((item: any, index: number) => ({
        index,
        type: item.type,
        keys: Object.keys(item),
        id: item.id,
        content: item.content,
        text: item.text,
        full_item: item
      }))
    });
    
    // The Responses API returns an output array with different content types
    // We need to find the text content and skip reasoning-only responses
    if (data.output && Array.isArray(data.output)) {
      // Look for text content in the output array
      for (const outputItem of data.output) {
        console.log('[lookupDefinition] Processing output item:', {
          type: outputItem.type,
          keys: Object.keys(outputItem),
          content: outputItem.content,
          text: outputItem.text
        });
        
        if (outputItem.type === 'message' && outputItem.content && Array.isArray(outputItem.content)) {
          console.log('[lookupDefinition] Found message with content array:', outputItem.content);
          // Check content array for text
          for (const contentItem of outputItem.content) {
            console.log('[lookupDefinition] Processing content item:', contentItem);
            if ((contentItem.type === 'text' || contentItem.type === 'output_text') && contentItem.text) {
              definition = contentItem.text.trim();
              console.log('[lookupDefinition] Found text in content:', definition);
              break;
            }
          }
        } else if (outputItem.type === 'text' && outputItem.text) {
          // Direct text content
          definition = outputItem.text.trim();
          console.log('[lookupDefinition] Found direct text:', definition);
          break;
        } else if (outputItem.type === 'message' && outputItem.text) {
          // Sometimes message type has direct text property
          definition = outputItem.text.trim();
          console.log('[lookupDefinition] Found message text:', definition);
          break;
        }
        
        if (definition) break;
      }
      
      // If no text found, check if we only have reasoning
      if (!definition) {
        const hasOnlyReasoning = data.output.every((item: any) => item.type === 'reasoning');
        if (hasOnlyReasoning) {
          console.error('[lookupDefinition] Response contains only reasoning, no text output. Increase token limit.');
          throw new Error('No text output generated. Token limit may be too low.');
        }
      }
    } else if (data.output_text) {
      // Fallback to direct output_text if available
      definition = data.output_text.trim();
    }
    
    if (!definition) {
      console.error('[lookupDefinition] No text content found in response:', {
        data_keys: Object.keys(data),
        output_structure: data.output?.map((item: any) => ({ 
          type: item.type, 
          keys: Object.keys(item),
          has_content: !!item.content,
          content_length: item.content?.length,
          full_item: item
        })),
        full_output: data.output
      });
      throw new Error('No text content found in API response');
    }
    
    console.log('[lookupDefinition] Generated definition:', {
        term,
      definition,
      definition_length: definition.length
    });
    
    // Save definition to vocabulary_definitions database
    const definitionPayload: Record<string, any> = {
      term: normalizedTerm,
      definition,
      language,
      context: context?.substring(0, 500)
    }

    if (task_id) {
      definitionPayload.task_id = task_id
    } else if (test_id) {
      definitionPayload.test_id = test_id
    }

    const { error: vocabError } = await supabase
      .from('vocabulary_definitions')
      .insert(definitionPayload)
      .select()

    if (vocabError) {
      console.error('[lookupDefinition] Error saving to vocabulary_definitions:', vocabError)
    } else {
      console.log('[lookupDefinition] Successfully saved definition to vocabulary_definitions');
    }

    // Check if user already has this term for this specific test_id and language
    let newUserVocabularyCheck = supabase
      .from('user_vocabulary')
      .select('id')
      .eq('user_id', userId)
      .eq('term', normalizedTerm)

    if (task_id) {
      newUserVocabularyCheck = newUserVocabularyCheck.eq('task_id', task_id)
    }

    if (test_id) {
      newUserVocabularyCheck = newUserVocabularyCheck.eq('test_id', test_id)
    }

    const { error: userCheckError } = await newUserVocabularyCheck.single()
    
    if (userCheckError) {
      // Term doesn't exist, so add it to user vocabulary
      console.log('[lookupDefinition] Adding term to user vocabulary:', { term, userId, test_id, task_id });

      const userVocabularyPayload: Record<string, any> = {
        user_id: userId,
        term: normalizedTerm,
        definition,
        language,
        learning_status: 0
      }

      if (task_id) {
        userVocabularyPayload.task_id = task_id
      }

      if (test_id) {
        userVocabularyPayload.test_id = test_id
      }

      const { error: userVocabError } = await supabase
        .from('user_vocabulary')
        .insert(userVocabularyPayload)
        .select()

      if (userVocabError) {
        console.error('[lookupDefinition] Error saving to user_vocabulary:', userVocabError)
      } else {
        console.log('[lookupDefinition] Successfully added term to user vocabulary');
      }
    } else {
      console.log('[lookupDefinition] Term already exists in user vocabulary, skipping insert');
    }

    return NextResponse.json({ definition })

  } catch (error) {
    console.error('[lookupDefinition] Caught error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 