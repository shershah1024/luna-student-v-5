import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'


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
        "Listen to the messages on the answering machine. Tick the correct picture.",
      "Hören Sie die kurzen Texte. Wählen Sie zu jeder Frage die richtige Antwort aus.": 
        "Listen to the short texts. Choose the correct answer for each question."
    },
    audio_introduction: {
      "Hallo und herzlich willkommen. Sie hören jetzt drei kurze Telefonnachrichten. Nach jeder Nachricht beantworten Sie zwei Fragen. Sie hören jede Nachricht zweimal. Wählen Sie jeweils das richtige Bild.": 
        "Hello and welcome. You will now hear three short phone messages. After each message you answer two questions. You will hear each message twice. Choose the correct picture in each case.",
      "Sie hören jetzt Nachrichten auf dem Anrufbeantworter. Jede Nachricht hören Sie zweimal.": 
        "You will now hear messages on the answering machine. You will hear each message twice.",
      "Jetzt hören Sie drei Telefon-Nachrichten zum Thema Schule und Bildung. Zu jeder Nachricht hören Sie zwei Fragen. Wählen Sie jeweils das richtige Bild aus.": 
        "Now you will hear three phone messages about school and education. For each message you will hear two questions. Choose the correct picture in each case.",
      "M1: Sie hören jetzt die Telefonnachrichten. Hören Sie genau zu und beantworten Sie die Fragen.": 
        "You will now hear the phone messages. Listen carefully and answer the questions.",
      "Sie hören jetzt kurze Hörtexte. Wählen Sie zu jedem Text die richtige Antwort.": 
        "You will now hear short listening texts. Choose the correct answer for each text."
    }
  },
  goethe_a2: {
    overall_instructions: {
      "Sie hören fünf kurze Texte. Lesen Sie die jeweilige Frage und kreuzen Sie die richtige Antwort an. Jeder Text wird zweimal abgespielt.": 
        "You will hear five short texts. Read each question and tick the correct answer. Each text will be played twice.",
      "Hören Sie fünf kurze Texte. Jeder Text wird zweimal abgespielt. Entscheiden Sie, welche Antwort (a, b oder c) richtig ist.": 
        "Listen to five short texts. Each text will be played twice. Decide which answer (a, b, or c) is correct.",
      "Sie hören fünf kurze Texte zu Alltagssituationen und Terminen. Jeder Text wird zweimal gespielt. Wählen Sie die richtige Antwort auf die jeweilige Frage aus.": 
        "You will hear five short texts about everyday situations and appointments. Each text will be played twice. Choose the correct answer to each question.",
      "Hören Sie ein Gespräch zwischen zwei Personen. Kreuzen Sie die richtige Antwort an.": 
        "Listen to a conversation between two people. Tick the correct answer.",
      "Sie hören einen längeren Text. Lesen Sie die Fragen und wählen Sie die richtige Antwort aus.": 
        "You will hear a longer text. Read the questions and choose the correct answer."
    },
    audio_introduction: {
      "Im Folgenden hören Sie fünf kurze Hörtexte. Bitte hören Sie aufmerksam zu.": 
        "In the following, you will hear five short listening texts. Please listen carefully.",
      "M1: Hören Sie jetzt Teil 1. Sie hören fünf kurze Texte. Zu jedem Text wählen Sie die richtige Antwort. Sie hören die Texte zweimal.": 
        "Now listen to Part 1. You will hear five short texts. For each text, choose the correct answer. You will hear the texts twice.",
      "Hören Sie die folgenden Texte und beantworten Sie die Fragen.": 
        "Listen to the following texts and answer the questions.",
      "Sie hören jetzt ein Gespräch. Beantworten Sie die Fragen dazu.": 
        "You will now hear a conversation. Answer the questions about it.",
      "Hören Sie aufmerksam zu und wählen Sie die richtige Antwort.": 
        "Listen carefully and choose the correct answer."
    }
  }
}

// Function to translate German instructions to English
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
  
  // If no translation found, provide a generic English instruction based on level
  if (courseLevel === 'goethe_a1') {
    if (type === 'overall_instructions') {
      return "Listen to the audio and choose the correct answer for each question."
    } else {
      return "Listen carefully and answer the questions. You will hear each text twice."
    }
  } else if (courseLevel === 'goethe_a2') {
    if (type === 'overall_instructions') {
      return "Listen to the texts and choose the correct answer for each question. Each text will be played twice."
    } else {
      return "Listen carefully to the following texts and answer the questions."
    }
  }
  
  return germanText
}

// Function to process listening test data and convert instructions to English
function processListeningTestData(data: any, course: string) {
  if (!data || !course.startsWith('goethe_a')) return data
  
  // Clone the data to avoid modifying the original
  const processedData = JSON.parse(JSON.stringify(data))
  
  // Translate question_data instructions if they exist
  if (processedData.question_data) {
    if (processedData.question_data.overall_instructions_text) {
      processedData.question_data.overall_instructions_text = translateInstructions(
        processedData.question_data.overall_instructions_text,
        course,
        'overall_instructions'
      )
    }
    
    if (processedData.question_data.audio_introduction_M1) {
      processedData.question_data.audio_introduction_M1 = translateInstructions(
        processedData.question_data.audio_introduction_M1,
        course,
        'audio_introduction'
      )
    }
  }
  
  return processedData
}

export async function GET(
  request: NextRequest,
  { params }: { params: { paperId: string } }
) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const searchParams = request.nextUrl.searchParams
    const section = searchParams.get('section') || '1' // Default to section 1 if not specified
    const course = searchParams.get('course')
    
    console.log(`[API Listening] Request for paperId: ${params.paperId}, section: ${section}, course: ${course}`);
    console.log(`[API Listening] User ID: ${userId}`);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables not set' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Use the listening_tests table for TELC A1 data
    const tableName = 'listening_tests';

    // Fetch the listening paper data
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('test_id', params.paperId)
      .eq('section', parseInt(section));
    
    // Add course filter if provided
    if (course) {
      query = query.eq('course', course);
    }

    const { data, error } = await query.single()
    
    console.log(`[API Listening] Query result - data exists: ${!!data}, error:`, error);
    
    if (error) {
      console.error('[API Listening] Error fetching listening paper:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: `Section ${section} is not available for this test`,
          section_not_found: true 
        }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch listening paper' }, { status: 500 })
    }
    
    if (!data) {
      console.log(`[API Listening] No data found for paperId: ${params.paperId}, section: ${section}, course: ${course}`);
      
      // Let's also check what papers exist for debugging
      const { data: allPapers } = await supabase
        .from(tableName)
        .select("test_id, course, section")
        .limit(10);
      
      console.log(`[API Listening] Available papers (first 10):`, allPapers?.map(p => `${p.test_id} (${p.course}, section ${p.section})`));
      
      return NextResponse.json({ 
        error: `Section ${section} is not available for this test`,
        section_not_found: true,
        debug: {
          requested: { paperId: params.paperId, section, course },
          availablePapers: allPapers?.slice(0, 5) // Only show first 5 for brevity
        }
      }, { status: 404 })
    }
    
    // Process data to include English instructions for A1 and A2 levels
    const processedData = processListeningTestData(data, course || 'goethe_a1')
    
    return NextResponse.json(processedData)
  } catch (error) {
    console.error(`[API Listening] Error in listening paper API for ${params.paperId}:`, error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
