'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Eye, TrendingUp, Award, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';

interface PronunciationScore {
  id: number;
  word: string;
  pronunciation_score: number;
  language?: string;
  completed_at: string;
  course: string;
}

interface PronunciationProgressProps {
  courseId: string;
  showAudio?: boolean;
  limit?: number;
}

const PronunciationProgress: React.FC<PronunciationProgressProps> = ({ 
  courseId, 
  showAudio = true,
  limit = 5 
}) => {
  const { user } = useUser();
  const [recentWords, setRecentWords] = useState<PronunciationScore[]>([]);
  const [allWords, setAllWords] = useState<PronunciationScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [wordAudios, setWordAudios] = useState<Record<string, string>>({});
  const [loadingWordAudio, setLoadingWordAudio] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      fetchPronunciationData();
    }
  }, [user?.id, courseId]);

  const fetchPronunciationData = async () => {
    console.log('[PronunciationProgress] Starting fetch - userId:', user?.id, 'courseId:', courseId)
    
    try {
      setLoading(true);
      
      const apiUrl = `/api/pronunciation-progress?userId=${user?.id}&course=${courseId}`
      console.log('[PronunciationProgress] Fetching from:', apiUrl)
      
      const response = await fetch(apiUrl);
      console.log('[PronunciationProgress] Response status:', response.status, 'ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json();
        console.log('[PronunciationProgress] Received data:', {
          hasData: !!data,
          recentCount: data?.recent?.length || 0,
          allCount: data?.all?.length || 0
        })
        setRecentWords(data.recent || []);
        setAllWords(data.all || []);
        console.log('[PronunciationProgress] Set data - recent:', data.recent?.length || 0, 'all:', data.all?.length || 0)
      } else {
        const errorText = await response.text()
        console.error('[PronunciationProgress] API error - Status:', response.status, 'Response:', errorText)
      }
    } catch (error) {
      console.error('[PronunciationProgress] Fetch error:', error);
    } finally {
      console.log('[PronunciationProgress] Fetch completed, loading set to false')
      setLoading(false);
    }
  };

  const getWordAudio = async (word: string) => {
    if (wordAudios[word]) {
      try {
        const audio = new Audio(wordAudios[word]);
        await audio.play();
      } catch (error) {
        console.error(`Error playing cached audio for word '${word}':`, error);
      }
      return;
    }
    
    setLoadingWordAudio(prev => ({ ...prev, [word]: true }));
    try {
      const response = await fetch('/api/generate-word-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word,
          language: 'de'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate word audio');
      }

      const { audioUrl } = await response.json();
      setWordAudios(prev => ({ ...prev, [word]: audioUrl }));
      
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error(`Error getting audio for word '${word}':`, error);
    } finally {
      setLoadingWordAudio(prev => ({ ...prev, [word]: false }));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50/10';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50/10';
    return 'text-red-600 bg-red-50/10';
  };

  const getStarColor = (score: number, starIndex: number) => {
    const threshold = starIndex * 33;
    return score >= threshold ? 'bg-yellow-400' : 'bg-red-900/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-rose-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (recentWords.length === 0) {
    return (
      <p className="text-xs text-rose-600">Start practicing to see your words here</p>
    );
  }

  // For dashboard view - compact
  if (!showModal && showAudio) {
    return (
      <div className="space-y-2">
        {recentWords.slice(0, limit).map((word, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white border border-rose-200 hover:border-rose-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm text-gray-800 font-semibold">{word.word}</span>
              {showAudio && (
                <button
                  onClick={() => getWordAudio(word.word)}
                  disabled={loadingWordAudio[word.word]}
                  className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 transition-colors text-rose-700 hover:text-rose-800"
                  aria-label={`Play pronunciation of ${word.word}`}
                >
                  {loadingWordAudio[word.word] ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-rose-600 border-t-transparent"></div>
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center">
              <span className={`text-sm font-bold ${
                word.pronunciation_score >= 90 ? 'text-green-600' :
                word.pronunciation_score >= 70 ? 'text-yellow-600' :
                'text-rose-600'
              }`}>{Math.round(word.pronunciation_score)}%</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Card view - for full component
  return (
    <>
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-purple-600" />
              Pronunciation Practice
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-purple-600 hover:text-purple-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Last {limit} words practiced</span>
            </div>
            
            {recentWords.slice(0, limit).map((wordData, index) => (
              <div 
                key={`${wordData.word}-${wordData.id}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getScoreColor(wordData.pronunciation_score)}`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => getWordAudio(wordData.word)}
                    disabled={loadingWordAudio[wordData.word]}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors disabled:opacity-50"
                    title="Listen to pronunciation"
                  >
                    {loadingWordAudio[wordData.word] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-600 border-t-transparent"></div>
                    ) : (
                      <Volume2 className="h-4 w-4 text-purple-600" />
                    )}
                  </button>
                  <div>
                    <span className="font-medium text-gray-900">{wordData.word}</span>
                    <div className="text-xs text-gray-500">{formatDate(wordData.completed_at)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">{Math.round(wordData.pronunciation_score)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal for All Words */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold">All Pronunciation Practice</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {allWords.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">{allWords.length} words practiced</span>
                  </div>
                  
                  {allWords.map((wordData, index) => (
                    <div 
                      key={`${wordData.word}-${wordData.id}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getScoreColor(wordData.pronunciation_score)}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => getWordAudio(wordData.word)}
                          disabled={loadingWordAudio[wordData.word]}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors disabled:opacity-50"
                          title="Listen to pronunciation"
                        >
                          {loadingWordAudio[wordData.word] ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-600 border-t-transparent"></div>
                          ) : (
                            <Volume2 className="h-4 w-4 text-purple-600" />
                          )}
                        </button>
                        <div>
                          <span className="font-medium text-gray-900">{wordData.word}</span>
                          <div className="text-xs text-gray-500">
                            {formatDate(wordData.completed_at)} • {wordData.course}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm">{Math.round(wordData.pronunciation_score)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Volume2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No pronunciation practice data found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PronunciationProgress;