import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface VocabularyWord {
  term: string;
  learning_status: number;
}

interface UseVocabularyPracticeResult {
  words: VocabularyWord[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentOffset: number;
  hasMore: boolean;
  loadNextBatch: () => Promise<void>;
  refreshWords: () => Promise<void>;
}

export function useVocabularyPractice(userId: string, batchSize: number = 10): UseVocabularyPracticeResult {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchVocabularyBatch = async (offset: number = 0): Promise<VocabularyWord[]> => {
    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('term, learning_status')
      .eq('user_id', userId)
      .neq('learning_status', 0) // Not equal to 0 (not not-started)
      .neq('learning_status', 5) // Not equal to 5 (not mastered)
      .order('learning_status', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1); // Get batch size (0-indexed)

    if (error) {
      throw new Error(`Error fetching vocabulary: ${error.message}`);
    }

    return (data || []).map(item => ({
      term: item.term,
      learning_status: item.learning_status || 0
    }));
  };

  const fetchTotalCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('user_vocabulary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('learning_status', 0) // Not equal to 0 (not not-started)
      .neq('learning_status', 5); // Not equal to 5 (not mastered)

    if (error) {
      throw new Error(`Error getting vocabulary count: ${error.message}`);
    }

    return count || 0;
  };

  const loadInitialBatch = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [initialWords, total] = await Promise.all([
        fetchVocabularyBatch(0),
        fetchTotalCount()
      ]);

      setWords(initialWords);
      setTotalCount(total);
      setCurrentOffset(0);
      setHasMore(initialWords.length === batchSize && total > batchSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary');
      setWords([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextBatch = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextOffset = currentOffset + batchSize;
      const nextBatch = await fetchVocabularyBatch(nextOffset);

      setWords(nextBatch);
      setCurrentOffset(nextOffset);
      setHasMore(nextBatch.length === batchSize && nextOffset + batchSize < totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load next batch');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWords = async () => {
    await loadInitialBatch();
  };

  useEffect(() => {
    loadInitialBatch();
  }, [userId]);

  return {
    words,
    isLoading,
    error,
    totalCount,
    currentOffset,
    hasMore,
    loadNextBatch,
    refreshWords
  };
}