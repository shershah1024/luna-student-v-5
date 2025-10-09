import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChatbotContext {
  instructions: string;
  objective: string;
  theme: string;
  course: string;
  chapter: string;
  task_id: string;
}

/**
 * Maps frontend course IDs to course_data course names
 */
function mapCourseId(courseId: string): string {
  const courseMap: Record<string, string> = {
    'goethe-a1': 'goethe_a1',
    'goethe-a2': 'goethe_a2',
    'goethe-b1': 'goethe_b1',
    'goethe-b2': 'goethe_b2',
    'goethe-c1': 'goethe_c1'
  };
  
  return courseMap[courseId] || courseId;
}

/**
 * Maps lesson numbers to chapter IDs
 */
function mapLessonToChapter(lessonNumber: number): string {
  return `unit_${lessonNumber}`;
}

/**
 * Maps lesson section types to course_data exercise types
 */
function mapSectionToExerciseType(sectionType: string): string {
  const typeMap: Record<string, string> = {
    'grammar_tutor': 'grammar_main',
    'vocabulary_tutor': 'vocabulary_learning',
    'conversation_practice': 'chatbot_roleplay',
    'speaking_task': 'speaking_task',
    'introduction': 'theme_introduction',
    // unit review removed
  };
  
  return typeMap[sectionType] || sectionType;
}

/**
 * Fetches chatbot context from course_data table based on lesson information
 */
export async function fetchChatbotContext(
  courseId: string,
  lessonNumber: number,
  sectionType: string
): Promise<ChatbotContext> {
  try {
    const courseName = mapCourseId(courseId);
    const chapterId = mapLessonToChapter(lessonNumber);
    const exerciseType = mapSectionToExerciseType(sectionType);
    
    console.log(`[fetchChatbotContext] Mapping: ${courseId} → ${courseName}, lesson ${lessonNumber} → ${chapterId}, ${sectionType} → ${exerciseType}`);
    
    const { data, error } = await supabase
      .from('course_data')
      .select('task_id, chatbot_instructions, exercise_objective, chapter_theme, course_name, chapter_id')
      .eq('course_name', courseName)
      .eq('chapter_id', chapterId)
      .eq('exercise_type', exerciseType)
      .single();
      
    if (error) {
      console.error('[fetchChatbotContext] Error fetching context:', error);
      // Return default context if no specific instructions found
      return {
        instructions: `You are helping with a ${sectionType} exercise in ${courseName} lesson ${lessonNumber}.`,
        objective: `Complete the ${sectionType} exercise`,
        theme: `Lesson ${lessonNumber} content`,
        course: courseName,
        chapter: chapterId,
        task_id: `fallback_${courseName}_${chapterId}_${exerciseType}`
      };
    }
    
    console.log(`[fetchChatbotContext] Found context for task_id: ${data.task_id}`);
    
    return {
      instructions: data.chatbot_instructions || `You are helping with a ${sectionType} exercise.`,
      objective: data.exercise_objective || '',
      theme: data.chapter_theme || '',
      course: data.course_name || courseName,
      chapter: data.chapter_id || chapterId,
      task_id: data.task_id
    };
    
  } catch (err) {
    console.error('[fetchChatbotContext] Unexpected error:', err);
    return {
      instructions: `You are helping with a ${sectionType} exercise in ${courseId} lesson ${lessonNumber}.`,
      objective: `Complete the ${sectionType} exercise`,
      theme: `Lesson ${lessonNumber} content`,
      course: courseId,
      chapter: `unit_${lessonNumber}`,
      task_id: `error_${courseId}_${lessonNumber}_${sectionType}`
    };
  }
}

/**
 * Fetches chatbot context directly by task_id - EXPECTS vocabulary to be initialized first
 * This function assumes vocabulary initialization has been completed by the frontend
 */
