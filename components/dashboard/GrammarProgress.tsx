'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Eye, TrendingUp, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/nextjs';

interface GrammarError {
  id: number;
  category: string;
  sentence: string;
  created_at: string;
  course: string;
}

interface GrammarProgressProps {
  courseId: string;
  showErrors?: boolean;
  limit?: number;
}

const GrammarProgress: React.FC<GrammarProgressProps> = ({ 
  courseId, 
  showErrors = true,
  limit = 5 
}) => {
  const { user } = useUser();
  const [recentErrors, setRecentErrors] = useState<GrammarError[]>([]);
  const [allErrors, setAllErrors] = useState<GrammarError[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchGrammarData();
    }
  }, [user?.id, courseId]);

  const fetchGrammarData = async () => {
    console.log('[GrammarProgress] Starting fetch - userId:', user?.id, 'courseId:', courseId, 'limit:', limit)
    
    try {
      setLoading(true);
      
      const apiUrl = `/api/grammar-errors-data?userId=${user?.id}&course=${courseId}&limit=${limit}`
      console.log('[GrammarProgress] Fetching from:', apiUrl)
      
      // Fetch recent grammar errors using direct API call
      const response = await fetch(apiUrl);
      console.log('[GrammarProgress] Response status:', response.status, 'ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json();
        console.log('[GrammarProgress] Received data:', {
          hasData: !!data,
          recentCount: data?.recent?.length || 0,
          allCount: data?.all?.length || 0
        })
        
        setRecentErrors(data.recent || []);
        setAllErrors(data.all || []);
        console.log('[GrammarProgress] Set data - recent:', data.recent?.length || 0, 'all:', data.all?.length || 0)
      } else {
        const errorText = await response.text()
        console.error('[GrammarProgress] API error - Status:', response.status, 'Response:', errorText)
      }
    } catch (error) {
      console.error('[GrammarProgress] Fetch error:', error);
    } finally {
      console.log('[GrammarProgress] Fetch completed, loading set to false')
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Articles': 'text-red-600 bg-red-50/10',
      'Verb Conjugation': 'text-blue-600 bg-blue-50/10',
      'Word Order': 'text-purple-600 bg-purple-50/10',
      'Prepositions': 'text-green-600 bg-green-50/10',
      'Plurals': 'text-orange-600 bg-orange-50/10',
      'Past Tense': 'text-indigo-600 bg-indigo-50/10',
      'Cases': 'text-pink-600 bg-pink-50/10',
      'Modal Verbs': 'text-teal-600 bg-teal-50/10',
      'Adjective Endings': 'text-amber-600 bg-amber-50/10',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50/10';
  };

  const getCategoryIcon = (category: string) => {
    return <AlertCircle className="h-3 w-3" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateSentence = (sentence: string, maxLength: number = 30) => {
    if (sentence.length <= maxLength) return sentence;
    return sentence.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-indigo-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (recentErrors.length === 0) {
    return (
      <p className="text-xs text-indigo-600">No grammar errors tracked yet</p>
    );
  }

  // For dashboard view - compact
  if (!showModal && showErrors) {
    return (
      <div className="space-y-2">
        {recentErrors.slice(0, limit).map((error, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white border border-indigo-200 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100">
                {getCategoryIcon(error.category)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-800 font-medium block truncate">{error.category}</span>
                <span className="text-xs text-gray-600 block truncate">{truncateSentence(error.sentence)}</span>
              </div>
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
              <Brain className="h-5 w-5 text-indigo-600" />
              Grammar Errors
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-gray-600">Last {limit} errors</span>
            </div>
            
            {recentErrors.slice(0, limit).map((errorData, index) => (
              <div 
                key={`${errorData.id}-${errorData.category}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getCategoryColor(errorData.category)}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
                    <Brain className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 block">{errorData.category}</span>
                    <div className="text-xs text-gray-500">{formatDate(errorData.created_at)}</div>
                    <div className="text-sm text-gray-700 mt-1 truncate">{errorData.sentence}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal for All Errors */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold">All Grammar Errors</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {allErrors.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">{allErrors.length} errors tracked</span>
                  </div>
                  
                  {allErrors.map((errorData, index) => (
                    <div 
                      key={`${errorData.id}-${errorData.category}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getCategoryColor(errorData.category)}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
                          <Brain className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 block">{errorData.category}</span>
                          <div className="text-xs text-gray-500">
                            {formatDate(errorData.created_at)} • {errorData.course}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{errorData.sentence}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No grammar errors found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GrammarProgress;