-- Add performance indexes for dashboard queries
-- These indexes will significantly improve query performance for the dashboard

-- Indexes for user_lesson_progress_clean
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_accessed 
  ON user_lesson_progress_clean(user_id, last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_section 
  ON user_lesson_progress_clean(user_id, current_section_id);

-- Indexes for pronunciation_scores
CREATE INDEX IF NOT EXISTS idx_pronunciation_user_course_date 
  ON pronunciation_scores(user_id, course, completed_at DESC);

-- Indexes for test scores tables
CREATE INDEX IF NOT EXISTS idx_reading_scores_user_course 
  ON reading_scores(user_id, course);

CREATE INDEX IF NOT EXISTS idx_listening_scores_user_course 
  ON listening_scores(user_id, course);

CREATE INDEX IF NOT EXISTS idx_writing_scores_user_course 
  ON writing_scores(user_id, course);

CREATE INDEX IF NOT EXISTS idx_speaking_scores_user_course 
  ON speaking_scores(user_id, course);

-- Index for pronunciation_audio
CREATE INDEX IF NOT EXISTS idx_pronunciation_audio_word 
  ON pronunciation_audio(word);

-- Index for user_vocabulary
CREATE INDEX IF NOT EXISTS idx_user_vocabulary_user_status 
  ON user_vocabulary(user_id, learning_status);

-- Index for user_goals
CREATE INDEX IF NOT EXISTS idx_user_goals_user_course 
  ON user_goals(user_id, course_id);