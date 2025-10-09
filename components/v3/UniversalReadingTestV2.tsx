'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, BookOpen, CheckCircle, XCircle } from 'lucide-react';

// Import adaptive content renderers
import ReadingArticlesRenderer from '../reading/universal/content/ReadingArticlesRenderer';
import EmailReadingRenderer from '../reading/universal/content/EmailReadingRenderer';
import MultipleSignsRenderer from '../reading/universal/content/MultipleSignsRenderer';
import MultipleEverydaySituationsRenderer from '../reading/universal/content/MultipleEverydaySituationsRenderer';

// Import adaptive question renderers
import MultipleChoiceQuestion from '../reading/universal/questions/MultipleChoiceQuestion';
import TrueFalseQuestion from '../reading/universal/questions/TrueFalseQuestion';
import LocationChoiceQuestion from '../reading/universal/questions/LocationChoiceQuestion';
import SourceChoiceQuestion from '../reading/universal/questions/SourceChoiceQuestion';

interface ReadingQuestion {
  id: string;
  question_code: string;
  question_number: number;
  question_type: string;
  passage_text?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  points: number;
}

interface ReadingSection {
  id: string;
  section_code: string;
  section_number: number;
  title: string;
  instructions: string;
  duration_minutes: number;
  max_score: number;
  section_order: number;
  passage_count: number;
  passage_type: string;
  question_format: string;
  questions: ReadingQuestion[];
}

interface UniversalReadingTestV2Props {
  examCode: string;
  userId?: string;
  onComplete?: (results: any) => void;
  onSectionComplete?: (sectionId: string, responses: any) => void;
}

