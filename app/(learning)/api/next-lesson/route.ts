import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map exercise types to lesson page URLs
function getTaskTypeUrl(exerciseType: string, taskId: string): string {
  const typeMapping: { [key: string]: string } = {
    'vocabulary_learning': 'vocabulary',
    'grammar_main': 'grammar',
    'grammar_minor': 'grammar',
    'reading_basic': 'reading',
    'reading_intermediate': 'reading',
    'listening_task': 'listening',
    'writing_task': 'writing',
    'pronunciation_practice': 'pronunciation',
    'speaking_task': 'speaking',
    'chatbot_roleplay': 'chatbot',
    'unit_review': 'review'
  };

  const lessonType = typeMapping[exerciseType] || 'vocabulary'; // default fallback
  return `/lessons/${lessonType}/${taskId}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get('task_id');
    const courseId = 'telc_a1';
    const courseName = 'Telc A1'; // For dashboard usage

    // Handle dashboard usage - get next lesson for user overall
    if (!taskId && (courseId || courseName)) {
      console.log('[NextLesson] Dashboard mode - getting next lesson for user:', user.id, 'course:', courseId || courseName)
      
      const course = 'telc_a1'; // Always use telc_a1 for now
      
      // Get user's completed lessons (if any)
      const { data: completedLessons } = await supabase
        .from('user_lesson_progress_clean')
        .select('task_id')
        .eq('user_id', user.id);

      const completedTaskIds = completedLessons?.map(l => l.task_id) || [];
      console.log('[NextLesson] Found completed lessons:', completedTaskIds.length)

      // Get first lesson and use navigation to find next uncompleted
      const { data: firstLesson, error: firstLessonError } = await supabase
        .from('course_data')
        .select('task_id, chapter_id, exercise_type, lesson_title, chapter_theme, next_lesson_task_id, generated_description')
        .eq('course_name', course)
        .eq('status', 'generated')
        .is('previous_lesson_task_id', null)
        .single();

      if (firstLessonError || !firstLesson) {
        console.error('[NextLesson] Error fetching first lesson:', firstLessonError)
        return NextResponse.json({ error: 'Failed to fetch first lesson' }, { status: 500 });
      }

      // Find first uncompleted lesson by following navigation chain
      let currentLesson = firstLesson;
      let totalLessons = 1;
      
      while (currentLesson && completedTaskIds.includes(currentLesson.task_id)) {
        if (!currentLesson.next_lesson_task_id) {
          // Course completed
          console.log('[NextLesson] No more exercises - course completed')
          return NextResponse.json({ 
            completed: true,
            message: 'Course completed!' 
          });
        }

        const { data: nextLesson, error: nextError } = await supabase
          .from('course_data')
          .select('task_id, chapter_id, exercise_type, lesson_title, chapter_theme, next_lesson_task_id, generated_description')
          .eq('task_id', currentLesson.next_lesson_task_id)
          .single();

        if (nextError || !nextLesson) {
          console.error('[NextLesson] Error fetching next lesson:', nextError)
          break;
        }

        currentLesson = nextLesson;
        totalLessons++;
      }

      if (currentLesson) {
        console.log('[NextLesson] Found next exercise:', currentLesson.task_id)
        return NextResponse.json({
          url: getTaskTypeUrl(currentLesson.exercise_type, currentLesson.task_id),
          title: currentLesson.lesson_title,
          description: currentLesson.generated_description
        });
      } else {
        console.log('[NextLesson] No more exercises - course completed')
        return NextResponse.json({ 
          completed: true,
          message: 'Course completed!' 
        });
      }
    }

    // Handle legacy usage - get next lesson from current task
    if (!taskId || !courseId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get current exercise with navigation data
    const { data: currentExercise, error: currentError } = await supabase
      .from('course_data')
      .select('chapter_id, exercise_type, course_name, next_lesson_task_id, previous_lesson_task_id, lesson_title, chapter_theme')
      .eq('task_id', taskId)
      .single();

    if (currentError || !currentExercise) {
      return NextResponse.json({ error: 'Current exercise not found' }, { status: 404 });
    }

    // Get previous exercise details if available
    let previousExercise = null;
    if (currentExercise.previous_lesson_task_id) {
      const { data: prevData, error: prevError } = await supabase
        .from('course_data')
        .select('task_id, chapter_id, exercise_type, lesson_title')
        .eq('task_id', currentExercise.previous_lesson_task_id)
        .single();
      
      if (!prevError && prevData) {
        previousExercise = prevData;
      }
    }

    // Get next exercise details if available
    let nextExercise = null;
    if (currentExercise.next_lesson_task_id) {
      const { data: nextData, error: nextError } = await supabase
        .from('course_data')
        .select('task_id, chapter_id, exercise_type, lesson_title')
        .eq('task_id', currentExercise.next_lesson_task_id)
        .single();
      
      if (!nextError && nextData) {
        nextExercise = nextData;
      }
    }

    // Get chapter progress information
    const { data: chapterLessons, error: chapterError } = await supabase
      .from('course_data')
      .select('task_id')
      .eq('chapter_id', currentExercise.chapter_id)
      .order('task_id');

    let positionInChapter = 1;
    let totalInChapter = 1;
    let isFirstInChapter = true;
    let isLastInChapter = true;

    if (!chapterError && chapterLessons) {
      totalInChapter = chapterLessons.length;
      const currentIndex = chapterLessons.findIndex(lesson => lesson.task_id === taskId);
      if (currentIndex !== -1) {
        positionInChapter = currentIndex + 1;
        isFirstInChapter = currentIndex === 0;
        isLastInChapter = currentIndex === chapterLessons.length - 1;
      }
    }

    return NextResponse.json({
      current: {
        lesson_title: currentExercise.lesson_title,
        exercise_type: currentExercise.exercise_type,
        chapter_id: currentExercise.chapter_id,
        chapter_title: currentExercise.chapter_theme
      },
      previous: previousExercise ? {
        task_id: previousExercise.task_id,
        lesson_title: previousExercise.lesson_title,
        exercise_type: previousExercise.exercise_type
      } : null,
      next: nextExercise ? {
        task_id: nextExercise.task_id,
        lesson_title: nextExercise.lesson_title,
        exercise_type: nextExercise.exercise_type
      } : null,
      progress: {
        positionInChapter,
        totalInChapter,
        isFirstInChapter,
        isLastInChapter
      },
      course_completed: !currentExercise.next_lesson_task_id
    });

  } catch (error) {
    console.error('Error fetching next lesson:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}