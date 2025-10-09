import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { extractUniqueWords } from '@/utils/commonWords'

export const dynamic = "force-dynamic"

async function generateDefinitionsInBackground(
  words: string[], 
  test_id: string,
  context: string,
  language: string = 'de'
) {
  // Process in batches of 10 words
  const batchSize = 10
  const batches = []
  
  for (let i = 0; i < words.length; i += batchSize) {
    batches.push(words.slice(i, i + batchSize))
  }
  
  // Process all batches in parallel
  const promises = batches.map(async (batch) => {
    try {
      // Create a single prompt for all words in the batch
      const languageInstruction = language === 'en' 
        ? 'For each word below, provide a simple 3-word definition or synonym.'
        : `For each ${language === 'de' ? 'German' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'foreign'} word below, provide a simple 3-word English translation.`;
      
      const batchPrompt = `You are a teaching assistant. ${languageInstruction} Format: word: definition

Context: ${context}

Words to define:
${batch.join('\n')}

Provide only the definitions in the format specified, no additional text.`

      const apiKey = process.env.AZURE_OPENAI_API_KEY
      if (!apiKey) return
      
      const endpoint = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4.1-mini/chat/completions?api-version=2025-01-01-preview`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: batchPrompt,
            }
          ],
          max_completion_tokens: 500,
          temperature: 0.2,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          model: 'gpt-4.1-mini',
        }),
      })
      
      if (!response.ok) return
      
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ''
      
      // Parse the batch response
      const lines = content.split('\n').filter(line => line.trim())
      const definitions: Record<string, string> = {}
      
      lines.forEach(line => {
        const match = line.match(/^(.+?):\s*(.+)$/)
        if (match) {
          const [_, word, definition] = match
          definitions[word.trim().toLowerCase()] = definition.trim()
        }
      })
      
      // Save each definition to the database
      for (const [word, definition] of Object.entries(definitions)) {
        try {
          await supabase
            .from('vocabulary_definitions')
            .insert({ 
              term: word,
              definition,
              test_id,
              language,
              context: context.substring(0, 500)
            })
            .select()
        } catch (error) {
          // Ignore duplicate key errors
          console.log(`Definition for "${word}" might already exist`)
        }
      }
    } catch (error) {
      console.error('Error processing batch:', error)
    }
  })
  
  // Use Promise.allSettled to continue even if some batches fail
  await Promise.allSettled(promises)
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { text, test_id, user_id, language = 'de' } = await request.json()
    
    if (!text || !test_id) {
      return NextResponse.json({ error: 'text and test_id are required' }, { status: 400 })
    }
    
    // Extract unique words (already filters out common words)
    const wordsToProcess = extractUniqueWords(text, language)
    
    // Check which words already have definitions
    const { data: existingDefinitions } = await supabase
      .from('vocabulary_definitions')
      .select('term')
      .eq('test_id', test_id)
      .eq('language', language)
      .in('term', wordsToProcess)
    
    const existingTerms = new Set(existingDefinitions?.map(d => d.term) || [])
    const missingWords = wordsToProcess.filter(word => !existingTerms.has(word))
    
    // If there are missing words, generate definitions in background
    if (missingWords.length > 0) {
      // Extract a snippet of context around the first occurrence of each word
      const contextSnippet = text.substring(0, 500) + '...'
      
      // Don't await - let it run in background
      generateDefinitionsInBackground(missingWords, test_id, contextSnippet, language)
        .catch(error => console.error('Background generation error:', error))
    }
    
    // Return immediately
    return NextResponse.json({ 
      status: 'processing',
      uniqueWords: wordsToProcess.length,
      existingDefinitions: existingTerms.size,
      toGenerate: missingWords.length
    })
    
  } catch (error) {
    console.error('[preloadDefinitions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}