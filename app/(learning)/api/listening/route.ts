import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'


export const dynamic = "force-dynamic";
// English instruction mappings for A1 and A2 levels
const ENGLISH_INSTRUCTIONS = {
  goethe_a1: {
    overall_instructions: {
      "Hören Sie die Nachrichten und ordnen Sie nach jeder Nachricht die richtige Bildoption (a, b oder c) zu.": 
        "Listen to the messages and after each message, match the correct picture option (a, b, or c).",
      "Hören Sie die Nachrichten und kreuzen Sie das richtige Bild an.": 
        "Listen to the messages and tick the correct picture.",
      "Hören Sie die drei Nachrichten zum Thema Schule und Bildung. Zu jeder Nachricht hören Sie zwei Fragen. Wählen Sie das richtige Bild aus.": 
        "Listen to the three messages about school and education. For each message you will hear two questions. Choose the correct picture.",
      "Hören Sie die drei Telefonnachrichten zum Thema Restaurant und Café. Zu jeder Nachricht hören Sie zwei Fragen. Wählen Sie jeweils das richtige Bild aus.": 
        "Listen to the three phone messages about restaurants and cafés. For each message you will hear two questions. Choose the correct picture in each case.",
      "Hören Sie die Nachrichten auf dem Anrufbeantworter. Kreuzen Sie das richtige Bild an.": 
        "Listen to the messages on the answering machine. Tick the correct picture."
    },
    audio_introduction: {
      "Hallo und herzlich willkommen. Sie hören jetzt drei kurze Telefonnachrichten. Nach jeder Nachricht beantworten Sie zwei Fragen. Sie hören jede Nachricht zweimal. Wählen Sie jeweils das richtige Bild.": 
        "Hello and welcome. You will now hear three short phone messages. After each message you answer two questions. You will hear each message twice. Choose the correct picture in each case.",
      "Sie hören jetzt Nachrichten auf dem Anrufbeantworter. Jede Nachricht hören Sie zweimal.": 
        "You will now hear messages on the answering machine. You will hear each message twice.",
      "Jetzt hören Sie drei Telefon-Nachrichten zum Thema Schule und Bildung. Zu jeder Nachricht hören Sie zwei Fragen. Wählen Sie jeweils das richtige Bild aus.": 
        "Now you will hear three phone messages about school and education. For each message you will hear two questions. Choose the correct picture in each case.",
      "M1: Sie hören jetzt die Telefonnachrichten. Hören Sie genau zu und beantworten Sie die Fragen.": 
        "You will now hear the phone messages. Listen carefully and answer the questions."
    }
  },
  goethe_a2: {
    overall_instructions: {
      "Sie hören fünf kurze Texte. Lesen Sie die jeweilige Frage und kreuzen Sie die richtige Antwort an. Jeder Text wird zweimal abgespielt.": 
        "You will hear five short texts. Read each question and tick the correct answer. Each text will be played twice.",
      "Hören Sie fünf kurze Texte. Jeder Text wird zweimal abgespielt. Entscheiden Sie, welche Antwort (a, b oder c) richtig ist.": 
        "Listen to five short texts. Each text will be played twice. Decide which answer (a, b, or c) is correct.",
      "Sie hören fünf kurze Texte zu Alltagssituationen und Terminen. Jeder Text wird zweimal gespielt. Wählen Sie die richtige Antwort auf die jeweilige Frage aus.": 
        "You will hear five short texts about everyday situations and appointments. Each text will be played twice. Choose the correct answer to each question."
    },
    audio_introduction: {
      "Im Folgenden hören Sie fünf kurze Hörtexte. Bitte hören Sie aufmerksam zu.": 
        "In the following, you will hear five short listening texts. Please listen carefully.",
      "M1: Hören Sie jetzt Teil 1. Sie hören fünf kurze Texte. Zu jedem Text wählen Sie die richtige Antwort. Sie hören die Texte zweimal.": 
        "Now listen to Part 1. You will hear five short texts. For each text, choose the correct answer. You will hear the texts twice.",
      "Hören Sie die folgenden Texte und beantworten Sie die Fragen.": 
        "Listen to the following texts and answer the questions."
    }
  }
}

// Function to translate German instructions to English for A1 and A2 levels
function translateInstructions(germanText: string | null, course: string, type: 'overall_instructions' | 'audio_introduction'): string | null {
  if (!germanText || !course.startsWith('goethe_a')) return germanText
  
  const courseLevel = course as 'goethe_a1' | 'goethe_a2'
  const instructionMap = ENGLISH_INSTRUCTIONS[courseLevel]?.[type]
  
  if (!instructionMap) return germanText
  
  // Try exact match first
  if (instructionMap[germanText]) {
    return instructionMap[germanText]
  }
  
  // Try partial matches for variations
  for (const [german, english] of Object.entries(instructionMap)) {
    if (germanText.includes(german) || german.includes(germanText)) {
      return english
    }
  }
  
  // Generic fallback for A1 and A2 levels
  if (courseLevel === 'goethe_a1') {
    return type === 'overall_instructions' 
      ? "Listen to the audio and choose the correct answer for each question."
      : "Listen carefully and answer the questions. You will hear each text twice."
  } else if (courseLevel === 'goethe_a2') {
    return type === 'overall_instructions'
      ? "Listen to the texts and choose the correct answer for each question. Each text will be played twice."
      : "Listen carefully to the following texts and answer the questions."
  }
  
  return germanText
}

// Process listening tests to group by test_id and translate instructions for A1/A2
function processListeningTests(data: any[], course: string = 'goethe_a1') {
  // Create a map to group tests by test_id
  const testMap = new Map()
  
  // Process each item
  data.forEach(item => {
    if (!item.test_id) return
    
    // Process question_data to translate instructions for A1 and A2 levels
    let questionData = item.question_data || {}
    if (course.startsWith('goethe_a')) {
      questionData = { ...questionData }
      
      // Translate overall instructions
      if (questionData.overall_instructions_text) {
        questionData.overall_instructions_text = translateInstructions(
          questionData.overall_instructions_text,
          course,
          'overall_instructions'
        )
      }
      
      // Translate audio introduction
      if (questionData.audio_introduction_M1) {
        questionData.audio_introduction_M1 = translateInstructions(
          questionData.audio_introduction_M1,
          course,
          'audio_introduction'
        )
      }
    }
    
    const sectionTitle = questionData.main_title || `Section ${item.section}`
    
    // If this test_id is not in the map yet, add it
    if (!testMap.has(item.test_id)) {
      testMap.set(item.test_id, {
        test_id: item.test_id,
        title: `Listening Test ${item.test_id}`,
        created_at: item.created_at,
        sections: []
      })
    }
    
    // Add this section to the test
    const test = testMap.get(item.test_id)
    test.sections.push({
      section: item.section,
      title: sectionTitle
    })
  })
  
  // Convert map to array and sort by created_at
  return Array.from(testMap.values())
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  // Check authentication
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Get course parameter from query string
    const { searchParams } = request.nextUrl
    const course = searchParams.get('course')
    
    let query = supabase
      .from('listening_tests')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Add course filter if provided, otherwise default to goethe_a1
    if (course) {
      query = query.eq('course', course)
    } else {
      query = query.eq('course', 'goethe_a1')
    }
    
    const { data, error } = await query
    
    // Process the data to group by test_id and translate instructions for A1/A2
    const processedData = data ? processListeningTests(data, course || 'goethe_a1') : []
    
    if (error) {
      console.error('Error fetching listening papers:', error)
      return NextResponse.json({ error: 'Failed to fetch listening papers' }, { status: 500 })
    }
    
    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error in listening papers API:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
