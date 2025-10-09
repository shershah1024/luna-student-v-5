'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, BookOpen, Headphones, Mic, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateTestsFromSections } from '@/utils/testSectionMapping';

interface TestScore {
  id: number;
  test_id: string;
  section: number;
  score: number;
  total_score: number;
  percentage: number;
  created_at: string;
  exam_id: string;
}

interface AllTestScores {
  reading: TestScore[];
  listening: TestScore[];
  writing: TestScore[];
  speaking: TestScore[];
}

interface TestScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  userId: string;
  skillScores: {
    reading?: number;
    listening?: number;
    writing?: number;
    speaking?: number;
  };
  testAttempts: {
    reading?: number;
    listening?: number;
    writing?: number;
    speaking?: number;
  };
}

const TestScoresModal: React.FC<TestScoresModalProps> = ({
  isOpen,
  onClose,
  courseId,
  userId,
  skillScores,
  testAttempts
}) => {
  const [allScores, setAllScores] = useState<AllTestScores>({
    reading: [],
    listening: [],
    writing: [],
    speaking: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');

  useEffect(() => {
    if (isOpen && userId) {
      fetchAllScores();
    }
  }, [isOpen, userId]);

  const fetchAllScores = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-scores-all?userId=${userId}&courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setAllScores(data.scores || {
          reading: [],
          listening: [],
          writing: [],
          speaking: []
        });
      } else {
        console.error('Failed to fetch detailed scores');
      }
    } catch (error) {
      console.error('Error fetching detailed scores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTestTypeConfig = (type: 'reading' | 'listening' | 'writing' | 'speaking') => {
    switch (type) {
      case 'reading':
        return {
          icon: BookOpen,
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          accent: 'bg-orange-200',
          name: 'Reading'
        };
      case 'listening':
        return {
          icon: Headphones,
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          accent: 'bg-green-200',
          name: 'Listening'
        };
      case 'speaking':
        return {
          icon: Mic,
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          accent: 'bg-blue-200',
          name: 'Speaking'
        };
      case 'writing':
        return {
          icon: PenTool,
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          accent: 'bg-purple-200',
          name: 'Writing'
        };
    }
  };

  const calculateTrend = (scores: TestScore[]) => {
    if (scores.length < 2) return 'stable';
    const recent = scores.slice(-3).reduce((sum, score) => sum + score.percentage, 0) / Math.min(3, scores.length);
    const earlier = scores.slice(-6, -3).reduce((sum, score) => sum + score.percentage, 0) / Math.min(3, scores.slice(-6, -3).length);
    
    if (recent > earlier + 5) return 'up';
    if (recent < earlier - 5) return 'down';
    return 'stable';
  };

  const groupScoresByTest = (scores: TestScore[]) => {
    return scores.reduce((acc, score) => {
      const testId = score.test_id;
      if (!acc[testId]) {
        acc[testId] = [];
      }
      acc[testId].push(score);
      return acc;
    }, {} as Record<string, TestScore[]>);
  };

  const testTypes: Array<'reading' | 'listening' | 'writing' | 'speaking'> = ['reading', 'listening', 'writing', 'speaking'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Test Scores Overview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {testTypes.map((testType) => {
                    const config = getTestTypeConfig(testType);
                    const Icon = config.icon;
                    const score = skillScores[testType] || 0;
                    const tests = calculateTestsFromSections(courseId, testType, testAttempts[testType] || 0);
                    const trend = calculateTrend(allScores[testType]);
                    
                    return (
                      <div
                        key={testType}
                        onClick={() => setActiveTab(testType)}
                        className={`${config.bg} rounded-lg p-4 border cursor-pointer transition-all hover:shadow-md ${
                          activeTab === testType ? `${config.border} border-2` : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`h-5 w-5 ${config.text}`} />
                          <span className={`font-medium ${config.text}`}>{config.name}</span>
                        </div>
                        <div className={`text-2xl font-bold ${config.text} mb-1`}>
                          {Math.round(score)}%
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {tests} tests completed
                        </div>
                        <div className="flex items-center gap-1">
                          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {trend === 'stable' && <Minus className="h-4 w-4 text-yellow-600" />}
                          <span className={`text-xs font-medium ${
                            trend === 'up' ? 'text-green-600' : 
                            trend === 'down' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed View */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {getTestTypeConfig(activeTab).name} Test Details
                  </h3>
                </div>

                {allScores[activeTab].length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className={`w-16 h-16 mx-auto rounded-full ${getTestTypeConfig(activeTab).bg} flex items-center justify-center mb-4`}>
                      {React.createElement(getTestTypeConfig(activeTab).icon, {
                        className: `h-8 w-8 ${getTestTypeConfig(activeTab).text}`
                      })}
                    </div>
                    <p>No test results found for {getTestTypeConfig(activeTab).name.toLowerCase()}</p>
                    <p className="text-sm mt-1">Complete some tests to see detailed scores here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupScoresByTest(allScores[activeTab])).map(([testId, scores]) => {
                      const sortedScores = scores.sort((a, b) => a.section - b.section);
                      const testAverage = scores.reduce((sum, score) => sum + score.percentage, 0) / scores.length;
                      const config = getTestTypeConfig(activeTab);
                      
                      return (
                        <div key={testId} className={`${config.bg} rounded-lg p-4 border ${config.border}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className={`font-semibold ${config.text}`}>Test {testId}</h4>
                            <div className={`px-3 py-1 rounded-full ${config.accent} ${config.text} text-sm font-medium`}>
                              {Math.round(testAverage)}% Average
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {sortedScores.map((score) => (
                              <div key={score.id} className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Section {score.section}
                                  </span>
                                  <span className={`text-sm font-bold ${config.text}`}>
                                    {Math.round(score.percentage)}%
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                  {score.score}/{score.total_score} points
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(score.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestScoresModal;