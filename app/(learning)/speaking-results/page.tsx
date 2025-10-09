'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  Clock, 
  User, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  Download,
  Printer
} from 'lucide-react';

interface SpeakingResult {
  id: number;
  task_id: string;
  test_id: string;
  course: string;
  section: number;
  score: number;
  max_score: number;
  percentage: number;
  evaluation_data: {
    task_completion_score: number;
    communicative_effectiveness_score: number;
    detailed_feedback: {
      task_completion: string;
      pronunciation_clarity: string;
      vocabulary_usage: string;
      grammatical_accuracy: string;
      fluency_confidence: string;
      interaction_skills: string;
    };
    strengths: string[];
    areas_for_improvement: string[];
    level_assessment: string;
    recommendations: string;
    overall_evaluation: string;
  };
  created_at: string;
}

export default function SpeakingResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    }>
      <SpeakingResultsContent />
    </Suspense>
  );
}

function SpeakingResultsContent() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const taskId = searchParams.get('task_id');
  const testId = searchParams.get('test_id');

  useEffect(() => {
    const fetchResults = async () => {
      if (!taskId && !testId) {
        setError('No task ID or test ID provided');
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (taskId) params.append('task_id', taskId);
        if (testId) params.append('test_id', testId);

        const response = await fetch(`/api/speaking-results?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch results: ${response.status}`);
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchResults();
    }
  }, [taskId, testId, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!user) {
    redirect('/sign-in');
  }

  const getCourseTitle = (course: string) => {
    switch (course) {
      case 'telc_a2': return 'TELC A2';
      case 'telc_a1': return 'TELC A1';
      case 'telc_b1': return 'TELC B1';
      case 'telc_b2': return 'TELC B2';
      case 'goethe_a1': return 'Goethe A1';
      case 'goethe_a2': return 'Goethe A2';
      case 'goethe_b1': return 'Goethe B1';
      case 'goethe_b2': return 'Goethe B2';
      case 'goethe_c1': return 'Goethe C1';
      default: return course?.toUpperCase();
    }
  };

  const getSectionTitle = (course: string, section: number) => {
    if (course === 'telc_a2') {
      switch (section) {
        case 1: return 'Part 1: Self Introduction';
        case 2: return 'Part 2: Conversation';
        case 3: return 'Part 3: Presentation';
        default: return `Part ${section}`;
      }
    } else if (course === 'goethe_b1') {
      switch (section) {
        case 1: return 'Part 1: Planning Together';
        case 2: return 'Part 2: Presentation';
        case 3: return 'Part 3: Discussion';
        default: return `Part ${section}`;
      }
    }
    return `Part ${section}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your speaking results...</p>
        </div>
      </div>
    );
  }

  if (error || !result || !result.evaluation_data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'No evaluation results found for this test.'}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const percentage = Math.round(result.percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm pt-16 sm:pt-20 pb-6 sm:pb-8 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 sm:h-10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-2">Speaking Test Results</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base text-gray-600">
                <span>{getCourseTitle(result.course)} • {getSectionTitle(result.course, result.section)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 fill-yellow-500" />
                <span className="text-2xl sm:text-3xl font-bold">{result.score}</span>
                <span className="text-lg sm:text-xl text-gray-500">/ {result.max_score}</span>
              </div>
              <Badge className={`${getScoreBadgeColor(percentage)} text-xs sm:text-sm`}>
                {percentage}% • {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-20">
        
        {/* Overall Assessment */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Overall Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {result.evaluation_data.level_assessment}
            </p>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {result.evaluation_data.ausdrucksfaehigkeit_score !== undefined ? 
                (result.max_score === 17 ? 'TELC B2 Evaluation Details' : 'TELC B1 Evaluation Details') : 
               result.evaluation_data.aufgabenerfuellung_sprachfunktionen_grade !== undefined ? 'Goethe B2 Evaluation Details' :
               result.evaluation_data.aufgabe1_erfuellung_sprachfunktionen_grade !== undefined ? 'Goethe B1 Evaluation Details' :
               result.evaluation_data.aufgabenbewaeltigung_sprachfunktion_grade !== undefined ? 'Goethe A2 Evaluation Details' :
               result.evaluation_data.teil1_score !== undefined ? 'Goethe A1 Evaluation Details' :
               result.evaluation_data.task_completion_score !== undefined && result.evaluation_data.communicative_design_score !== undefined ? 'TELC A2 Evaluation Details' : 
               'TELC A1 Evaluation Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TELC A1 Format */}
            {result.evaluation_data.task_completion_and_linguistic_realization_score !== undefined && !result.evaluation_data.ausdrucksfaehigkeit_score && !result.evaluation_data.teil1_score && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm sm:text-base text-blue-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm text-blue-700">Task Completion & Linguistic Realization</span>
                  <span className="font-bold text-lg sm:text-xl text-blue-800">
                    {result.evaluation_data.task_completion_and_linguistic_realization_score}/{result.max_score}
                  </span>
                </div>
                
                {/* TELC A1 Rationales */}
                {result.evaluation_data.task_completion_rationale && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Task Completion Analysis:</h5>
                    <p className="text-xs sm:text-sm text-blue-700">{result.evaluation_data.task_completion_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.linguistic_realization_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Linguistic Realization Analysis:</h5>
                    <p className="text-xs sm:text-sm text-blue-700">{result.evaluation_data.linguistic_realization_rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* Goethe A1 Format */}
            {result.evaluation_data.teil1_score !== undefined && !result.evaluation_data.aufgabenbewaeltigung_sprachfunktion_grade && (
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-sm sm:text-base text-green-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                
                {/* Teil 1 */}
                {result.evaluation_data.teil1_score !== undefined && (
                  <div className="mb-3 p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-green-700">Teil 1 - Sich vorstellen</span>
                      <span className="font-bold text-lg sm:text-xl text-green-800">
                        {result.evaluation_data.teil1_score}/5
                      </span>
                    </div>
                    {result.evaluation_data.teil1_rationale && (
                      <p className="text-xs sm:text-sm text-green-700">{result.evaluation_data.teil1_rationale}</p>
                    )}
                  </div>
                )}
                
                {/* Teil 2 */}
                {result.evaluation_data.teil2_items_score !== undefined && (
                  <div className="p-3 bg-white rounded border">
                    <div className="mb-2">
                      <span className="text-xs sm:text-sm text-green-700 block mb-1">Teil 2 - Um Informationen bitten und geben</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Items 1-3: <span className="font-bold">{result.evaluation_data.teil2_items_score}/9</span></div>
                        <div>Communication: <span className="font-bold">{result.evaluation_data.teil2_communication_score}/1</span></div>
                      </div>
                      <div className="mt-1 text-xs text-green-700">
                        Arithmetic Mean: {result.evaluation_data.teil2_arithmetic_mean} → Rounded: 
                        <span className="font-bold text-green-800"> {result.evaluation_data.teil2_rounded_score}/10</span>
                      </div>
                    </div>
                    
                    {result.evaluation_data.teil2_items_rationale && (
                      <div className="mt-2 p-2 bg-green-25 rounded">
                        <h6 className="font-medium text-xs text-green-800 mb-1">Items Analysis:</h6>
                        <p className="text-xs text-green-700">{result.evaluation_data.teil2_items_rationale}</p>
                      </div>
                    )}
                    
                    {result.evaluation_data.teil2_communication_rationale && (
                      <div className="mt-2 p-2 bg-green-25 rounded">
                        <h6 className="font-medium text-xs text-green-800 mb-1">Communication Analysis:</h6>
                        <p className="text-xs text-green-700">{result.evaluation_data.teil2_communication_rationale}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Goethe A2 Format */}
            {result.evaluation_data.aufgabenbewaeltigung_sprachfunktion_grade !== undefined && !result.evaluation_data.aufgabe1_erfuellung_sprachfunktionen_grade && (
              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-sm sm:text-base text-orange-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                
                {/* Aufgabenbewältigung - 3 criteria */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-orange-800 mb-2">Aufgabenbewältigung (Task Completion)</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-orange-25 rounded">
                      <div className="font-medium text-orange-700">Sprachfunktion</div>
                      <div className="font-bold text-lg text-orange-800">{result.evaluation_data.aufgabenbewaeltigung_sprachfunktion_grade}</div>
                    </div>
                    <div className="text-center p-2 bg-orange-25 rounded">
                      <div className="font-medium text-orange-700">Interaktion</div>
                      <div className="font-bold text-lg text-orange-800">{result.evaluation_data.aufgabenbewaeltigung_interaktion_grade}</div>
                    </div>
                    <div className="text-center p-2 bg-orange-25 rounded">
                      <div className="font-medium text-orange-700">Register</div>
                      <div className="font-bold text-lg text-orange-800">{result.evaluation_data.aufgabenbewaeltigung_register_grade}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-sm text-orange-700">Total: </span>
                    <span className="font-bold text-orange-800">{result.evaluation_data.aufgabenbewaeltigung_score}/12</span>
                  </div>
                </div>
                
                {/* Sprache - 2 criteria */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-orange-800 mb-2">Sprache (Language)</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-orange-25 rounded">
                      <div className="font-medium text-orange-700">Spektrum: Wortschatz</div>
                      <div className="font-bold text-lg text-orange-800">{result.evaluation_data.sprache_wortschatz_grade}</div>
                    </div>
                    <div className="text-center p-2 bg-orange-25 rounded">
                      <div className="font-medium text-orange-700">Beherrschung: Wortschatz</div>
                      <div className="font-bold text-lg text-orange-800">{result.evaluation_data.sprache_beherrschung_grade}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-sm text-orange-700">Total: </span>
                    <span className="font-bold text-orange-800">{result.evaluation_data.sprache_score}/8</span>
                  </div>
                </div>
                
                {/* Aussprache - 1 criterion */}
                <div className="p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-orange-800 mb-2">Aussprache (Pronunciation)</h5>
                  <div className="text-center p-2 bg-orange-25 rounded">
                    <div className="font-medium text-orange-700">Satzmelodie, Wortakzent, Laute</div>
                    <div className="font-bold text-lg text-orange-800">{result.evaluation_data.aussprache_grade}</div>
                    <div className="text-sm text-orange-700">Score: {result.evaluation_data.aussprache_score}/4</div>
                  </div>
                </div>
                
                {/* Rationales */}
                {result.evaluation_data.aufgabenbewaeltigung_rationale && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-orange-800 mb-1">Task Completion Analysis:</h6>
                    <p className="text-xs text-orange-700">{result.evaluation_data.aufgabenbewaeltigung_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.sprache_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-orange-800 mb-1">Language Analysis:</h6>
                    <p className="text-xs text-orange-700">{result.evaluation_data.sprache_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.aussprache_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-orange-800 mb-1">Pronunciation Analysis:</h6>
                    <p className="text-xs text-orange-700">{result.evaluation_data.aussprache_rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* Goethe B1 Format */}
            {result.evaluation_data.aufgabe1_erfuellung_sprachfunktionen_grade !== undefined && !result.evaluation_data.aufgabenerfuellung_sprachfunktionen_grade && (
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-sm sm:text-base text-purple-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                
                {/* Aufgabe 1 - Interactive Discussion */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-purple-800 mb-2">Aufgabe 1 - Interactive Discussion</h5>
                  
                  {/* Erfüllung */}
                  <div className="mb-2">
                    <h6 className="text-xs font-medium text-purple-700 mb-1">Erfüllung (Task Completion)</h6>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Sprachfunktionen</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_erfuellung_sprachfunktionen_grade}</div>
                      </div>
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Inhalt/Umfang</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_erfuellung_inhalt_umfang_grade}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interaktion */}
                  <div className="mb-2">
                    <h6 className="text-xs font-medium text-purple-700 mb-1">Interaktion</h6>
                    <div className="text-center p-1 bg-purple-25 rounded">
                      <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_interaktion_grade}</div>
                    </div>
                  </div>
                  
                  {/* Wortschatz */}
                  <div className="mb-2">
                    <h6 className="text-xs font-medium text-purple-700 mb-1">Wortschatz (Vocabulary)</h6>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Register</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_wortschatz_register_grade}</div>
                      </div>
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Spektrum</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_wortschatz_spektrum_grade}</div>
                      </div>
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Beherrschung</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_wortschatz_beherrschung_grade}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Strukturen */}
                  <div className="mb-2">
                    <h6 className="text-xs font-medium text-purple-700 mb-1">Strukturen (Grammar)</h6>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Spektrum</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_strukturen_spektrum_grade}</div>
                      </div>
                      <div className="text-center p-1 bg-purple-25 rounded">
                        <div className="text-purple-600">Beherrschung</div>
                        <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_strukturen_beherrschung_grade}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-center text-sm text-purple-700">
                    Score: <span className="font-bold text-purple-800">{result.evaluation_data.aufgabe1_score}/32</span>
                  </div>
                </div>
                
                {/* Aufgabe 2 - Presentation */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-purple-800 mb-2">Aufgabe 2 - Presentation</h5>
                  
                  <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                    <div className="text-center p-1 bg-purple-25 rounded">
                      <div className="text-purple-600">Vollständigkeit</div>
                      <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe2_erfuellung_vollstaendigkeit_grade}</div>
                    </div>
                    <div className="text-center p-1 bg-purple-25 rounded">
                      <div className="text-purple-600">Inhalt/Umfang</div>
                      <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe2_erfuellung_inhalt_umfang_grade}</div>
                    </div>
                    <div className="text-center p-1 bg-purple-25 rounded">
                      <div className="text-purple-600">Kohärenz</div>
                      <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe2_kohaerenz_grade}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-purple-600 text-center mb-1">
                    Wortschatz/Strukturen: {result.evaluation_data.aufgabe2_wortschatz_strukturen_grade}
                  </div>
                  
                  <div className="text-center text-sm text-purple-700">
                    Score: <span className="font-bold text-purple-800">{result.evaluation_data.aufgabe2_score}/12</span>
                  </div>
                </div>
                
                {/* Aufgabe 3 - Discussion */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-purple-800 mb-2">Aufgabe 3 - Discussion/Response</h5>
                  
                  <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                    <div className="text-center p-1 bg-purple-25 rounded">
                      <div className="text-purple-600">Sprachfunktionen</div>
                      <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe3_erfuellung_sprachfunktionen_grade}</div>
                    </div>
                    <div className="text-center p-1 bg-purple-25 rounded">
                      <div className="text-purple-600">Inhalt/Umfang</div>
                      <div className="font-bold text-purple-800">{result.evaluation_data.aufgabe3_erfuellung_inhalt_umfang_grade}</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-purple-700">
                    Score: <span className="font-bold text-purple-800">{result.evaluation_data.aufgabe3_score}/8</span>
                  </div>
                </div>
                
                {/* Aussprache */}
                <div className="p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-purple-800 mb-2">Aussprache (Pronunciation - All Tasks)</h5>
                  <div className="text-center p-2 bg-purple-25 rounded">
                    <div className="font-medium text-purple-700">Satzmelodie, Wortakzent, Laute</div>
                    <div className="font-bold text-lg text-purple-800">{result.evaluation_data.aussprache_grade}</div>
                    <div className="text-sm text-purple-700">Score: {result.evaluation_data.aussprache_score}/4</div>
                  </div>
                </div>
                
                {/* Rationales */}
                {result.evaluation_data.aufgabe1_rationale && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-purple-800 mb-1">Aufgabe 1 Analysis:</h6>
                    <p className="text-xs text-purple-700">{result.evaluation_data.aufgabe1_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.aufgabe2_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-purple-800 mb-1">Aufgabe 2 Analysis:</h6>
                    <p className="text-xs text-purple-700">{result.evaluation_data.aufgabe2_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.aufgabe3_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-purple-800 mb-1">Aufgabe 3 Analysis:</h6>
                    <p className="text-xs text-purple-700">{result.evaluation_data.aufgabe3_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.aussprache_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-purple-800 mb-1">Pronunciation Analysis:</h6>
                    <p className="text-xs text-purple-700">{result.evaluation_data.aussprache_rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* Goethe B2 Format */}
            {result.evaluation_data.aufgabenerfuellung_sprachfunktionen_grade !== undefined && (
              <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-sm sm:text-base text-indigo-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                
                {/* Aufgabenerfüllung */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-indigo-800 mb-2">Aufgabenerfüllung (Task Completion)</h5>
                  <div className="text-center p-2 bg-indigo-25 rounded">
                    <div className="font-medium text-indigo-700">Sprachfunktionen</div>
                    <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.aufgabenerfuellung_sprachfunktionen_grade}</div>
                    <div className="text-sm text-indigo-700">Score: {result.evaluation_data.aufgabenerfuellung_score}/4</div>
                  </div>
                </div>
                
                {/* Vortrag Kohärenz */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-indigo-800 mb-2">Vortrag Kohärenz (Presentation Coherence)</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-indigo-25 rounded">
                      <div className="font-medium text-indigo-700">Verknüpfung</div>
                      <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.vortrag_kohaerenz_verknuepfung_grade}</div>
                    </div>
                    <div className="text-center p-2 bg-indigo-25 rounded">
                      <div className="font-medium text-indigo-700">Flüssigkeit</div>
                      <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.vortrag_kohaerenz_fluessigkeit_grade}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-sm text-indigo-700">Total: </span>
                    <span className="font-bold text-indigo-800">{result.evaluation_data.vortrag_kohaerenz_score}/8</span>
                  </div>
                </div>
                
                {/* Diskussion Interaktion */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-indigo-800 mb-2">Diskussion Interaktion (Discussion Interaction)</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-indigo-25 rounded">
                      <div className="font-medium text-indigo-700">Gespräch</div>
                      <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.diskussion_interaktion_gespraech_grade}</div>
                    </div>
                    <div className="text-center p-2 bg-indigo-25 rounded">
                      <div className="font-medium text-indigo-700">Register</div>
                      <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.diskussion_interaktion_register_grade}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-sm text-indigo-700">Total: </span>
                    <span className="font-bold text-indigo-800">{result.evaluation_data.diskussion_interaktion_score}/8</span>
                  </div>
                </div>
                
                {/* Wortschatz & Strukturen */}
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-indigo-800 mb-2">Wortschatz & Strukturen (Vocabulary & Grammar)</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-indigo-25 rounded">
                      <div className="font-medium text-indigo-700">Wortschatz Spektrum</div>
                      <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.wortschatz_spektrum_grade}</div>
                      <div className="text-sm text-indigo-700">Score: {result.evaluation_data.wortschatz_score}/4</div>
                    </div>
                    <div className="text-center p-2 bg-indigo-25 rounded">
                      <div className="font-medium text-indigo-700">Strukturen Spektrum</div>
                      <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.strukturen_spektrum_grade}</div>
                      <div className="text-sm text-indigo-700">Score: {result.evaluation_data.strukturen_score}/4</div>
                    </div>
                  </div>
                </div>
                
                {/* Aussprache */}
                <div className="p-3 bg-white rounded border">
                  <h5 className="font-medium text-sm text-indigo-800 mb-2">Aussprache (Pronunciation)</h5>
                  <div className="text-center p-2 bg-indigo-25 rounded">
                    <div className="font-medium text-indigo-700">Satzmelodie, Wortakzent, Laute</div>
                    <div className="font-bold text-lg text-indigo-800">{result.evaluation_data.aussprache_grade}</div>
                    <div className="text-sm text-indigo-700">Score: {result.evaluation_data.aussprache_score}/4</div>
                  </div>
                </div>
                
                {/* Rationales */}
                {result.evaluation_data.aufgabenerfuellung_rationale && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-indigo-800 mb-1">Task Completion Analysis:</h6>
                    <p className="text-xs text-indigo-700">{result.evaluation_data.aufgabenerfuellung_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.vortrag_kohaerenz_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-indigo-800 mb-1">Presentation Coherence Analysis:</h6>
                    <p className="text-xs text-indigo-700">{result.evaluation_data.vortrag_kohaerenz_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.diskussion_interaktion_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-indigo-800 mb-1">Discussion Interaction Analysis:</h6>
                    <p className="text-xs text-indigo-700">{result.evaluation_data.diskussion_interaktion_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.wortschatz_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-indigo-800 mb-1">Vocabulary Analysis:</h6>
                    <p className="text-xs text-indigo-700">{result.evaluation_data.wortschatz_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.strukturen_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-indigo-800 mb-1">Grammar Structures Analysis:</h6>
                    <p className="text-xs text-indigo-700">{result.evaluation_data.strukturen_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.aussprache_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h6 className="font-medium text-xs text-indigo-800 mb-1">Pronunciation Analysis:</h6>
                    <p className="text-xs text-indigo-700">{result.evaluation_data.aussprache_rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* TELC A2 Format */}
            {result.evaluation_data.task_completion_score !== undefined && result.evaluation_data.communicative_design_score !== undefined && !result.evaluation_data.ausdrucksfaehigkeit_score && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm sm:text-base text-blue-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Task Completion</h5>
                    <span className="font-bold text-lg sm:text-xl text-blue-800">
                      {result.evaluation_data.task_completion_score}/3
                    </span>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Communicative Design</h5>
                    <span className="font-bold text-lg sm:text-xl text-blue-800">
                      {result.evaluation_data.communicative_design_score}/1
                    </span>
                  </div>
                </div>
                
                {/* TELC A2 Rationales */}
                {result.evaluation_data.task_completion_rationale && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Task Completion Analysis:</h5>
                    <p className="text-xs sm:text-sm text-blue-700">{result.evaluation_data.task_completion_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.communicative_design_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Communicative Design Analysis:</h5>
                    <p className="text-xs sm:text-sm text-blue-700">{result.evaluation_data.communicative_design_rationale}</p>
                  </div>
                )}
              </div>
            )}

            {/* TELC B1/B2 Format */}
            {result.evaluation_data.ausdrucksfaehigkeit_score !== undefined && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm sm:text-base text-blue-800 mb-2">
                  {result.evaluation_data.section_name || getSectionTitle(result.course, result.section)}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Expression</h5>
                    <span className="font-bold text-lg sm:text-xl text-blue-800">
                      {result.evaluation_data.ausdrucksfaehigkeit_score}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Task Management</h5>
                    <span className="font-bold text-lg sm:text-xl text-blue-800">
                      {result.evaluation_data.aufgabenbewaeltigung_score}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Grammar</h5>
                    <span className="font-bold text-lg sm:text-xl text-blue-800">
                      {result.evaluation_data.formale_richtigkeit_score}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Pronunciation</h5>
                    <span className="font-bold text-lg sm:text-xl text-blue-800">
                      {result.evaluation_data.aussprache_intonation_score}
                    </span>
                  </div>
                </div>
                
                {/* TELC B1/B2 Rationales */}
                {result.evaluation_data.ausdrucksfaehigkeit_rationale && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Expression Analysis:</h5>
                    <p className="text-xs sm:text-sm text-blue-700">{result.evaluation_data.ausdrucksfaehigkeit_rationale}</p>
                  </div>
                )}
                
                {result.evaluation_data.aufgabenbewaeltigung_rationale && (
                  <div className="mt-2 p-3 bg-white rounded border">
                    <h5 className="font-medium text-xs sm:text-sm text-blue-800 mb-1">Task Management Analysis:</h5>
                    <p className="text-xs sm:text-sm text-blue-700">{result.evaluation_data.aufgabenbewaeltigung_rationale}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              Detailed Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {Object.entries(result.evaluation_data.detailed_feedback).map(([key, feedback]) => (
              <div key={key} className="border-l-4 border-gray-200 pl-3 sm:pl-4">
                <h4 className="font-semibold capitalize mb-1 sm:mb-2 text-gray-800 text-sm sm:text-base">
                  {key.replace(/_/g, ' ')}
                </h4>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{feedback}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strengths and Areas for Improvement */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Strengths */}
          {result.evaluation_data.strengths && result.evaluation_data.strengths.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-green-700 text-lg sm:text-xl">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3">
                  {result.evaluation_data.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-700 text-sm sm:text-base">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {result.evaluation_data.areas_for_improvement && result.evaluation_data.areas_for_improvement.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg sm:text-xl">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 sm:space-y-3">
                  {result.evaluation_data.areas_for_improvement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-3 w-3 sm:h-4 sm:w-4 bg-blue-100 rounded-full mt-0.5 flex-shrink-0"></div>
                      <span className="text-blue-700 text-sm sm:text-base">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        {result.evaluation_data.recommendations && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Recommendations for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {result.evaluation_data.recommendations}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Overall Evaluation */}
        {result.evaluation_data.overall_evaluation && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                Examiner's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {result.evaluation_data.overall_evaluation}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button 
            onClick={() => window.print()}
            variant="outline"
            className="flex-1 h-10 sm:h-11"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button 
            onClick={() => {
              const dataStr = JSON.stringify(result, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `speaking-results-${result.task_id}.json`;
              link.click();
            }}
            variant="outline"
            className="flex-1 h-10 sm:h-11"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
    </div>
  );
}