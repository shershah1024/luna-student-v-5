'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen, Clock, Star, Globe, Target, ArrowRight, BookText, Brain, Lightbulb } from 'lucide-react';

interface TextIntroductionProps {
  courseId: string;
  task_id: string;
  onComplete: () => void;
}

interface KeyVocabulary {
  word: string;
  translation: string;
  context: string;
}

interface LessonData {
  overview_title: string;
  introduction_text: string;
  chapter_theme?: string;
  exercise_objective?: string;
  key_vocabulary?: KeyVocabulary[];
  cultural_context?: string;
  learning_goals?: string[];
  difficulty_level?: string;
  estimated_duration_minutes?: number;
  isBasicData?: boolean;
}

export default function TextIntroduction({ courseId, task_id, onComplete }: TextIntroductionProps) {
  const router = useRouter();
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        const response = await fetch(`/api/theme-overview/${task_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch theme overview');
        }
        const data = await response.json();
        setLessonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [task_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !lessonData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load lesson data'}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[600px]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Hero Section - Simple */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-8 leading-tight">
            {lessonData.overview_title}
          </h1>
        </div>

        {/* Learning Goals - Clean Cards */}
        {lessonData.learning_goals && lessonData.learning_goals.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">What you'll learn</h3>
              <p className="text-gray-600">Master these essential skills in this lesson</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessonData.learning_goals.map((goal, index) => (
                <div 
                  key={index} 
                  className="group relative p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-gray-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed pt-1.5">{goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Goals for basic data */}
        {lessonData.isBasicData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {lessonData.chapter_theme && (
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Brain className="h-3 w-3 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Chapter Theme</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {lessonData.chapter_theme}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {lessonData.exercise_objective && (
              <Card className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-3 w-3 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">Learning Objectives</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {lessonData.exercise_objective}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Introduction - Magazine Style */}
        <div className="mb-12">
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Decorative header */}
            <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400"></div>
            
            <div className="p-8 sm:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-16 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Introduction</p>
                  <h2 className="text-xl font-bold text-gray-800">Let's begin your journey</h2>
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-700 leading-loose whitespace-pre-line text-lg font-light">
                  {lessonData.introduction_text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Side by Side */}
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          {/* Key Vocabulary - Modern Card */}
          {lessonData.key_vocabulary && lessonData.key_vocabulary.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header with gradient accent */}
              <div className="relative bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Key Vocabulary</h3>
                    <p className="text-sm text-gray-600">Essential words for this lesson</p>
                  </div>
                </div>
              </div>
              
              {/* Vocabulary List */}
              <div className="p-6">
                <div className="space-y-4">
                  {lessonData.key_vocabulary.map((vocab, index) => (
                    <div key={index} className="group p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-bold text-gray-900 text-lg">{vocab.word}</span>
                        <span className="text-orange-600 font-medium">{vocab.translation}</span>
                      </div>
                      <p className="text-sm text-gray-600 italic bg-white/60 px-3 py-1 rounded-full inline-block">
                        {vocab.context}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cultural Context - Elegant Card */}
          {lessonData.cultural_context && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header with gradient accent */}
              <div className="relative bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Cultural Context</h3>
                    <p className="text-sm text-gray-600">Understanding German culture</p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="relative">
                  {/* Quote-style decoration */}
                  <div className="absolute top-0 left-0 text-6xl text-indigo-200 font-serif leading-none">"</div>
                  <div className="pl-8 pt-4">
                    <p className="text-gray-700 leading-relaxed text-lg font-light">
                      {lessonData.cultural_context}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Floating Style */}
        <div className="text-center">
          <div className="relative inline-block">
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-30 scale-110"></div>
            
            <Button 
              onClick={() => {
                onComplete();
                router.push(`/lessons`);
              }}
              size="lg"
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 border-0"
            >
              <div className="flex items-center gap-3">
                <span>Continue to Exercises</span>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}