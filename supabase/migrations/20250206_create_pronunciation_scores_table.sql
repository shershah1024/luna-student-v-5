-- Create pronunciation_scores table
-- Stores individual word pronunciation scores and lesson summaries

CREATE TABLE IF NOT EXISTS pronunciation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  course TEXT DEFAULT 'goethe-a1',
  word TEXT NOT NULL,
  pronunciation_score NUMERIC,
  attempt_id TEXT NOT NULL,
  exercise_type TEXT DEFAULT 'pronunciation_practice',
  word_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index for fast lookups by user and task
CREATE INDEX idx_pronunciation_scores_user_task
  ON pronunciation_scores(user_id, task_id);

-- Index for fast lookups by user, course, and completion date
CREATE INDEX idx_pronunciation_scores_user_course_completed
  ON pronunciation_scores(user_id, course, completed_at DESC);

-- Index for fast lookups by attempt
CREATE INDEX idx_pronunciation_scores_attempt
  ON pronunciation_scores(attempt_id);

-- Enable RLS
ALTER TABLE pronunciation_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pronunciation scores
CREATE POLICY "Users can view own pronunciation scores"
  ON pronunciation_scores
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own pronunciation scores
CREATE POLICY "Users can insert own pronunciation scores"
  ON pronunciation_scores
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own pronunciation scores
CREATE POLICY "Users can update own pronunciation scores"
  ON pronunciation_scores
  FOR UPDATE
  USING (true);
