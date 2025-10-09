'use server'

import { supabase } from './supabase'
import { cache } from 'react'

export interface ReadingPaper {
  id: string
  paper_id: string
  instructions: any
  question_paper_url: string | null
  answer_key_url: string | null
  section1_data: any
  section2_data: any
  section3_data: any
  section4_data: any
  section5_data: any
  section6_data: any
  created_at: string
  theme_instructions: any
}

export interface Test {
  id: string
  title: string
  description: string
  duration: number
  total_questions: number
  difficulty: string
  thumbnail: string
  papers: {
    reading?: boolean
    writing?: boolean
    speaking?: boolean
    listening?: boolean
  }
  created_at: string
}

export const fetchReadingPaper = cache(async (paperId: string): Promise<ReadingPaper | null> => {
  console.log('Fetching reading paper with paperId:', paperId)
  
  const { data, error } = await supabase
    .from('igcse_spanish_reading')
    .select('*')
    .eq('paper_id', paperId)
    .single()

  if (error) {
    console.error('Error fetching reading paper:', error)
    throw error
  }

  // Parse JSON strings in section data fields
  if (data) {
    try {
      // Parse instructions if it's a string
      if (typeof data.instructions === 'string') {
        try {
          data.instructions = JSON.parse(data.instructions)
        } catch (e) {
          console.warn('Failed to parse instructions as JSON:', e)
        }
      }

      // Parse each section data if it's a string
      for (let i = 1; i <= 6; i++) {
        const sectionKey = `section${i}_data` as keyof ReadingPaper
        if (typeof data[sectionKey] === 'string') {
          try {
            data[sectionKey] = JSON.parse(data[sectionKey] as string)
          } catch (e) {
            console.warn(`Failed to parse ${sectionKey} as JSON:`, e)
          }
        }
      }

      // Parse theme_instructions if it's a string
      if (typeof data.theme_instructions === 'string' && data.theme_instructions) {
        try {
          data.theme_instructions = JSON.parse(data.theme_instructions)
        } catch (e) {
          console.warn('Failed to parse theme_instructions as JSON:', e)
        }
      }
    } catch (e) {
      console.error('Error parsing JSON data:', e)
    }
  }

  console.log('Fetched and parsed reading paper data:', data)
  return data
})

export const fetchAllTests = cache(async (): Promise<Test[]> => {
  console.log('Fetching all tests')
  
  const { data, error } = await supabase
    .from('igcse_spanish_tests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tests:', error)
    throw error
  }

  console.log(`Fetched ${data?.length || 0} tests`)
  return data || []
})

export const fetchAllReadingEntries = cache(async (): Promise<ReadingPaper[]> => {
  console.log('Fetching all reading entries')
  
  const { data, error } = await supabase
    .from('igcse_spanish_reading')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching all reading entries:', error)
    throw error
  }
  
  console.log(`Fetched ${data?.length || 0} reading entries`)
  
  // Parse JSON strings in section data fields for all entries
  if (data && data.length > 0) {
    data.forEach(entry => {
      try {
        // Parse instructions if it's a string
        if (typeof entry.instructions === 'string') {
          try {
            entry.instructions = JSON.parse(entry.instructions)
          } catch (e) {
            console.warn('Failed to parse instructions as JSON:', e)
          }
        }

        // Parse each section data if it's a string
        for (let i = 1; i <= 6; i++) {
          const sectionKey = `section${i}_data` as keyof ReadingPaper
          if (typeof entry[sectionKey] === 'string') {
            try {
              entry[sectionKey] = JSON.parse(entry[sectionKey] as string)
            } catch (e) {
              console.warn(`Failed to parse ${sectionKey} as JSON:`, e)
            }
          }
        }

        // Parse theme_instructions if it's a string
        if (typeof entry.theme_instructions === 'string' && entry.theme_instructions) {
          try {
            entry.theme_instructions = JSON.parse(entry.theme_instructions)
          } catch (e) {
            console.warn('Failed to parse theme_instructions as JSON:', e)
          }
        }
      } catch (e) {
        console.error('Error parsing JSON data for entry:', entry.id, e)
      }
    })
  }
  
  return data || []
})

export const fetchReadingEntriesByDifficulty = cache(async (difficulty: string): Promise<ReadingPaper[]> => {
  console.log('Fetching reading entries with difficulty:', difficulty)
  
  const { data, error } = await supabase
    .from('igcse_spanish_reading')
    .select('*')
    .eq('difficulty', difficulty)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(`Error fetching reading entries with difficulty ${difficulty}:`, error)
    throw error
  }
  
  console.log(`Fetched ${data?.length || 0} reading entries with difficulty ${difficulty}`)
  
  // Parse JSON strings in section data fields for all entries
  if (data && data.length > 0) {
    data.forEach(entry => {
      try {
        // Parse instructions if it's a string
        if (typeof entry.instructions === 'string') {
          try {
            entry.instructions = JSON.parse(entry.instructions)
          } catch (e) {
            console.warn('Failed to parse instructions as JSON:', e)
          }
        }

        // Parse each section data if it's a string
        for (let i = 1; i <= 6; i++) {
          const sectionKey = `section${i}_data` as keyof ReadingPaper
          if (typeof entry[sectionKey] === 'string') {
            try {
              entry[sectionKey] = JSON.parse(entry[sectionKey] as string)
            } catch (e) {
              console.warn(`Failed to parse ${sectionKey} as JSON:`, e)
            }
          }
        }

        // Parse theme_instructions if it's a string
        if (typeof entry.theme_instructions === 'string' && entry.theme_instructions) {
          try {
            entry.theme_instructions = JSON.parse(entry.theme_instructions)
          } catch (e) {
            console.warn('Failed to parse theme_instructions as JSON:', e)
          }
        }
      } catch (e) {
        console.error('Error parsing JSON data for entry:', entry.id, e)
      }
    })
  }
  
  return data || []
})
