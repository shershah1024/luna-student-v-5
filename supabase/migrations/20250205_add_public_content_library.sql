-- Migration: Add Public Content Library Support
-- Adds columns to tasks table to support public content library with multi-language support

-- Add new columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

-- Add comment to explain the columns
COMMENT ON COLUMN tasks.is_public IS 'Marks content as publicly available in the content library';
COMMENT ON COLUMN tasks.language IS 'Target language for the learning content (e.g., German, Spanish, French, English)';
COMMENT ON COLUMN tasks.level IS 'CEFR level of the content (A1-C2)';

-- Create indexes for efficient querying of public content
CREATE INDEX IF NOT EXISTS idx_tasks_public_library
ON tasks(is_public, language, level, task_type)
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_tasks_language_level
ON tasks(language, level)
WHERE language IS NOT NULL AND level IS NOT NULL;

-- Create view for public content library
CREATE OR REPLACE VIEW public_content_library AS
SELECT
  t.id,
  t.task_type,
  t.title,
  t.language,
  t.level,
  t.status,
  t.parameters,
  t.metadata,
  t.created_at,
  -- Aggregate content from specific task tables
  COALESCE(
    gt.content,
    rt.content,
    lt.content,
    ct.content,
    st.content,
    wt.content,
    dt.content,
    pt.content,
    vt.content,
    strt.content
  ) as content,
  -- Aggregate settings
  COALESCE(
    gt.settings,
    rt.settings,
    lt.settings,
    ct.settings,
    st.settings,
    wt.settings,
    dt.settings,
    pt.settings,
    vt.settings,
    strt.settings
  ) as settings
FROM tasks t
LEFT JOIN grammar_tasks gt ON t.id = gt.task_id
LEFT JOIN reading_tasks rt ON t.id = rt.task_id
LEFT JOIN listening_tasks lt ON t.id = lt.task_id
LEFT JOIN chatbot_tasks ct ON t.id = ct.task_id
LEFT JOIN speaking_tasks st ON t.id = st.task_id
LEFT JOIN writing_tasks wt ON t.id = wt.task_id
LEFT JOIN debate_tasks dt ON t.id = dt.task_id
LEFT JOIN pronunciation_tasks pt ON t.id = pt.task_id
LEFT JOIN vocabulary_tasks vt ON t.id = vt.task_id
LEFT JOIN storytelling_tasks strt ON t.id = strt.task_id
WHERE t.is_public = true AND t.status = 'active';

-- Add RLS policies for public content (allow anonymous read access)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read public content
CREATE POLICY "Public content is readable by anyone" ON tasks
  FOR SELECT
  USING (is_public = true);

-- Policy: Allow authenticated users to read their own content
CREATE POLICY "Users can read their own content" ON tasks
  FOR SELECT
  USING (teacher_id = auth.uid()::text);

-- Policy: Allow teachers to create content
CREATE POLICY "Teachers can create content" ON tasks
  FOR INSERT
  WITH CHECK (teacher_id = auth.uid()::text);

-- Policy: Allow teachers to update their own content
CREATE POLICY "Teachers can update their own content" ON tasks
  FOR UPDATE
  USING (teacher_id = auth.uid()::text);

-- Create function to search public content
CREATE OR REPLACE FUNCTION search_public_content(
  search_query TEXT DEFAULT NULL,
  filter_language TEXT DEFAULT NULL,
  filter_level TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT NULL,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  task_type TEXT,
  title TEXT,
  language TEXT,
  level TEXT,
  parameters JSONB,
  metadata JSONB,
  content JSONB,
  relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pcl.id,
    pcl.task_type,
    pcl.title,
    pcl.language,
    pcl.level,
    pcl.parameters,
    pcl.metadata,
    pcl.content,
    CASE
      WHEN search_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', COALESCE(pcl.title, '') || ' ' || COALESCE(pcl.metadata::text, '')),
          plainto_tsquery('english', search_query)
        )
      ELSE 1.0
    END as relevance
  FROM public_content_library pcl
  WHERE
    (filter_language IS NULL OR pcl.language = filter_language)
    AND (filter_level IS NULL OR pcl.level = filter_level)
    AND (filter_type IS NULL OR pcl.task_type = filter_type)
    AND (
      search_query IS NULL
      OR to_tsvector('english', COALESCE(pcl.title, '') || ' ' || COALESCE(pcl.metadata::text, ''))
         @@ plainto_tsquery('english', search_query)
    )
  ORDER BY relevance DESC, pcl.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create statistics tracking for public content
CREATE TABLE IF NOT EXISTS public_content_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  views_count INT DEFAULT 0,
  completions_count INT DEFAULT 0,
  avg_score NUMERIC,
  popularity_score NUMERIC DEFAULT 0, -- Calculated from views + completions + ratings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_stats_task ON public_content_stats(task_id);
CREATE INDEX IF NOT EXISTS idx_content_stats_popularity ON public_content_stats(popularity_score DESC);

-- Add RLS for stats
ALTER TABLE public_content_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content stats" ON public_content_stats
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON public_content_library TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_public_content TO anon, authenticated;
GRANT SELECT ON public_content_stats TO anon, authenticated;
