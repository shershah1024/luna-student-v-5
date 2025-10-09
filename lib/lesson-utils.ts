type TaskRow = {
  id: string
  task_type: string
  title?: string | null
  status: string
  created_at?: string | null
  metadata?: Record<string, any> | null
  parameters?: Record<string, any> | null
}

type LessonDefaults = {
  exerciseType?: string
  courseName?: string
  chapterId?: string
  chapterTitle?: string
  lessonName?: string
  exerciseObjective?: string
  difficultyLevel?: string
  language?: string
}

const DEFAULT_LESSON_NAME = 'Lesson'

export function buildBaseLessonData(taskRow: TaskRow, defaults: LessonDefaults) {
  const metadata = taskRow.metadata || {}
  const parameters = taskRow.parameters || {}

  const courseName =
    metadata.course_name ||
    defaults.courseName ||
    'Teacher Assignment'

  const chapterId =
    metadata.chapter_id ||
    defaults.chapterId ||
    'teacher-assignment'

  const chapterTitle =
    metadata.chapter_title ||
    metadata.chapter_theme ||
    defaults.chapterTitle ||
    taskRow.title ||
    DEFAULT_LESSON_NAME

  const lessonName =
    metadata.lesson_name ||
    defaults.lessonName ||
    taskRow.title ||
    DEFAULT_LESSON_NAME

  const exerciseObjective =
    metadata.exercise_objective ||
    parameters.exercise_objective ||
    defaults.exerciseObjective ||
    `Complete ${taskRow.task_type} activity`

  const difficultyLevel =
    metadata.difficulty_level ||
    metadata.cefr_level ||
    parameters.difficulty_level ||
    defaults.difficultyLevel ||
    'A1'

  const language =
    metadata.language ||
    parameters.language ||
    defaults.language

  return {
    task_id: taskRow.id,
    exercise_type: defaults.exerciseType || taskRow.task_type,
    course_name: courseName,
    chapter_id: chapterId,
    chapter_title: chapterTitle,
    lesson_name: lessonName,
    exercise_objective: exerciseObjective,
    difficulty_level: difficultyLevel,
    status: taskRow.status,
    created_at: taskRow.created_at ?? undefined,
    source: 'tasks' as const,
    next_lesson_task_id: metadata.next_lesson_task_id,
    previous_lesson_task_id: metadata.previous_lesson_task_id,
    language,
  }
}

export function mapTaskQuestions(rows: any[] = []) {
  return rows.map((row) => {
    const body = (row?.body && typeof row.body === 'object') ? row.body : {}

    return {
      id: row.id,
      question_number: row.question_number,
      question_type: row.question_type,
      points: row.points,
      metadata: row.metadata || {},
      answer: row.answer,
      ...body,
    }
  })
}
