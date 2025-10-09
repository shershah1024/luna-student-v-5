'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, BookOpen, Clock, Target, Play, CheckCircle, MessageSquare, Headphones, FileText, PenTool, BarChart3, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LessonPageHeader from '@/components/lessons/LessonPageHeader';

interface Lesson {
  id: string;
  course_id: string;
  level: string;
  lesson_number: number;
  title: string;
  description: string;
  objectives: string[];
  estimated_duration: number;
  difficulty_level: number;
  theme_name?: string;
}

interface LessonSection {
  id: string;
  section_order: number;
  section_type: string;
  title: string;
  instructions: string;
  content: any;
  estimated_duration: number;
  is_required: boolean;
}

interface UserProgress {
  sections_completed: string[];
  overall_progress: number;
}

export default function LessonOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const courseId = params.courseId as string;
  const lessonNumber = parseInt(params.lessonNumber as string);
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({ sections_completed: [], overall_progress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && lessonNumber && user) {
      fetchLessonData();
    }
  }, [courseId, lessonNumber, user]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson data
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_themes(name)
        `)
        .eq('course_id', courseId)
        .eq('lesson_number', lessonNumber)
        .single();

      if (lessonError) throw lessonError;

      const lessonWithTheme = {
        ...lessonData,
        theme_name: lessonData.lesson_themes?.name || null
      };

      setLesson(lessonWithTheme);

      // Fetch lesson sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('lesson_sections')
        .select('*')
        .eq('lesson_id', lessonData.id)
        .order('section_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('sections_completed, overall_progress')
        .eq('user_id', user?.id)
        .eq('lesson_id', lessonData.id)
        .single();

      if (progressData) {
        setUserProgress(progressData);
      }

    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'introduction':
      case 'conversation_practice':
        return <MessageSquare className="h-6 w-6" />;
      case 'vocabulary_preview':
      case 'vocabulary_tutor':
        return <BookOpen className="h-6 w-6" />;
      case 'grammar_focus':
      case 'grammar_tutor':
        return <Target className="h-6 w-6" />;
      case 'reading_task':
        return <FileText className="h-6 w-6" />;
      case 'listening_task':
        return <Headphones className="h-6 w-6" />;
      case 'writing_task':
        return <PenTool className="h-6 w-6" />;
      case 'speaking_task':
        return <MessageSquare className="h-6 w-6" />;
      case 'practice_exercise':
        return <Target className="h-6 w-6" />;
      case 'review_assessment':
        return <BarChart3 className="h-6 w-6" />;
      case 'general_tutor':
        return <MessageSquare className="h-6 w-6" />;
      default:
        return <Play className="h-6 w-6" />;
    }
  };

  const getSectionTypeLabel = (sectionType: string) => {
    switch (sectionType) {
      case 'introduction':
        return 'Introduction';
      case 'vocabulary_preview':
        return 'Vocabulary';
      case 'vocabulary_tutor':
        return 'Vocab Tutor';
      case 'grammar_focus':
        return 'Grammar';
      case 'grammar_tutor':
        return 'Grammar Tutor';
      case 'reading_task':
        return 'Reading';
      case 'listening_task':
        return 'Listening';
      case 'writing_task':
        return 'Writing';
      case 'speaking_task':
        return 'Speaking';
      case 'practice_exercise':
        return 'Practice';
      case 'review_assessment':
        return 'Assessment';
      case 'general_tutor':
        return 'Tutor';
      case 'conversation_practice':
        return 'Conversation Practice';
      default:
        return sectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getDifficultyStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${i < level ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const completedSectionsCount = userProgress.sections_completed.length;
  const totalSections = sections.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf2f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdf2f8] flex flex-col items-center pt-24 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white border border-red-200 rounded-xl p-6 mb-6 shadow-lg">
            <p className="text-red-700">{error}</p>
          </div>
          <Link
            href={`/courses/${courseId}/lessons`}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#fdf2f8] flex flex-col items-center pt-24 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white border border-yellow-200 rounded-xl p-6 shadow-lg">
            <p className="text-yellow-700">Lesson not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf2f8] text-gray-800 flex flex-col items-center pt-24 pb-32 px-4">
      {/* Back Navigation */}
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/courses/${courseId}/lessons`}
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all border border-red-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Lessons</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Header Image Section */}
      <LessonPageHeader
        courseId={courseId}
        title={lesson.title}
        subtitle={lesson.description}
        level={lesson.theme_name}
        icon={<BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white" />}
        badgeText={`Lesson ${lesson.lesson_number}`}
        decorativeNumber={lesson.lesson_number}
        badges={[
          { icon: <Target className="w-4 h-4 text-white" />, text: `${completedSectionsCount}/${totalSections} Completed` },
          { icon: <Clock className="w-4 h-4 text-white" />, text: `${lesson.estimated_duration} min` },
          { text: getDifficultyStars(lesson.difficulty_level).reduce((acc, star) => acc + star.props.children, '') }
        ]}
      />

      {/* Header */}
      <header className="w-full max-w-4xl mb-8 text-center">
        <p className="text-gray-600">Choose an exercise to continue your learning journey</p>
      </header>

      {/* Exercise Cards */}
      <div className="w-full max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => {
            const isCompleted = userProgress.sections_completed.includes(section.id);
            const sectionIcon = getSectionIcon(section.section_type);
            const sectionLabel = getSectionTypeLabel(section.section_type);

            return (
              <Link key={section.id} href={`/courses/${courseId}/units/${lessonNumber}/exercises/${section.section_order}`}>
                <Card 
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50/50 hover:border-green-300' 
                      : 'border-red-100 hover:border-red-300 bg-white'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={isCompleted ? "default" : "secondary"} 
                        className={`text-xs ${isCompleted ? 'bg-green-600' : 'bg-red-600 text-white'}`}
                      >
                        {index + 1}. {sectionLabel}
                      </Badge>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-red-600 transition-colors">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {section.instructions || `Complete this ${sectionLabel.toLowerCase()} exercise`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-end">
                      <div className="flex items-center gap-2 text-red-600">
                        {sectionIcon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 p-12 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-3">Content Coming Soon</h3>
            <p className="text-gray-600 text-lg">This lesson is still being prepared with exciting interactive content.</p>
          </div>
        )}
      </div>
    </div>
  );
}