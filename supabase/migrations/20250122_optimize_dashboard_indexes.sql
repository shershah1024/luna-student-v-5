-- Optimization indexes for dashboard queries
-- These indexes will dramatically improve the dashboard performance

-- Index for user progress queries (most frequently accessed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_lesson_progress_user_accessed 
ON user_lesson_progress_clean(user_id, last_accessed_at DESC);

-- Composite indexes for score tables with course filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_scores_user_course_perf
ON reading_scores(user_id, course) INCLUDE (percentage, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listening_scores_user_course_perf
ON listening_scores(user_id, course) INCLUDE (percentage, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_writing_scores_user_course_perf
ON writing_scores(user_id, course) INCLUDE (percentage, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speaking_scores_user_course_perf
ON speaking_scores(user_id, course) INCLUDE (percentage, created_at);

-- Index for user goals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_goals_user_course
ON user_goals(user_id, course_id);

-- Index for course exercises
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_exercise_status_course_status
ON course_exercise_status(course_name, status);

-- Index for vocabulary
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_vocabulary_user_status
ON user_vocabulary(user_id) INCLUDE (learning_status);

-- Indexes for test counting (exam_id uniqueness)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_tests_course_exam
ON reading_tests(course) INCLUDE (exam_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listening_tests_course_exam
ON listening_tests(course) INCLUDE (exam_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_writing_tests_course_exam
ON writing_tests(course) INCLUDE (exam_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_speaking_tests_course_exam
ON speaking_tests(course) INCLUDE (exam_id);

-- GIN index for JSONB array operations on sections_completed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_sections_gin
ON user_lesson_progress_clean USING gin(sections_completed);