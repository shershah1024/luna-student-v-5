-- Migration: Move grammar questions from grammar_tasks.content.questions to task_questions table
-- This ensures consistency with other quiz types (reading, etc.)

-- Migrate existing grammar questions to task_questions table
INSERT INTO task_questions (
  id,
  task_id,
  question_number,
  question_type,
  body,
  answer,
  points,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  gt.task_id,
  (row_number() OVER (PARTITION BY gt.task_id ORDER BY ordinality))::integer as question_number,
  q->>'type' as question_type,
  q::jsonb as body,
  -- Extract correct answer based on question type
  CASE
    WHEN q->>'type' = 'multiple_choice' THEN q->>'correct_answer'
    WHEN q->>'type' = 'checkbox' THEN q->>'correct_answers'
    WHEN q->>'type' = 'true_false' THEN q->>'correct_answer'
    WHEN q->>'type' = 'fill_in_the_blanks' THEN q->>'correct_answer'
    WHEN q->>'type' = 'error_correction' THEN q->>'correct_sentence'
    WHEN q->>'type' = 'sentence_transformation' THEN q->>'correct_answer'
    WHEN q->>'type' = 'verb_conjugation' THEN q->>'correct_answer'
    WHEN q->>'type' = 'word_order' THEN q->>'correct_sentence'
    ELSE NULL
  END as answer,
  COALESCE((q->>'points')::integer, 1) as points,
  jsonb_build_object(
    'explanation', q->>'explanation'
  ) as metadata,
  COALESCE(gt.created_at, NOW()) as created_at,
  COALESCE(gt.updated_at, NOW()) as updated_at
FROM
  grammar_tasks gt,
  jsonb_array_elements(gt.content->'questions') WITH ORDINALITY AS q
WHERE
  gt.content->'questions' IS NOT NULL
  AND jsonb_array_length(gt.content->'questions') > 0
  -- Only migrate if questions don't already exist in task_questions
  AND NOT EXISTS (
    SELECT 1
    FROM task_questions tq
    WHERE tq.task_id = gt.task_id
  );

-- Update grammar_tasks content to remove questions (now in task_questions)
-- Keep only title, instructions, focus_areas, and metadata
UPDATE grammar_tasks
SET content = jsonb_build_object(
  'title', content->'title',
  'instructions', content->'instructions',
  'focus_areas', content->'focus_areas',
  'metadata', content->'metadata'
)
WHERE content->'questions' IS NOT NULL;

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM task_questions
  WHERE task_id IN (SELECT task_id FROM grammar_tasks);

  RAISE NOTICE 'Migration complete: % grammar questions migrated to task_questions table', migrated_count;
END $$;
