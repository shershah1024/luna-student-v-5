'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, HelpCircle, Eye, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface ReadingPassage {
  title: string;
  content: string;
  key_vocabulary: string[];
  main_concepts: string[];
  difficulty_score: number;
  reading_level: string;
  target_audience?: string;
  summary: string;
  learning_objectives: string[];
}

interface Question {
  question: string;
  options?: Array<{
    option: string;
    is_correct: boolean;
  }>;
  answer?: string;
  explanation: string;
  points: number;
  type: string;
}

interface ReadingTest {
  reading_text: ReadingPassage;
  questions: {
    [key: string]: Question[];
  };
  plan: {
    total_points: number;
    questions: Array<{
      question_number: number;
      question_type: string;
      focus_area: string;
      points: number;
    }>;
  };
}

export default function CreateReadingMaterialPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'passage' | 'test'>('passage');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingPassage | ReadingTest | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    saved: boolean;
    database_id?: string;
    message?: string;
  } | null>(null);

  // Form state for reading instructions
  const [topic, setTopic] = useState('');
  const [textType, setTextType] = useState<string>('');
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [wordCount, setWordCount] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyConcepts, setKeyConcepts] = useState('');

  // Form state for question instructions (test mode only)
  const [totalPoints, setTotalPoints] = useState('10');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const textTypes = [
    { value: 'article', label: 'Article' },
    { value: 'news', label: 'News' },
    { value: 'story', label: 'Story' },
    { value: 'essay', label: 'Essay' },
    { value: 'report', label: 'Report' },
    { value: 'tutorial', label: 'Tutorial' }
  ];

  const cefrLevels = [
    { value: 'A1', label: 'A1 - Beginner (50-150 words)' },
    { value: 'A2', label: 'A2 - Elementary (150-250 words)' },
    { value: 'B1', label: 'B1 - Intermediate (250-400 words)' },
    { value: 'B2', label: 'B2 - Upper-Intermediate (400-600 words)' },
    { value: 'C1', label: 'C1 - Advanced (600-800 words)' },
    { value: 'C2', label: 'C2 - Proficient (800-1200 words)' }
  ];

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'fill_in_blanks', label: 'Fill in Blanks' },
    { value: 'checkbox', label: 'Checkbox (Multiple Correct)' },
    { value: 'matching', label: 'Matching' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'sequence', label: 'Sequence/Order' },
    { value: 'vocabulary', label: 'Vocabulary' },
    { value: 'open_ended', label: 'Open Ended' }
  ];

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionTypes([...selectedQuestionTypes, type]);
    } else {
      setSelectedQuestionTypes(selectedQuestionTypes.filter(t => t !== type));
    }
  };

  const validateForm = () => {
    if (!topic.trim()) {
      setError('Topic is required');
      return false;
    }
    if (!textType) {
      setError('Text type is required');
      return false;
    }
    if (mode === 'test') {
      if (!totalPoints || parseInt(totalPoints) < 1) {
        setError('Total points must be a positive number');
        return false;
      }
    }
    return true;
  };

  const generateMaterial = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = mode === 'passage' 
        ? '/api/materials/reading/generate-passage'
        : '/api/materials/reading/generate-test';

      const payload = mode === 'passage' 
        ? {
            topic: topic.trim(),
            text_type: textType,
            cefr_level: cefrLevel,
            ...(wordCount && { word_count: parseInt(wordCount) }),
            ...(customInstructions && { custom_instructions: customInstructions.trim() }),
            ...(targetAudience && { target_audience: targetAudience.trim() }),
            ...(keyConcepts && { key_concepts: keyConcepts.split(',').map(c => c.trim()).filter(Boolean) })
          }
        : {
            reading_instructions: {
              topic: topic.trim(),
              text_type: textType,
              cefr_level: cefrLevel,
              ...(wordCount && { word_count: parseInt(wordCount) }),
              ...(customInstructions && { custom_instructions: customInstructions.trim() }),
              ...(targetAudience && { target_audience: targetAudience.trim() }),
              ...(keyConcepts && { key_concepts: keyConcepts.split(',').map(c => c.trim()).filter(Boolean) })
            },
            question_instructions: {
              total_points: parseInt(totalPoints),
              ...(selectedQuestionTypes.length > 0 && { question_types: selectedQuestionTypes }),
              ...(additionalInstructions && { additional_instructions: additionalInstructions.trim() })
            }
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate material');
      }

      setResult(data.data);
      
      // Handle save status
      if (data.saved) {
        setSaveStatus({
          saved: true,
          database_id: data.database_id,
          message: `✅ Material saved to database (ID: ${data.database_id})`
        });
      } else {
        setSaveStatus({
          saved: false,
          message: '⚠️ Material generated but not saved to database'
        });
      }

    } catch (error) {
      console.error('Error generating material:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setTextType('');
    setCefrLevel('B1');
    setWordCount('');
    setCustomInstructions('');
    setTargetAudience('');
    setKeyConcepts('');
    setTotalPoints('10');
    setSelectedQuestionTypes([]);
    setAdditionalInstructions('');
    setResult(null);
    setError(null);
    setSaveStatus(null);
  };

  const handleStudentPreview = () => {
    if (!saveStatus?.database_id) {
      setError('Please generate and save the material first before previewing.');
      return;
    }
    
    // Open student interface in new tab
    const taskId = `material-${saveStatus.database_id}`;
    const studentUrl = `/lessons/reading/${taskId}`;
    window.open(studentUrl, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8" />
          Create Reading Materials
        </h1>
        <p className="text-muted-foreground">
          Generate CEFR-aligned reading passages and comprehension tests using AI
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={mode === 'passage' ? 'default' : 'outline'}
          onClick={() => setMode('passage')}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Reading Passage Only
        </Button>
        <Button
          variant={mode === 'test' ? 'default' : 'outline'}
          onClick={() => setMode('test')}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Complete Test (Passage + Questions)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Set up the parameters for your reading material
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Environment, Technology, Travel"
              />
            </div>

            {/* Text Type */}
            <div className="space-y-2">
              <Label htmlFor="text-type">Text Type *</Label>
              <Select value={textType} onValueChange={setTextType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select text type" />
                </SelectTrigger>
                <SelectContent>
                  {textTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CEFR Level */}
            <div className="space-y-2">
              <Label htmlFor="cefr-level">CEFR Level</Label>
              <Select value={cefrLevel} onValueChange={setCefrLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cefrLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Word Count */}
            <div className="space-y-2">
              <Label htmlFor="word-count">Word Count (Optional)</Label>
              <Input
                id="word-count"
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value)}
                placeholder="Auto-adjusted based on CEFR level"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="target-audience">Target Audience (Optional)</Label>
              <Input
                id="target-audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., German language learners, teenagers"
              />
            </div>

            {/* Key Concepts */}
            <div className="space-y-2">
              <Label htmlFor="key-concepts">Key Concepts (Optional)</Label>
              <Input
                id="key-concepts"
                value={keyConcepts}
                onChange={(e) => setKeyConcepts(e.target.value)}
                placeholder="Comma-separated, e.g., sustainability, climate change"
              />
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="custom-instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Any specific requirements or style preferences..."
                rows={3}
              />
            </div>

            {/* Question Configuration (Test mode only) */}
            {mode === 'test' && (
              <>
                <hr className="my-4" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Question Configuration</h3>
                  
                  {/* Total Points */}
                  <div className="space-y-2">
                    <Label htmlFor="total-points">Total Points *</Label>
                    <Input
                      id="total-points"
                      type="number"
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(e.target.value)}
                      min="1"
                      placeholder="10"
                    />
                  </div>

                  {/* Question Types */}
                  <div className="space-y-2">
                    <Label>Question Types (Optional)</Label>
                    <p className="text-sm text-muted-foreground">
                      Leave empty for AI to choose optimal question types
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {questionTypes.map(type => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={type.value}
                            checked={selectedQuestionTypes.includes(type.value)}
                            onCheckedChange={(checked) => 
                              handleQuestionTypeChange(type.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={type.value} className="text-sm">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Instructions for Questions */}
                  <div className="space-y-2">
                    <Label htmlFor="additional-instructions">Additional Instructions (Optional)</Label>
                    <Textarea
                      id="additional-instructions"
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      placeholder="Focus on specific skills, difficulty preferences, etc."
                      rows={2}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={generateMaterial}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate {mode === 'passage' ? 'Passage' : 'Test'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {saveStatus && (
              <div className="space-y-3">
                <Alert variant={saveStatus.saved ? "default" : "destructive"}>
                  <AlertDescription>{saveStatus.message}</AlertDescription>
                </Alert>
                
                {saveStatus.saved && saveStatus.database_id && (
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handleStudentPreview}
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Preview as Student
                    </Button>
                    <Button 
                      onClick={() => router.push('/materials/manage')}
                      variant="outline"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View All Materials
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Generated reading material will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Generating material...</span>
              </div>
            )}

            {result && mode === 'passage' && (
              <div className="space-y-4">
                <ReadingPassageDisplay passage={result as ReadingPassage} />
              </div>
            )}

            {result && mode === 'test' && (
              <div className="space-y-4">
                <ReadingTestDisplay test={result as ReadingTest} />
              </div>
            )}

            {!loading && !result && (
              <div className="text-center py-12 text-muted-foreground">
                Configure your reading material and click generate to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReadingPassageDisplay({ passage }: { passage: ReadingPassage }) {
  // Add null check for passage
  if (!passage) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Reading passage data is not available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{passage.reading_level || 'Unknown'}</Badge>
        <Badge variant="outline">
          Difficulty: {passage.difficulty_score ? (passage.difficulty_score * 100).toFixed(0) : '0'}%
        </Badge>
        <Badge variant="outline">
          ~{passage.content ? passage.content.split(' ').length : 0} words
        </Badge>
      </div>

      {/* Title and Content */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{passage.title}</h3>
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: passage.content.replace(/\n/g, '<br>') }} />
        </div>
      </div>

      {/* Key Vocabulary */}
      {passage.key_vocabulary && passage.key_vocabulary.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Key Vocabulary</h4>
          <div className="flex flex-wrap gap-1">
            {passage.key_vocabulary.map((word, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {word}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      {passage.learning_objectives && passage.learning_objectives.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Learning Objectives</h4>
          <ul className="text-sm space-y-1">
            {passage.learning_objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {passage.summary && (
        <div className="space-y-2">
          <h4 className="font-semibold">Summary</h4>
          <p className="text-sm text-muted-foreground">{passage.summary}</p>
        </div>
      )}
    </div>
  );
}

function ReadingTestDisplay({ test }: { test: ReadingTest }) {
  const totalQuestions = test.questions ? Object.values(test.questions)
    .reduce((total, questionArray) => total + questionArray.length, 0) : 0;

  // Add null checks for test properties
  if (!test || !test.reading_text) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Test data is incomplete or loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Test Overview */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{test.reading_text.reading_level}</Badge>
          <Badge variant="outline">
            {totalQuestions} questions
          </Badge>
          <Badge variant="outline">
            {test.plan?.total_points || 0} points
          </Badge>
        </div>
      </div>

      {/* Reading Passage */}
      <ReadingPassageDisplay passage={test.reading_text} />

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Questions</h3>
        
        {test.questions && Object.keys(test.questions).length > 0 ? (
          Object.entries(test.questions).map(([questionType, questions]) => {
            if (!questions || questions.length === 0) return null;
            
            return (
              <div key={questionType} className="space-y-3">
                <h4 className="font-semibold capitalize">
                  {questionType.replace('_', ' ')} ({questions.length})
                </h4>
                
                {questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium">{question.question}</p>
                      <Badge variant="outline" className="ml-2">
                        {question.points} pts
                      </Badge>
                    </div>
                    
                    {/* Multiple Choice Options */}
                    {question.options && (
                      <div className="space-y-1">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className={`p-2 rounded ${
                            option.is_correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}>
                            <span className="font-medium">
                              {String.fromCharCode(97 + optionIndex)}) 
                            </span>
                            <span className="ml-2">{option.option}</span>
                            {option.is_correct && (
                              <Badge variant="outline" className="ml-2 text-green-600">
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct Answer */}
                    {question.answer && (
                      <div className="bg-green-50 border border-green-200 p-2 rounded">
                        <strong>Answer:</strong> {question.answer}
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No questions were generated for this test.</p>
          </div>
        )}
      </div>

      {/* Question Plan */}
      {test.plan && test.plan.questions && (
        <div className="space-y-2">
          <h4 className="font-semibold">Question Plan</h4>
          <div className="text-sm">
            <div className="grid grid-cols-1 gap-1">
              {test.plan.questions.map((questionPlan, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>
                    Q{questionPlan.question_number}: {questionPlan.question_type.replace('_', ' ')} 
                    ({questionPlan.focus_area})
                  </span>
                  <Badge variant="outline">{questionPlan.points} pts</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}