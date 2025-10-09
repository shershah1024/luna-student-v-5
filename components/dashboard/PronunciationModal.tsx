'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

interface PronunciationScore {
  id: number;
  word: string;
  pronunciation_score: number;
  language?: string;
  completed_at: string;
  course: string;
}

interface PronunciationModalProps {
  courseId: string;
  onClose: () => void;
}

const PronunciationModal: React.FC<PronunciationModalProps> = ({ courseId, onClose }) => {
  const { user } = useUser();
  const [pronunciationData, setPronunciationData] = useState<PronunciationScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWords, setTotalWords] = useState(0);
  const [wordAudios, setWordAudios] = useState<Record<string, string>>({});
  const [loadingWordAudio, setLoadingWordAudio] = useState<Record<string, boolean>>({});
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalWords / itemsPerPage);

  useEffect(() => {
    if (user?.id) {
      fetchPronunciationData();
    }
  }, [user?.id, courseId, currentPage]);

  const fetchPronunciationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pronunciation-progress?userId=${user?.id}&course=${courseId}`);
      
      if (response.ok) {
        const data = await response.json();
        const allWords = data.all || [];
        setTotalWords(allWords.length);
        
        // Paginate the data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPronunciationData(allWords.slice(startIndex, endIndex));
      }
    } catch (error) {
      console.error('Error fetching pronunciation data:', error);
    } finally {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">All Pronunciation Practice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-800 rounded animate-pulse"></div>
              ))}
            </div>
          ) : pronunciationData.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">{totalWords} words practiced</span>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <div className="space-y-3">
                {pronunciationData.map((wordData) => (
                  <div 
                    key={`${wordData.word}-${wordData.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{wordData.word}</span>
                      <button
                        onClick={() => getWordAudio(wordData.word)}
                        disabled={loadingWordAudio[wordData.word]}
                        className="p-2 rounded hover:bg-slate-600 transition-colors text-gray-400 hover:text-white"
                        aria-label={`Play pronunciation of ${wordData.word}`}
                      >
                        {loadingWordAudio[wordData.word] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${getScoreColor(wordData.pronunciation_score)}`}>
                        {Math.round(wordData.pronunciation_score)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(wordData.completed_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={i}
                          variant={pageNum === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={pageNum === currentPage ? "bg-blue-600" : "text-gray-400 hover:text-white"}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-400 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No pronunciation practice data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PronunciationModal;