export async function fetchChatbotContextByTaskId(
  taskId: string,
  userId?: string
): Promise<ChatbotContext & { currentWords?: any[] }> {
  try {
    console.log('[fetchChatbotContextByTaskId] 🔍 Fetching vocabulary for task_id:', taskId, 'user:', userId);
    
    let currentWords: any[] = [];
    let vocabInstructions = '';
    
    // ALWAYS fetch from user table - vocabulary should be initialized by now
    if (userId) {
      console.log('[fetchChatbotContextByTaskId] 📊 Fetching user vocabulary from user_vocabulary...');
      const { data: userVocabData, error: userVocabError } = await supabase
        .from('user_vocabulary')
        .select('id, term, definition, learning_status, created_at')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (userVocabError) {
        console.error('[fetchChatbotContextByTaskId] ❌ Error fetching user vocabulary:', userVocabError);
        return {
          instructions: 'You are Luna, an AI German vocabulary tutor.',
          objective: 'Please initialize vocabulary first by calling the vocabulary initialization API',
          theme: 'German Vocabulary Learning',
          course: 'German A1',
          chapter: 'Vocabulary Practice',
          task_id: taskId,
          currentWords: []
        };
      }

      if (userVocabData && userVocabData.length > 0) {
        console.log('[fetchChatbotContextByTaskId] ✅ Found user vocabulary:', userVocabData.length, 'words');
        
        // Use actual user vocabulary records with their IDs and current progress
        currentWords = userVocabData.map((record: any) => ({
          id: record.id, // Critical: Database record ID for updates
          term: record.term,
          definition: record.definition || '',
          learning_status: parseInt(record.learning_status || '0'),
          created_at: record.created_at
        }));
        
        console.log('[fetchChatbotContextByTaskId] 🎯 User vocabulary IDs:', currentWords.map(w => `${w.id}:${w.term}`));
      } else {
        console.log('[fetchChatbotContextByTaskId] ⚠️ No user vocabulary found - needs initialization');
        return {
          instructions: 'You are Luna, an AI German vocabulary tutor.',
          objective: 'Vocabulary needs to be initialized first. Please refresh and try again.',
          theme: 'German Vocabulary Learning',
          course: 'German A1',
          chapter: 'Vocabulary Practice',
          task_id: taskId,
          currentWords: []
        };
      }
    } else {
      console.log('[fetchChatbotContextByTaskId] ⚠️ No userId provided - cannot fetch vocabulary');
      return {
        instructions: 'You are Luna, an AI German vocabulary tutor.',
        objective: 'User authentication required for vocabulary access',
        theme: 'German Vocabulary Learning',
        course: 'German A1',
        chapter: 'Vocabulary Practice',
        task_id: taskId,
        currentWords: []
      };
    }

    // Get vocabulary instructions from lesson data
    try {
      const { data: lessonData } = await supabase
        .from('lesson_vocabulary_list')
        .select('instructions')
        .eq('task_id', taskId)
        .single();
      vocabInstructions = lessonData?.instructions || '';
      console.log('[fetchChatbotContextByTaskId] 📝 Vocabulary instructions:', vocabInstructions || 'None');
    } catch (err) {
      console.log('[fetchChatbotContextByTaskId] No instructions found for task');
    }

    console.log('[fetchChatbotContextByTaskId] 🎯 Final word count:', currentWords.length);
    console.log('[fetchChatbotContextByTaskId] 🗃️ All words have IDs:', currentWords.every(w => w.id));

    // Return vocabulary context - all words should have IDs now
    return {
      instructions: 'You are Luna, an AI German vocabulary tutor helping students learn vocabulary through conversation and interactive exercises.',
      objective: vocabInstructions || 'Learn German vocabulary through interactive exercises',
      theme: 'German Vocabulary Learning',
      course: 'German A1',
      chapter: 'Vocabulary Practice',
      task_id: taskId,
      currentWords: currentWords
    };
    
  } catch (err) {
    console.error('[fetchChatbotContextByTaskId] Unexpected error:', err);
    return {
      instructions: 'You are Luna, an AI German vocabulary tutor.',
      objective: 'Learn German vocabulary',
      theme: 'German Vocabulary Learning',
      course: 'German A1',
      chapter: 'Vocabulary Practice',
      task_id: taskId,
      currentWords: []
    };
  }
}
