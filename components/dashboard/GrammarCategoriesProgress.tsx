'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Eye, X, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

interface GrammarError {
  error: string;
  correction: string;
  grammar_category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  source: 'lesson';
  date: string;
  task_id?: string;
}

interface CategoryData {
  count: number;
  errors: GrammarError[];
  severityBreakdown: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
}

interface GrammarErrorsData {
  categories: Record<string, CategoryData>;
  totalErrors: number;
  recentErrors: GrammarError[];
}

interface GrammarCategoriesProgressProps {
  courseId: string;
  showErrors?: boolean;
  limit?: number;
}

const GrammarCategoriesProgress: React.FC<GrammarCategoriesProgressProps> = ({ 
  courseId, 
  showErrors = true,
  limit = 5 
}) => {
  const { user } = useUser();
  const [grammarData, setGrammarData] = useState<GrammarErrorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchGrammarData();
    }
  }, [user?.id, courseId]);

  const fetchGrammarData = async () => {
    try {
      setLoading(true);
      
      const apiUrl = `/api/fetch-grammar-errors?course=${courseId}`
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        setGrammarData(data);
      } else {
        console.error('Error fetching grammar data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching grammar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'ARTICLES': 'text-red-600 bg-red-50 border-red-200',
      'VERB_CONJUGATION': 'text-blue-600 bg-blue-50 border-blue-200',
      'WORD_ORDER': 'text-purple-600 bg-purple-50 border-purple-200',
      'PREPOSITIONS': 'text-green-600 bg-green-50 border-green-200',
      'PLURAL_FORMS': 'text-orange-600 bg-orange-50 border-orange-200',
      'NOUN_CASES': 'text-pink-600 bg-pink-50 border-pink-200',
      'CAPITALIZATION': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      'VERB_POSITION': 'text-teal-600 bg-teal-50 border-teal-200',
      'PRONOUN_CASES': 'text-amber-600 bg-amber-50 border-amber-200',
      'SEPARABLE_VERBS': 'text-cyan-600 bg-cyan-50 border-cyan-200',
      'ADJECTIVE_ENDINGS': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'SPELLING': 'text-slate-600 bg-slate-50 border-slate-200',
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'HIGH': 'text-red-700 bg-red-100',
      'MEDIUM': 'text-orange-700 bg-orange-100', 
      'LOW': 'text-green-700 bg-green-100',
    };
    return colors[severity as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const formatCategoryName = (category: string) => {
    return category.toLowerCase().split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
          <div key={i} className="h-10 bg-cyan-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!grammarData || grammarData.totalErrors === 0) {
    return (
      <p className="text-xs text-cyan-600">No grammar errors tracked yet</p>
    );
  }

  // Get top categories by count
  const topCategories = Object.entries(grammarData.categories)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit);

  // For dashboard view - compact categories
  if (showErrors) {
    return (
      <>
        <div className="space-y-2">
          {topCategories.map(([category, data]) => (
            <div 
              key={category} 
              className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer ${getCategoryColor(category)}`}
              onClick={() => setSelectedCategory(category)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/50">
                  <AlertCircle className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{formatCategoryName(category)}</span>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <span>{data.count} errors</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${getSeverityColor('HIGH')}`}>
                      {data.severityBreakdown.HIGH} high
                    </span>
                  </div>
                </div>
              </div>
              <Eye className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Category Details Modal */}
        {selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(selectedCategory)}`}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{formatCategoryName(selectedCategory)}</h2>
                    <p className="text-sm text-gray-600">
                      {grammarData.categories[selectedCategory].count} errors found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-4">
                  {grammarData.categories[selectedCategory].errors.map((error, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                              {error.severity}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(error.date)}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              Lesson
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="text-sm">
                                <span className="text-red-600 font-medium">Error:</span>
                                <span className="ml-2 line-through text-red-600">{error.error}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="text-sm">
                                <span className="text-green-600 font-medium">Correct:</span>
                                <span className="ml-2 text-green-600">{error.correction}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              <strong>Explanation:</strong> {error.explanation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default GrammarCategoriesProgress;