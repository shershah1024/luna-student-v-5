'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  HelpCircle, 
  Eye, 
  Edit, 
  Share2, 
  Download, 
  Clock, 
  Target, 
  Users,
  Tag,
  FileText,
  CheckCircle,
  PlayCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UniversalQuestion from './UniversalQuestion';

// Types based on our database schema
interface TeachezeeMaterial {
  id: string;
  user_id: string;
  type: 'reading_passage' | 'reading_test' | 'listening_test';
  title: string;
  content: string;
  cefr_level: string;
  difficulty_score: number;
  target_audience?: string;
  metadata: {
    key_vocabulary?: string[];
    main_concepts?: string[];
    learning_objectives?: string[];
    summary?: string;
    word_count?: number;
    total_questions?: number;
    total_points?: number;
    generation_source?: string;
    [key: string]: any;
  };
  status: 'draft' | 'published' | 'archived';
  is_public: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface TeachezeeQuestion {
  id: string;
  material_id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  points: number;
  explanation?: string;
  answer_data: any;
  created_at: string;
}

interface MaterialDisplayProps {
  material: TeachezeeMaterial;
  questions?: TeachezeeQuestion[];
  mode?: 'preview' | 'edit' | 'student';
  onEdit?: (material: TeachezeeMaterial) => void;
  onShare?: (material: TeachezeeMaterial) => void;
  onPreview?: (material: TeachezeeMaterial) => void;
}

export default function MaterialDisplay({
  material,
  questions = [],
  mode = 'preview',
  onEdit,
  onShare,
  onPreview
}: MaterialDisplayProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [previewMode, setPreviewMode] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<{[key: string]: any}>({});
  const [studentResults, setStudentResults] = useState<{[key: string]: boolean}>({});

  // Handle student question answers
  const handleQuestionAnswer = (questionId: string, answer: any, isCorrect: boolean) => {
    setStudentAnswers(prev => ({ ...prev, [questionId]: answer }));
    setStudentResults(prev => ({ ...prev, [questionId]: isCorrect }));
  };

  // Calculate scores
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const scoredPoints = Object.entries(studentResults).reduce((sum, [qId, correct]) => {
    if (correct) {
      const question = questions.find(q => q.id === qId);
      return sum + (question?.points || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Material Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-2xl">{material.title}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{material.cefr_level}</Badge>
                <Badge variant={material.type === 'reading_test' ? 'default' : 'outline'}>
                  {material.type === 'reading_passage' ? 'Reading Passage' : 'Complete Test'}
                </Badge>
                <Badge variant="outline">
                  Difficulty: {(material.difficulty_score * 100).toFixed(0)}%
                </Badge>
                {material.metadata.word_count && (
                  <Badge variant="outline">
                    ~{material.metadata.word_count} words
                  </Badge>
                )}
                {material.metadata.total_questions && (
                  <Badge variant="outline">
                    {material.metadata.total_questions} questions
                  </Badge>
                )}
                {material.metadata.total_points && (
                  <Badge variant="outline">
                    {material.metadata.total_points} points
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(material.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {material.target_audience || 'General audience'}
                </div>
                {material.metadata.generation_source && (
                  <Badge variant="outline" className="text-xs">
                    Generated by {material.metadata.generation_source}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {mode === 'preview' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {previewMode ? 'Teacher View' : 'Student Preview'}
                  </Button>
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(material)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {onShare && (
                    <Button variant="outline" size="sm" onClick={() => onShare(material)}>
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  )}
                </>
              )}
              {mode === 'student' && questions.length > 0 && (
                <div className="text-right">
                  <div className="text-sm font-medium">Score</div>
                  <div className="text-lg font-bold text-blue-600">
                    {scoredPoints} / {totalPoints}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          {questions.length > 0 && (
            <TabsTrigger value="questions">
              <HelpCircle className="h-4 w-4 mr-2" />
              Questions ({questions.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="metadata">
            <Tag className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Target className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reading Passage
              </CardTitle>
              {material.metadata.summary && (
                <CardDescription>{material.metadata.summary}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="text-lg leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: material.content.replace(/\n/g, '<br>') 
                    }} 
                  />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <div className="space-y-4">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <HelpCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Questions Available
                  </h3>
                  <p className="text-gray-500">
                    This material doesn't have any questions associated with it.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Questions Header */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Questions</CardTitle>
                        <CardDescription>
                          {questions.length} questions · {totalPoints} total points
                        </CardDescription>
                      </div>
                      {mode === 'student' && (
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Your Progress</div>
                          <div className="text-lg font-bold">
                            {Object.keys(studentAnswers).length} / {questions.length} answered
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Questions List */}
                {questions
                  .sort((a, b) => a.question_number - b.question_number)
                  .map((question, index) => (
                    <UniversalQuestion
                      key={question.id}
                      id={question.id}
                      questionNumber={question.question_number}
                      questionType={question.question_type as any}
                      questionText={question.question_text}
                      points={question.points}
                      explanation={question.explanation}
                      answerData={question.answer_data}
                      onAnswer={handleQuestionAnswer}
                      showResult={mode === 'preview' && !previewMode}
                      disabled={mode === 'preview' && !previewMode}
                    />
                  ))}

                {mode === 'student' && questions.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Final Score</h3>
                          <p className="text-sm text-gray-600">
                            {Object.keys(studentResults).filter(k => studentResults[k]).length} correct answers
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {totalPoints > 0 ? Math.round((scoredPoints / totalPoints) * 100) : 0}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {scoredPoints} / {totalPoints} points
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learning Objectives */}
            {material.metadata.learning_objectives && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {material.metadata.learning_objectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Key Vocabulary */}
            {material.metadata.key_vocabulary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Key Vocabulary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {material.metadata.key_vocabulary.map((word: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Concepts */}
            {material.metadata.main_concepts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Main Concepts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {material.metadata.main_concepts.map((concept: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span className="text-sm">{concept}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Material Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Material Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge variant="outline">
                    {material.type === 'reading_passage' ? 'Reading Passage' : 'Complete Test'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">CEFR Level:</span>
                  <Badge>{material.cefr_level}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Difficulty:</span>
                  <span className="text-sm">{(material.difficulty_score * 100).toFixed(0)}%</span>
                </div>
                {material.metadata.word_count && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Word Count:</span>
                    <span className="text-sm">~{material.metadata.word_count}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={material.status === 'published' ? 'default' : 'secondary'}>
                    {material.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Public:</span>
                  <Badge variant={material.is_public ? 'default' : 'outline'}>
                    {material.is_public ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Material Analytics
              </CardTitle>
              <CardDescription>
                Performance and usage statistics for this material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-500">
                  Student performance analytics and usage statistics will be available here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}