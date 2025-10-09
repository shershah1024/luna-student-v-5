CREATE TABLE IF NOT EXISTS public.vocabulary_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  test_id text,
  task_id text,
  language text NOT NULL DEFAULT 'de',
  context text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary_definitions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_vocabulary (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  term text NOT NULL,
  definition text,
  test_id text,
  task_id text,
  language text NOT NULL DEFAULT 'de',
  learning_status integer NOT NULL DEFAULT 0,
  notes text,
  last_practiced timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.word_lookups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  test_id text,
  word text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.word_lookups ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_definitions_term_lang_test_idx
  ON public.vocabulary_definitions(term, language, test_id)
  WHERE test_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_definitions_term_lang_task_idx
  ON public.vocabulary_definitions(term, language, task_id)
  WHERE task_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_vocabulary_user_term_test_idx
  ON public.user_vocabulary(user_id, term, test_id, language)
  WHERE test_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_vocabulary_user_term_task_idx
  ON public.user_vocabulary(user_id, term, task_id)
  WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS word_lookups_user_test_idx
  ON public.word_lookups(user_id, test_id);

CREATE POLICY "Allow anon full access to vocabulary_definitions"
  ON public.vocabulary_definitions
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon full access to user_vocabulary"
  ON public.user_vocabulary
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon full access to word_lookups"
  ON public.word_lookups
  USING (true)
  WITH CHECK (true);
