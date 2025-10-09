import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type TestType = 'reading' | 'listening' | 'speaking' | 'grammar' | 'writing';

const TABLE_MAP: Record<TestType, string> = {
  reading: 'reading_tests',
  listening: 'listening_tests',
  speaking: 'speaking_tests',
  grammar: 'grammar_tests',
  writing: 'writing_tests'
};

export async function getExamIdFromTestId(testId: string, testType: TestType): Promise<string | null> {
  try {
    const tableName = TABLE_MAP[testType];
    
    // Get all sections for this test_id and find the first one with an exam_id
    const { data, error } = await supabase
      .from(tableName)
      .select('exam_id')
      .eq('test_id', testId)
      .not('exam_id', 'is', null);

    if (error) {
      console.warn(`[ExamLookup] Error fetching exam_id for ${testType} test_id: ${testId}`, error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn(`[ExamLookup] No exam_id found for ${testType} test_id: ${testId}`);
      return null;
    }

    // Return the first non-null exam_id found
    return data[0].exam_id;
  } catch (error) {
    console.error(`[ExamLookup] Unexpected error for ${testType} test_id: ${testId}`, error);
    return null;
  }
}

export async function getExamMetadata(examId: string): Promise<{
  title?: string;
  course?: string;
  description?: string;
} | null> {
  try {
    // Try to get exam metadata from any test table
    const tables = ['reading_tests', 'listening_tests', 'speaking_tests', 'grammar_tests', 'writing_tests'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('course, test_id')
        .eq('exam_id', examId)
        .limit(1)
        .single();

      if (data && !error) {
        return {
          title: `${data.course.toUpperCase()} Exam`,
          course: data.course,
          description: `Complete exam for ${data.course.replace('_', ' ').toUpperCase()}`
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`[ExamLookup] Error fetching exam metadata for exam_id: ${examId}`, error);
    return null;
  }
}