export default function UniversalReadingTestV2({ 
  examCode, 
  userId = 'test_user', 
  onComplete,
  onSectionComplete 
}: UniversalReadingTestV2Props) {
  const [sections, setSections] = useState<ReadingSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(Date.now());
  const [sectionStartTime, setSectionStartTime] = useState(Date.now());

  useEffect(() => {
    fetchReadingSections();
  }, [examCode]);

  const fetchReadingSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v3/exams/${examCode}/reading`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reading sections');
      }

      const data = await response.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching reading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getCurrentSection = () => sections[currentSectionIndex];
  
  const getSectionResponses = (section: ReadingSection) => {
    return section.questions.filter(q => responses[q.id]).length;
  };

  const getTotalSectionQuestions = (section: ReadingSection) => {
    return section.questions.length;
  };

  // Adaptive content detection and rendering
  const detectContentType = (passageText: string, passageType: string) => {
    // Detect based on passage_type from database
    if (passageType === 'signs_and_notices' || passageType === 'signs') {
      return 'sign_collection';
    }
    if (passageType === 'personal_messages' || passageType === 'emails') {
      return 'email_correspondence';
    }
    if (passageType === 'everyday_situations' || passageType === 'advertisements') {
      return 'multi_passage';
    }
    if (passageType === 'blog_posts' || passageType === 'articles_and_reports') {
      return 'blog_article';
    }
    if (passageType === 'magazine_article' || passageType === 'complex_articles') {
      return 'blog_article';
    }
    
    // Fallback detection based on content patterns
    if (passageText?.includes('Liebe ') || passageText?.includes('Hallo ') || passageText?.includes('@')) {
      return 'email_correspondence';
    }
    if (passageText?.includes(':') && passageText.split(':').length >= 2 && passageText.length < 200) {
      return 'sign_collection';
    }
    
    return 'multi_passage'; // Default fallback
  };

  const createUniversalContentBlock = (questions: ReadingQuestion[], section: ReadingSection) => {
    // Group questions by their passage_text to create content blocks
    const questionGroups: { [key: string]: ReadingQuestion[] } = {};
    
    questions.forEach(question => {
      const key = question.passage_text || 'no_passage';
      if (!questionGroups[key]) {
        questionGroups[key] = [];
      }
      questionGroups[key].push(question);
    });

    return Object.entries(questionGroups).map(([passageText, groupedQuestions], index) => {
      const contentType = detectContentType(passageText, section.passage_type);
      
      // Create content_data based on detected type
      let content_data: any = {};
      
      if (contentType === 'email_correspondence') {
        content_data = {
          email_text: passageText,
          sender: 'Unknown',
          recipient: 'Unknown',
          subject: 'Message',
          metadata: { type: 'personal_message' }
        };
      } else if (contentType === 'sign_collection') {
        content_data = {
          signs: [{ text: passageText, type: 'notice' }]
        };
      } else if (contentType === 'blog_article') {
        content_data = {
          blog_text: passageText,
          blog_title: `Article ${index + 1}`,
          blog_author: 'Unknown',
          publication_date: new Date().toISOString()
        };
      } else {
        // Default multi_passage
        content_data = {
          passages: [{ 
            text: passageText, 
            title: `Text ${index + 1}`,
            source_type: section.passage_type 
          }]
        };
      }

      return {
        id: `block_${index}`,
        block_type: 'primary_content',
        order_number: index + 1,
        title: `Content Block ${index + 1}`,
        content_data,
        questions: groupedQuestions.map(q => ({
          id: q.id,
          question_number: q.question_number,
          question_type: q.question_type,
          question_text: q.question_text,
          answer_options: [q.option_a, q.option_b, q.option_c],
          correct_answer: q.correct_option,
          explanation: '',
          difficulty_level: 'A1',
          skill_focus: ['reading'],
          is_example: false,
          order_number: q.question_number
        })),
        contentType // Add detected content type
      };
    });
  };

  const createMockTemplate = (contentType: string) => ({
    id: 'mock_template',
    template_name: 'V3 Adapter Template',
    category_name: contentType,
    context_tags: [],
    difficulty_level: 'A1',
    content_schema: {},
    question_schema: {},
    rendering_config: {}
  });

  const renderAdaptiveContent = (contentBlock: any) => {
    const template = createMockTemplate(contentBlock.contentType);
    const props = { contentBlock, template, isSubmitted: submitted };

    switch (contentBlock.contentType) {
      case 'email_correspondence':
        return <EmailReadingRenderer {...props} />;
      case 'blog_article':
        return <ReadingArticlesRenderer {...props} />;
      case 'sign_collection':
        return <MultipleSignsRenderer {...props} />;
      case 'source_comparison':
        return <MultipleEverydaySituationsRenderer {...props} />;
      default:
        return <ReadingArticlesRenderer {...props} />;
    }
  };

  const nextSection = async () => {
    const currentSection = getCurrentSection();
    if (currentSection && onSectionComplete) {
      const sectionResponses = currentSection.questions.map(q => ({
        question_id: q.id,
        response: responses[q.id] || '',
        time_spent: Math.floor((Date.now() - sectionStartTime) / 1000)
      }));
      onSectionComplete(currentSection.id, sectionResponses);
    }

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setSectionStartTime(Date.now());
    } else {
      await submitTest();
    }
  };

  const submitTest = async () => {
    const allResponses = sections.flatMap(section => 
      section.questions.map(question => ({
        question_id: question.id,
        response: responses[question.id] || '',
        time_spent: Math.floor((Date.now() - startTime) / 1000)
      }))
    );

    try {
      const response = await fetch(`/api/v3/exams/${examCode}/reading/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          exam_code: examCode,
          responses: allResponses,
          total_time_spent: Math.floor((Date.now() - startTime) / 1000)
        })
      });

      if (!response.ok) throw new Error('Failed to submit test');
      
      const scoreResults = await response.json();
      setResults(scoreResults);
      setSubmitted(true);
      onComplete?.(scoreResults);
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  const convertToUniversalQuestion = (question: ReadingQuestion) => {
    // Convert V3 question format to Universal question format
    const answerOptions = question.question_type === 'true_false' 
      ? ['Richtig', 'Falsch']
      : question.question_type === 'matching' || question.question_type === 'location_choice'
      ? [question.option_a, question.option_b, question.option_c].filter(Boolean)
      : [question.option_a, question.option_b, question.option_c].filter(Boolean);

    return {
      id: question.id,
      question_number: question.question_number,
      question_type: question.question_type,
      question_text: question.question_text,
      answer_options: answerOptions,
      correct_answer: question.question_type === 'true_false' 
        ? (question.correct_option === 'a' ? 'Richtig' : 'Falsch')
        : question.correct_option,
      explanation: '',
      difficulty_level: question.difficulty_level || 'B2',
      skill_focus: ['reading'],
      is_example: false,
      order_number: question.question_number
    };
  };

  const renderAdaptiveQuestion = (question: ReadingQuestion) => {
    const universalQuestion = convertToUniversalQuestion(question);
    const userResponse = responses[question.id];
    
    const handleQuestionResponse = (questionId: string, response: string) => {
      // Convert universal response back to V3 format
      let v3Response = response;
      if (question.question_type === 'true_false') {
        v3Response = response === 'Richtig' ? 'a' : 'b';
      } else if (question.question_type === 'multiple_choice') {
        // Find which option matches the response
        if (response === question.option_a) v3Response = 'a';
        else if (response === question.option_b) v3Response = 'b';
        else if (response === question.option_c) v3Response = 'c';
      }
      handleResponseChange(questionId, v3Response);
    };

    // Convert user response back to universal format for display
    let displayResponse = userResponse;
    if (question.question_type === 'true_false' && userResponse) {
      displayResponse = userResponse === 'a' ? 'Richtig' : 'Falsch';
    } else if (question.question_type === 'multiple_choice' && userResponse) {
      if (userResponse === 'a') displayResponse = question.option_a;
      else if (userResponse === 'b') displayResponse = question.option_b;
      else if (userResponse === 'c') displayResponse = question.option_c;
    }

    const questionProps = {
      question: universalQuestion,
      userResponse: displayResponse,
      onResponseChange: handleQuestionResponse,
      isSubmitted: submitted
    };

    // Route to appropriate question renderer based on type
    switch (question.question_type) {
      case 'true_false':
        return (
          <div key={question.id} className="mb-6 p-4 border rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <span className="font-semibold text-blue-600 min-w-0">
                {question.question_number}.
              </span>
              <div className="flex-1">
                <TrueFalseQuestion {...questionProps} />
              </div>
            </div>
          </div>
        );
      
      case 'matching':
      case 'location_choice':
        return (
          <div key={question.id} className="mb-6 p-4 border rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <span className="font-semibold text-blue-600 min-w-0">
                {question.question_number}.
              </span>
              <div className="flex-1">
                <LocationChoiceQuestion {...questionProps} />
              </div>
            </div>
          </div>
        );
      
      case 'gap_fill':
        return (
          <div key={question.id} className="mb-6 p-4 border rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <span className="font-semibold text-blue-600 min-w-0">
                {question.question_number}.
              </span>
              <div className="flex-1">
                <MultipleChoiceQuestion {...questionProps} />
              </div>
            </div>
          </div>
        );
      
      case 'multiple_choice':
      default:
        return (
          <div key={question.id} className="mb-6 p-4 border rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <span className="font-semibold text-blue-600 min-w-0">
                {question.question_number}.
              </span>
              <div className="flex-1">
                <MultipleChoiceQuestion {...questionProps} />
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading adaptive reading test...</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">No reading sections found for this exam</p>
      </div>
    );
  }

  const currentSection = getCurrentSection();
  if (!currentSection) return null;

  if (submitted && results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Reading Test Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{results.score}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{results.correct}/{results.total}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  <Clock className="h-5 w-5 inline mr-1" />
                  {Math.floor((Date.now() - startTime) / 1000)}s
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create adaptive content blocks for current section
  const contentBlocks = createUniversalContentBlock(currentSection.questions, currentSection);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Section Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            {currentSection.title}
            <span className="text-sm text-gray-500">
              ({currentSectionIndex + 1} of {sections.length}) • Adaptive Rendering
            </span>
          </CardTitle>
          <p className="text-gray-600">{currentSection.instructions}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Duration: {currentSection.duration_minutes} min</span>
            <span>Max Score: {currentSection.max_score} points</span>
            <span>Progress: {getSectionResponses(currentSection)}/{getTotalSectionQuestions(currentSection)}</span>
            <span>Type: {currentSection.passage_type}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Adaptive Content Blocks */}
      {contentBlocks.map((contentBlock, blockIndex) => (
        <Card key={contentBlock.id} className="mb-6">
          <CardContent className="pt-6">
            {/* Render content using adaptive renderer */}
            {renderAdaptiveContent(contentBlock)}

            {/* Render questions for this content block */}
            {contentBlock.questions.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">
                  Questions for this content:
                </h4>
                {contentBlock.questions.map((universalQuestion: any) => {
                  // Find the original question to render properly
                  const originalQuestion = currentSection.questions.find(q => q.id === universalQuestion.id);
                  return originalQuestion ? renderAdaptiveQuestion(originalQuestion) : null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Section {currentSectionIndex + 1} of {sections.length} • 
          {getSectionResponses(currentSection)}/{getTotalSectionQuestions(currentSection)} questions answered
        </div>
        
        <Button 
          onClick={nextSection}
          disabled={getSectionResponses(currentSection) === 0}
          className="px-8 py-3"
        >
          {currentSectionIndex < sections.length - 1 ? 'Next Section' : 'Submit Test'}
          {currentSectionIndex < sections.length - 1 && (
            <span className="ml-2">→</span>
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${((currentSectionIndex + (getSectionResponses(currentSection) / getTotalSectionQuestions(currentSection))) / sections.length) * 100}%` 
          }}
        ></div>
      </div>
    </div>
  );
}