'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Eye, TrendingUp, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';

interface VocabularyWord {
  id: number;
  word: string;
  learning_status: number;
  attempts: number;
  correct_responses: number;
  last_practiced: string;
  task_id: string;
}

interface VocabularyProgressProps {
  courseId: string;
  showProgress?: boolean;
  limit?: number;
}

const VocabularyProgress: React.FC<VocabularyProgressProps> = ({ 
  courseId, 
  showProgress = true,
  limit = 5 
}) => {
  const { user } = useUser();
  const [recentWords, setRecentWords] = useState<VocabularyWord[]>([]);
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchVocabularyData();
    }
  }, [user?.id, courseId]);

  const fetchVocabularyData = async () => {
    console.log('[VocabularyProgress] Starting fetch - userId:', user?.id, 'courseId:', courseId, 'limit:', limit)
    
    try {
      setLoading(true);
      
      const apiUrl = `/api/vocabulary-progress-data?userId=${user?.id}&course=${courseId}&limit=${limit}`
      console.log('[VocabularyProgress] Fetching from:', apiUrl)
      
      // Fetch recent vocabulary progress using direct API call to existing pattern
      const response = await fetch(apiUrl);
      console.log('[VocabularyProgress] Response status:', response.status, 'ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json();
        console.log('[VocabularyProgress] Received data:', {
          hasData: !!data,
          wordsCount: data?.length || 0,
          firstWord: data?.[0]?.word || 'None'
        })
        setRecentWords(data.recent || []);
        setAllWords(data.all || []);
        console.log('[VocabularyProgress] Set data - recent:', data.recent?.length || 0, 'all:', data.all?.length || 0)
      } else {
        const errorText = await response.text()
        console.error('[VocabularyProgress] API error - Status:', response.status, 'Response:', errorText)
      }
    } catch (error) {
      console.error('[VocabularyProgress] Fetch error:', error);
    } finally {
      console.log('[VocabularyProgress] Fetch completed, loading set to false')
      setLoading(false);
    }
  };

  const getProgressColor = (status: number) => {
    if (status >= 3) return 'text-green-600 bg-green-50/10';
    if (status >= 2) return 'text-yellow-600 bg-yellow-50/10';
    return 'text-emerald-600 bg-emerald-50/10';
  };

  const getProgressPercentage = (status: number, attempts: number, correct: number) => {
    if (attempts === 0) return 0;
    const accuracy = (correct / attempts) * 100;
    const statusBonus = status * 20;
    return Math.min(Math.round(accuracy + statusBonus), 100);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-green-600';
    if (percentage >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-emerald-500 to-emerald-600';
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
          <div key={i} className="h-10 bg-emerald-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (recentWords.length === 0) {
    return (
      <p className="text-xs text-emerald-600">Start learning vocabulary to see your words here</p>
    );
  }

  // For dashboard view - compact
  if (!showModal && showProgress) {
    return (
      <div className="space-y-2">
        {recentWords.slice(0, limit).map((word, index) => {
          const progress = getProgressPercentage(word.learning_status, word.attempts, word.correct_responses);
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-200 hover:border-emerald-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm text-gray-800 font-semibold">{word.word}</span>
                <div className="flex-1 max-w-20">
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${getProgressBarColor(progress)} rounded-full h-2 transition-all duration-300`}
                      style={{width: `${progress}%`}}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`text-sm font-bold ${
                  progress >= 80 ? 'text-green-600' :
                  progress >= 60 ? 'text-yellow-600' :
                  'text-emerald-600'
                }`}>{progress}%</span>
              </div>
            </div>
          );
        })}
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
              <BookOpen className="h-5 w-5 text-emerald-600" />
              Vocabulary Progress
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-gray-600">Last {limit} words practiced</span>
            </div>
            
            {recentWords.slice(0, limit).map((wordData, index) => {
              const progress = getProgressPercentage(wordData.learning_status, wordData.attempts, wordData.correct_responses);
              return (
                <div 
                  key={`${wordData.word}-${wordData.id}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getProgressColor(wordData.learning_status)}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{wordData.word}</span>
                      <div className="text-xs text-gray-500">{formatDate(wordData.last_practiced)}</div>
                      <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-1">
                        <div 
                          className={`bg-gradient-to-r ${getProgressBarColor(progress)} rounded-full h-1.5 transition-all duration-300`}
                          style={{width: `${progress}%`}}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">{progress}%</span>
                    <div className="text-xs text-gray-500">{wordData.correct_responses}/{wordData.attempts}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal for All Words */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-semibold">All Vocabulary Progress</h2>
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
                  
                  {allWords.map((wordData, index) => {
                    const progress = getProgressPercentage(wordData.learning_status, wordData.attempts, wordData.correct_responses);
                    return (
                      <div 
                        key={`${wordData.word}-${wordData.id}`}
                        className={`flex items-center justify-between p-3 rounded-lg border ${getProgressColor(wordData.learning_status)}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                            <BookOpen className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{wordData.word}</span>
                            <div className="text-xs text-gray-500">
                              {formatDate(wordData.last_practiced)} • Task: {wordData.task_id}
                            </div>
                            <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`bg-gradient-to-r ${getProgressBarColor(progress)} rounded-full h-1.5 transition-all duration-300`}
                                style={{width: `${progress}%`}}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm">{progress}%</span>
                          <div className="text-xs text-gray-500">{wordData.correct_responses}/{wordData.attempts}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No vocabulary practice data found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VocabularyProgress;