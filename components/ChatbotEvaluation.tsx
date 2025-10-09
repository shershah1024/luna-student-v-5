'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Trophy, Target, BookOpen, ArrowRight, X } from 'lucide-react';

interface GrammarError {
  error: string;
  correction: string;
  explanation: string;
}

interface EvaluationData {
  task_completion_score: number;
  task_completion_details: string;
  grammar_score: number;
  grammar_details: string;
  grammar_errors: GrammarError[];
  communication_score: number;
  communication_details: string;
  total_score: number;
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string;
}

interface ChatbotEvaluationProps {
  conversationId: string;
  userId: string;
  taskId?: string;
  language?: string;
  level?: string;
  topic?: string;
  onClose?: () => void;
  onContinue?: () => void;
}

export function ChatbotEvaluation({
  conversationId,
  userId,
  taskId,
  language = 'English',
  level = 'A1',
  topic = 'General conversation',
  onClose,
  onContinue
}: ChatbotEvaluationProps) {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluation();
  }, [conversationId]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chatbot-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: userId,
          task_id: taskId,
          language,
          level,
          topic
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate evaluation');
      }

      const data = await response.json();
      setEvaluation(data.evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">Evaluating Your Conversation...</h3>
          <p className="text-gray-600 mt-2">This will take a moment</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-center mb-2">Evaluation Error</h3>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </Card>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Conversation Evaluation</h2>
              <p className="text-blue-100">{language} • Level {level}</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Overall Score */}
          <Card className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h3 className="text-xl font-semibold">Overall Score</h3>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.total_score, 30)}`}>
                {evaluation.total_score}/30
              </div>
            </div>
            <Progress 
              value={(evaluation.total_score / 30) * 100} 
              className="h-3 mb-3"
            />
            <p className="text-gray-700">{evaluation.overall_feedback}</p>
          </Card>

          {/* Score Breakdown */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Task Completion */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Task Completion</h4>
              </div>
              <div className={`text-2xl font-bold mb-2 ${getScoreColor(evaluation.task_completion_score, 10)}`}>
                {evaluation.task_completion_score}/10
              </div>
              <Progress 
                value={(evaluation.task_completion_score / 10) * 100}
                className={`h-2 mb-2 ${getProgressColor(evaluation.task_completion_score, 10)}`}
              />
              <p className="text-sm text-gray-600">{evaluation.task_completion_details}</p>
            </Card>

            {/* Grammar */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Grammar</h4>
              </div>
              <div className={`text-2xl font-bold mb-2 ${getScoreColor(evaluation.grammar_score, 10)}`}>
                {evaluation.grammar_score}/10
              </div>
              <Progress 
                value={(evaluation.grammar_score / 10) * 100}
                className={`h-2 mb-2 ${getProgressColor(evaluation.grammar_score, 10)}`}
              />
              <p className="text-sm text-gray-600">{evaluation.grammar_details}</p>
            </Card>

            {/* Communication */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold">Communication</h4>
              </div>
              <div className={`text-2xl font-bold mb-2 ${getScoreColor(evaluation.communication_score, 10)}`}>
                {evaluation.communication_score}/10
              </div>
              <Progress 
                value={(evaluation.communication_score / 10) * 100}
                className={`h-2 mb-2 ${getProgressColor(evaluation.communication_score, 10)}`}
              />
              <p className="text-sm text-gray-600">{evaluation.communication_details}</p>
            </Card>
          </div>

          {/* Grammar Errors */}
          {evaluation.grammar_errors && evaluation.grammar_errors.length > 0 && (
            <Card className="mb-6 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Grammar Corrections
              </h3>
              <div className="space-y-3">
                {evaluation.grammar_errors.map((error, index) => (
                  <div key={index} className="border-l-4 border-orange-400 pl-4 py-2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 line-through">{error.error}</span>
                      <ArrowRight className="h-4 w-4 mt-1 text-gray-400" />
                      <span className="text-green-600 font-medium">{error.correction}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{error.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Strengths and Improvements */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Strengths */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-700">Strengths</h3>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Areas for Improvement */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 text-orange-700">Areas for Improvement</h3>
              <ul className="space-y-2">
                {evaluation.areas_for_improvement.map((area, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{area}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
            <p className="text-gray-700">{evaluation.recommendations}</p>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Close
            </Button>
            {onContinue && (
              <Button
                onClick={onContinue}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue to Next Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}