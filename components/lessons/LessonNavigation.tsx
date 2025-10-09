'use client';

import { CheckCircle, Lock, Play, BookOpen, Volume2, Edit, MessageSquare, Target, BarChart3 } from 'lucide-react';

interface LessonSection {
  id: string;
  section_order: number;
  section_type: string;
  title: string;
  estimated_duration: number;
  is_required: boolean;
}

interface LessonNavigationProps {
  sections: LessonSection[];
  currentSectionIndex: number;
  completedSections: string[];
  onNavigate: (index: number) => void;
}

export default function LessonNavigation({
  sections,
  currentSectionIndex,
  completedSections,
  onNavigate,
}: LessonNavigationProps) {
  
  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'introduction':
        return <Play className="h-4 w-4" />;
      case 'vocabulary_preview':
      case 'vocabulary_tutor':
        return <BookOpen className="h-4 w-4" />;
      case 'grammar_focus':
      case 'grammar_tutor':
        return <Target className="h-4 w-4" />;
      case 'reading_task':
        return <BookOpen className="h-4 w-4" />;
      case 'listening_task':
        return <Volume2 className="h-4 w-4" />;
      case 'writing_task':
        return <Edit className="h-4 w-4" />;
      case 'speaking_task':
        return <MessageSquare className="h-4 w-4" />;
      case 'practice_exercise':
        return <Target className="h-4 w-4" />;
      case 'review_assessment':
        return <BarChart3 className="h-4 w-4" />;
      case 'general_tutor':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
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
      default:
        return sectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getSectionStatus = (section: LessonSection, index: number) => {
    const isCompleted = completedSections.includes(section.id);
    const isCurrent = index === currentSectionIndex;

    if (isCompleted) return 'completed';
    if (isCurrent) return 'current';
    return 'unlocked'; // All sections are unlocked
  };

  const getSectionClasses = (status: string, isRequired: boolean) => {
    const baseClasses = "flex items-center gap-3 p-4 rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md border";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 hover:from-green-100 hover:to-emerald-100`;
      case 'current':
        return `${baseClasses} bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-800 ring-2 ring-red-200 shadow-lg`;
      case 'unlocked':
        return `${baseClasses} bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-700 hover:from-gray-50 hover:to-gray-100 hover:border-gray-300`;
      default:
        return `${baseClasses} bg-gradient-to-r from-white to-gray-50 border-gray-200 text-gray-700`;
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">Lesson Sections</h3>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-sm text-white/90 font-medium">
            {completedSections.length} of {sections.filter(s => s.is_required).length} completed
          </p>
        </div>
      </div>
      
      <div className="p-6 bg-white space-y-3">
        {sections.map((section, index) => {
          const status = getSectionStatus(section, index);
          
          return (
            <div
              key={section.id}
              className={getSectionClasses(status, section.is_required)}
              onClick={() => onNavigate(index)}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  getSectionIcon(section.section_type)
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {section.section_order}. {section.title}
                    </span>
                    {!section.is_required && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        Optional
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600 font-medium">
                    {getSectionTypeLabel(section.section_type)}
                  </span>
                  {section.estimated_duration && (
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                      {section.estimated_duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 text-xs text-gray-700 space-y-2">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-semibold">Completed sections</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-red-400 rounded-full shadow-sm"></div>
          <span className="font-semibold">Current section</span>
        </div>
      </div>
    </div>
  );
}