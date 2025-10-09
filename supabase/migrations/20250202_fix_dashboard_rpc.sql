-- Fix the dashboard RPC function to properly handle next lesson calculation
CREATE OR REPLACE FUNCTION public.get_dashboard_data_comprehensive(
  p_user_id TEXT,
  p_course_id TEXT,
  p_time_range TEXT DEFAULT 'week',
  p_force_refresh BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_code TEXT;
  v_course_code_alt TEXT;
  v_time_start TIMESTAMP;
  v_result JSONB;
  v_cache_key TEXT;
  v_cached_data JSONB;
  v_next_lesson JSONB;
BEGIN
  -- Normalize course formats
  v_course_code := REPLACE(p_course_id, '-', '_');
  v_course_code_alt := REPLACE(p_course_id, '_', '-');
  
  -- Calculate time range start
  v_time_start := CASE p_time_range
    WHEN 'today' THEN CURRENT_DATE
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    ELSE '1970-01-01'::TIMESTAMP  -- 'all' time
  END;
  
  -- Check cache if not forcing refresh
  IF NOT p_force_refresh THEN
    v_cache_key := FORMAT('dashboard:%s:%s:%s', p_user_id, p_course_id, p_time_range);
    SELECT data INTO v_cached_data 
    FROM dashboard_cache 
    WHERE cache_key = v_cache_key 
      AND expires_at > NOW();
    
    IF v_cached_data IS NOT NULL THEN
      RETURN v_cached_data || jsonb_build_object('cache_hit', true);
    END IF;
  END IF;

  -- Calculate next lesson separately to handle potential errors
  BEGIN
    SELECT jsonb_build_object(
      'lessonId', cd.task_id,
      'taskId', cd.task_id,
      'chapterId', cd.chapter_id,
      'chapterTitle', COALESCE(cd.chapter_theme, cd.chapter_title),
      'exerciseId', cd.exercise_id,
      'exerciseTitle', COALESCE(cd.lesson_title, cd.exercise_objective, 'Continue Learning'),
      'exerciseType', cd.exercise_type,
      'progressInLesson', 0,
      'totalInLesson', 1
    ) INTO v_next_lesson
    FROM course_data cd
    WHERE cd.course_name = v_course_code
      AND cd.status = 'generated'
      AND NOT EXISTS (
        SELECT 1 FROM user_lesson_progress_clean ulp
        WHERE ulp.user_id = p_user_id
          AND ulp.lesson_id = cd.task_id
          AND ulp.sections_completed > 0
      )
    ORDER BY cd.chapter_id, cd.exercise_id
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- If next lesson calculation fails, set to null
      v_next_lesson := NULL;
      RAISE WARNING 'Next lesson calculation failed: %', SQLERRM;
  END;

  -- Main data aggregation using CTEs
  WITH time_boundaries AS (
    SELECT 
      CURRENT_DATE AS today_start,
      CURRENT_DATE - INTERVAL '7 days' AS week_start,
      CURRENT_DATE - INTERVAL '30 days' AS month_start,
      CURRENT_DATE - INTERVAL '1 day' + TIME '00:00:00' AS yesterday_end
  ),
  
  -- Lesson progress aggregation
  lesson_progress AS (
    SELECT 
      COUNT(DISTINCT lesson_id) AS total_completed,
      COUNT(DISTINCT CASE WHEN last_accessed_at >= tb.today_start THEN lesson_id END) AS completed_today,
      COUNT(DISTINCT CASE WHEN last_accessed_at >= tb.week_start THEN lesson_id END) AS completed_week,
      COUNT(DISTINCT CASE WHEN last_accessed_at >= tb.month_start THEN lesson_id END) AS completed_month,
      COUNT(DISTINCT exercise_type) AS unique_exercise_types,
      ARRAY_AGG(DISTINCT exercise_type) FILTER (WHERE exercise_type IS NOT NULL) AS exercise_types,
      COALESCE(SUM(total_time_spent), 0) AS total_time_all,
      COALESCE(SUM(total_time_spent) FILTER (WHERE last_accessed_at >= tb.today_start), 0) AS time_today,
      COALESCE(SUM(total_time_spent) FILTER (WHERE last_accessed_at >= tb.week_start), 0) AS time_week,
      COALESCE(SUM(total_time_spent) FILTER (WHERE last_accessed_at >= tb.month_start), 0) AS time_month,
      MAX(last_accessed_at) AS last_activity,
      COUNT(DISTINCT DATE(last_accessed_at)) FILTER (WHERE last_accessed_at >= tb.month_start) AS active_days_month
    FROM user_lesson_progress_clean ulp
    CROSS JOIN time_boundaries tb
    WHERE ulp.user_id = p_user_id
  ),
  
  -- Test scores aggregation from individual tables
  test_scores AS (
    SELECT 
      -- Reading scores
      (SELECT ROUND(AVG(percentage), 2) FROM reading_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS reading_avg,
      (SELECT COUNT(DISTINCT test_id) FROM reading_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS reading_attempts,
      
      -- Listening scores
      (SELECT ROUND(AVG(percentage), 2) FROM listening_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS listening_avg,
      (SELECT COUNT(DISTINCT test_id) FROM listening_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS listening_attempts,
      
      -- Speaking scores
      (SELECT ROUND(AVG(percentage), 2) FROM speaking_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS speaking_avg,
      (SELECT COUNT(DISTINCT test_id) FROM speaking_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS speaking_attempts,
      
      -- Writing scores
      (SELECT ROUND(AVG(percentage), 2) FROM writing_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS writing_avg,
      (SELECT COUNT(DISTINCT test_id) FROM writing_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)) AS writing_attempts,
      
      -- Overall metrics
      (SELECT COUNT(DISTINCT test_id) FROM (
        SELECT test_id FROM reading_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
        UNION
        SELECT test_id FROM listening_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
        UNION
        SELECT test_id FROM speaking_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
        UNION
        SELECT test_id FROM writing_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
      ) all_tests) AS total_tests_taken,
      
      -- Recent test count (last 7 days)
      (SELECT COUNT(DISTINCT test_id) FROM (
        SELECT test_id FROM reading_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt) AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION
        SELECT test_id FROM listening_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt) AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION
        SELECT test_id FROM speaking_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt) AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION
        SELECT test_id FROM writing_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt) AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      ) recent_tests) AS recent_tests,
      
      -- Calculate overall average
      (SELECT ROUND(AVG(percentage), 2) FROM (
        SELECT percentage FROM reading_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
        UNION ALL
        SELECT percentage FROM listening_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
        UNION ALL
        SELECT percentage FROM speaking_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
        UNION ALL
        SELECT percentage FROM writing_scores WHERE user_id = p_user_id AND course IN (p_course_id, v_course_code, v_course_code_alt)
      ) all_scores) AS overall_average
  ),
  
  -- Vocabulary progress
  vocabulary_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE learning_status IN ('learned', 'mastered', '4')) AS learned_words,
      COUNT(*) AS total_words,
      COUNT(*) FILTER (WHERE learning_status IN ('learning', '2', '3')) AS learning_words,
      COUNT(*) FILTER (WHERE last_practiced >= tb.today_start) AS practiced_today,
      COUNT(*) FILTER (WHERE last_practiced >= tb.month_start) AS practiced_month
    FROM user_vocabulary guv
    CROSS JOIN time_boundaries tb
    WHERE guv.user_id = p_user_id
  ),
  
  -- Pronunciation progress
  pronunciation_stats AS (
    SELECT 
      COUNT(DISTINCT word) AS unique_words_practiced,
      ROUND(AVG(pronunciation_score::NUMERIC), 2) AS avg_pronunciation_score,
      COUNT(*) AS total_attempts,
      COUNT(*) FILTER (WHERE completed_at >= tb.today_start) AS attempts_today,
      COUNT(*) FILTER (WHERE completed_at >= tb.week_start) AS attempts_week,
      MAX(completed_at) AS last_practice_date,
      ROUND(AVG(pronunciation_score::NUMERIC) FILTER (WHERE completed_at >= tb.week_start), 2) AS recent_avg_score
    FROM pronunciation_scores ps
    CROSS JOIN time_boundaries tb
    WHERE ps.user_id = p_user_id 
      AND ps.course IN (p_course_id, v_course_code, v_course_code_alt)
  ),
  
  -- Streaks and engagement
  engagement_stats AS (
    SELECT 
      -- Calculate current streak (simplified)
      CASE 
        WHEN MAX(last_accessed_at::DATE) = CURRENT_DATE THEN
          (SELECT COUNT(DISTINCT date) FROM (
            SELECT DISTINCT last_accessed_at::DATE as date
            FROM user_lesson_progress_clean
            WHERE user_id = p_user_id
              AND last_accessed_at >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY date DESC
          ) consecutive_days
          WHERE date >= ALL (
            SELECT d::DATE 
            FROM generate_series(date, CURRENT_DATE, INTERVAL '1 day') d
            WHERE EXISTS (
              SELECT 1 FROM user_lesson_progress_clean
              WHERE user_id = p_user_id AND last_accessed_at::DATE = d::DATE
            )
          ))
        ELSE 0
      END AS current_streak,
      
      -- Simple activity check
      MAX(last_accessed_at::DATE) = CURRENT_DATE AS active_today,
      COUNT(DISTINCT last_accessed_at::DATE) AS total_active_days
      
    FROM user_lesson_progress_clean
    WHERE user_id = p_user_id
  ),
  
  -- Course metadata
  course_info AS (
    SELECT 
      COUNT(*) AS total_lessons,
      COUNT(DISTINCT chapter_id) AS total_chapters
    FROM course_data
    WHERE course_name = v_course_code
      AND status = 'generated'
  ),
  
  -- Recent activity (last 5 items)
  recent_activity AS (
    SELECT json_agg(
      json_build_object(
        'type', 'lesson',
        'name', lesson_title,
        'date', last_accessed_at,
        'score', NULL
      ) ORDER BY last_accessed_at DESC
    ) AS activities
    FROM (
      SELECT DISTINCT ON (lesson_id)
        lesson_id,
        lesson_title,
        last_accessed_at
      FROM user_lesson_progress_clean
      WHERE user_id = p_user_id
      ORDER BY lesson_id, last_accessed_at DESC
      LIMIT 5
    ) recent_lessons
  ),
  
  -- Goal progress
  goal_info AS (
    SELECT 
      goal_type,
      exam_name,
      target_exam_date,
      hours_per_week,
      total_estimated_hours,
      current_week,
      hours_spent_this_week,
      total_hours_spent,
      created_at
    FROM user_goals
    WHERE user_id = p_user_id
      AND course_id = p_course_id
    LIMIT 1
  ),
  
  -- Achievements count
  achievements AS (
    SELECT 
      COUNT(*) AS total_achievements,
      COUNT(*) FILTER (WHERE earned_at >= CURRENT_DATE - INTERVAL '7 days') AS recent_achievements
    FROM user_achievements
    WHERE user_id = p_user_id
      AND course_id = p_course_id
  )
  
  -- Combine all data
  SELECT jsonb_build_object(
    -- Metadata
    'generated_at', NOW(),
    'time_range', p_time_range,
    'cache_hit', false,
    
    -- Time spent (minutes)
    'todayTimeSpent', COALESCE((SELECT time_today / 60 FROM lesson_progress), 0),
    'weeklyTimeSpent', COALESCE((SELECT time_week / 60 FROM lesson_progress), 0),
    'monthlyTimeSpent', COALESCE((SELECT time_month / 60 FROM lesson_progress), 0),
    'allTimeSpent', COALESCE((SELECT total_time_all / 60 FROM lesson_progress), 0),
    
    -- Progress metrics
    'totalLessons', COALESCE((SELECT total_lessons FROM course_info), 0),
    'completedLessons', COALESCE((SELECT total_completed FROM lesson_progress), 0),
    'completedLessonsToday', COALESCE((SELECT completed_today FROM lesson_progress), 0),
    'completedLessonsMonth', COALESCE((SELECT completed_month FROM lesson_progress), 0),
    
    -- Test metrics
    'totalTests', GREATEST(
      COALESCE((SELECT COUNT(DISTINCT test_id) FROM reading_tests WHERE course = v_course_code), 0) +
      COALESCE((SELECT COUNT(DISTINCT test_id) FROM listening_tests WHERE course = v_course_code), 0) +
      COALESCE((SELECT COUNT(DISTINCT test_id) FROM speaking_tests WHERE course = v_course_code), 0) +
      COALESCE((SELECT COUNT(DISTINCT test_id) FROM writing_tests WHERE course = v_course_code), 0),
      6
    ),
    'completedTests', COALESCE((SELECT total_tests_taken FROM test_scores), 0),
    'completedTestsToday', 0, -- TODO: Add time-based test counting
    'completedTestsMonth', 0, -- TODO: Add time-based test counting
    'averageScore', COALESCE((SELECT overall_average FROM test_scores), 0),
    
    -- Skill scores
    'skillScores', jsonb_build_object(
      'reading', (SELECT reading_avg FROM test_scores),
      'listening', (SELECT listening_avg FROM test_scores),
      'speaking', (SELECT speaking_avg FROM test_scores),
      'writing', (SELECT writing_avg FROM test_scores)
    ),
    
    -- Vocabulary
    'totalVocabulary', COALESCE((SELECT total_words FROM vocabulary_stats), 0),
    'learnedVocabulary', COALESCE((SELECT learned_words FROM vocabulary_stats), 0),
    'learnedVocabularyToday', COALESCE((SELECT practiced_today FROM vocabulary_stats), 0),
    'learnedVocabularyMonth', COALESCE((SELECT practiced_month FROM vocabulary_stats), 0),
    'vocabularyToLearn', COALESCE((SELECT learning_words FROM vocabulary_stats), 0),
    
    -- Streaks
    'streaks', jsonb_build_object(
      'current', COALESCE((SELECT current_streak FROM engagement_stats), 0),
      'longest', COALESCE((SELECT current_streak FROM engagement_stats), 0), -- TODO: Track longest separately
      'active_today', COALESCE((SELECT active_today FROM engagement_stats), false)
    ),
    
    -- Achievements
    'achievements', jsonb_build_object(
      'total', COALESCE((SELECT total_achievements FROM achievements), 0),
      'recent', '[]'::jsonb  -- TODO: Fetch actual recent achievements
    ),
    
    -- Prep score data
    'exerciseTypesCompleted', COALESCE((SELECT exercise_types FROM lesson_progress), ARRAY[]::TEXT[]),
    'testAttempts', jsonb_build_object(
      'reading', COALESCE((SELECT reading_attempts FROM test_scores), 0),
      'listening', COALESCE((SELECT listening_attempts FROM test_scores), 0),
      'speaking', COALESCE((SELECT speaking_attempts FROM test_scores), 0),
      'writing', COALESCE((SELECT writing_attempts FROM test_scores), 0)
    ),
    'recentTestDays', CASE 
      WHEN (SELECT recent_tests FROM test_scores) > 0 THEN 0
      ELSE 30
    END,
    'averageImprovement', 0, -- TODO: Calculate improvement over time
    'pronunciationScore', (SELECT avg_pronunciation_score FROM pronunciation_stats),
    'grammarScore', NULL, -- TODO: Add grammar tracking
    'activeDaysLast30', COALESCE((SELECT active_days_month FROM lesson_progress), 0),
    
    -- Next lesson (use pre-calculated value)
    'nextLesson', v_next_lesson,
    
    -- Next test recommendation
    'nextTest', NULL, -- TODO: Implement test recommendation logic
    
    -- Recent activity
    'recentActivity', COALESCE((SELECT activities FROM recent_activity), '[]'::json),
    
    -- Goal progress
    'goalProgress', CASE
      WHEN EXISTS (SELECT 1 FROM goal_info) THEN
        (SELECT jsonb_build_object(
          'hasGoal', true,
          'goalType', goal_type,
          'examName', exam_name,
          'targetExamDate', target_exam_date,
          'hoursPerWeek', hours_per_week,
          'totalEstimatedHours', total_estimated_hours,
          'currentWeek', GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / 604800)::INT,
          'hoursSpentThisWeek', hours_spent_this_week,
          'totalHoursSpent', total_hours_spent,
          'expectedHours', LEAST(
            GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / 604800)::INT * hours_per_week,
            total_estimated_hours
          ),
          'progressPercentage', CASE 
            WHEN total_estimated_hours > 0 THEN 
              LEAST(100, ROUND((total_hours_spent / total_estimated_hours) * 100))
            ELSE 0 
          END,
          'weeksRemaining', CASE
            WHEN target_exam_date IS NOT NULL THEN
              GREATEST(0, EXTRACT(EPOCH FROM (target_exam_date - NOW())) / 604800)::INT
            ELSE NULL
          END,
          'isOverdue', CASE
            WHEN target_exam_date IS NOT NULL THEN target_exam_date < NOW()
            ELSE false
          END,
          'isOnTrack', total_hours_spent >= (
            LEAST(
              GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / 604800)::INT * hours_per_week,
              total_estimated_hours
            ) * 0.8
          ),
          'estimatedCompletionWeeks', CASE
            WHEN hours_per_week > 0 AND total_hours_spent < total_estimated_hours THEN
              CEIL((total_estimated_hours - total_hours_spent) / hours_per_week)
            ELSE 0
          END
        ) FROM goal_info)
      ELSE NULL
    END,
    
    -- Suggestions
    'suggestions', '[]'::jsonb  -- TODO: Implement smart suggestions
    
  ) INTO v_result;
  
  -- Cache the result
  INSERT INTO dashboard_cache (cache_key, data, expires_at)
  VALUES (v_cache_key, v_result, NOW() + INTERVAL '5 minutes')
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return partial data
    RAISE WARNING 'Dashboard RPC error: %', SQLERRM;
    
    -- Return a basic structure with error info
    RETURN jsonb_build_object(
      'error', true,
      'error_message', SQLERRM,
      'partial_data', false,
      -- Include basic empty structure
      'weeklyTimeSpent', 0,
      'todayTimeSpent', 0,
      'monthlyTimeSpent', 0,
      'allTimeSpent', 0,
      'averageScore', 0,
      'skillScores', jsonb_build_object(
        'reading', NULL,
        'listening', NULL,
        'writing', NULL,
        'speaking', NULL
      ),
      'totalLessons', 0,
      'completedLessons', 0,
      'completedLessonsToday', 0,
      'completedLessonsMonth', 0,
      'totalTests', 6,
      'completedTests', 0,
      'completedTestsToday', 0,
      'completedTestsMonth', 0,
      'totalVocabulary', 0,
      'learnedVocabulary', 0,
      'learnedVocabularyToday', 0,
      'learnedVocabularyMonth', 0,
      'vocabularyToLearn', 0,
      'streaks', jsonb_build_object(
        'current', 0,
        'longest', 0,
        'active_today', false
      ),
      'achievements', jsonb_build_object(
        'total', 0,
        'recent', '[]'::jsonb
      ),
      'nextLesson', NULL,
      'nextTest', NULL,
      'recentActivity', '[]'::jsonb,
      'suggestions', '[]'::jsonb,
      'goalProgress', NULL
    );
END;
$$;

-- Create the dashboard_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS dashboard_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on expires_at for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_expires ON dashboard_cache(expires_at);