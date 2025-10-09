/**
 * ConversationDetailView Component
 * Displays detailed evaluation results including transcript, scores, and feedback
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  BookOpen,
  Award,
  AlertCircle,
  User,
  Bot
} from 'lucide-react'

interface GrammarError {
  error: string
  correction: string
  explanation: string
  grammar_category: string
  severity: 'minor' | 'moderate' | 'major'
}

interface EvaluationData {
  task_completion?: {
    completed: boolean
    explanation: string
  }
  grammar_vocabulary?: {
    score: number
    strengths: string
    weaknesses: string
    grammar_errors_list?: GrammarError[]
  }
  communication_effectiveness?: {
    score: number
    strengths: string
    areas_for_improvement: string
  }
  overall_feedback?: string
  level_assessment?: string
  evaluation_timestamp?: string
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  message_index?: number
}

interface Evaluation {
  id: string
  user_id: string
  task_id: string
  course_name: string
  attempt_id: number
  conversation_history: ConversationMessage[]
  task_instructions: string
  grammar_vocabulary_score: number
  communication_score: number
  total_score: number
  percentage_score: number
  evaluation_data: EvaluationData
  created_at: string
  task_instructions: {
    lesson_title: string
    topic: string
    level: string
    user_instruction: string
  }
}

interface ConversationDetailViewProps {
  evaluation: Evaluation
}

export function ConversationDetailView({ evaluation }: ConversationDetailViewProps) {
  const evalData = evaluation.evaluation_data || {}
  const taskInfo = evaluation.task_instructions || {}

  // Severity colors
  const severityColors = {
    minor: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    moderate: 'bg-orange-100 text-orange-700 border-orange-300',
    major: 'bg-red-100 text-red-700 border-red-300',
  }

  return (
    <div className="space-y-6">
      {/* Task Instructions */}
      {taskInfo.user_instruction && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Task Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{taskInfo.user_instruction}</p>
          </CardContent>
        </Card>
      )}

      {/* Overall Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Grammar & Vocabulary</p>
              <p className="text-3xl font-bold text-gray-900">
                {Number(evaluation.grammar_vocabulary_score).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">out of 5.0</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Communication</p>
              <p className="text-3xl font-bold text-gray-900">
                {Number(evaluation.communication_score).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">out of 5.0</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Score</p>
              <p className="text-3xl font-bold text-blue-600">
                {Number(evaluation.total_score).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">out of 10.0</p>
            </div>
          </div>

          {evalData.level_assessment && (
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-gray-600 mb-2">Assessed Level</p>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-base px-3 py-1">
                {evalData.level_assessment}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Completion */}
      {evalData.task_completion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {evalData.task_completion.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Badge className={evalData.task_completion.completed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'}>
                {evalData.task_completion.completed ? 'Completed' : 'Not Completed'}
              </Badge>
              <p className="text-sm text-gray-700 flex-1">
                {evalData.task_completion.explanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grammar & Vocabulary Analysis */}
      {evalData.grammar_vocabulary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Grammar & Vocabulary Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            {evalData.grammar_vocabulary.strengths && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Strengths</h4>
                <p className="text-sm text-gray-600">{evalData.grammar_vocabulary.strengths}</p>
              </div>
            )}

            {/* Weaknesses */}
            {evalData.grammar_vocabulary.weaknesses && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Areas for Improvement</h4>
                <p className="text-sm text-gray-600">{evalData.grammar_vocabulary.weaknesses}</p>
              </div>
            )}

            {/* Grammar Errors */}
            {evalData.grammar_vocabulary.grammar_errors_list &&
             evalData.grammar_vocabulary.grammar_errors_list.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Grammar Errors</h4>
                <div className="space-y-3">
                  {evalData.grammar_vocabulary.grammar_errors_list.map((error, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className={severityColors[error.severity]}>
                          {error.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.grammar_category}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500">Your answer:</p>
                          <p className="text-sm text-red-600 line-through">{error.error}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Correction:</p>
                          <p className="text-sm text-green-600 font-medium">{error.correction}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Explanation:</p>
                          <p className="text-sm text-gray-700">{error.explanation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Communication Effectiveness */}
      {evalData.communication_effectiveness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              Communication Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evalData.communication_effectiveness.strengths && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Strengths</h4>
                <p className="text-sm text-gray-600">
                  {evalData.communication_effectiveness.strengths}
                </p>
              </div>
            )}

            {evalData.communication_effectiveness.areas_for_improvement && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Areas for Improvement</h4>
                <p className="text-sm text-gray-600">
                  {evalData.communication_effectiveness.areas_for_improvement}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Feedback */}
      {evalData.overall_feedback && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Overall Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {evalData.overall_feedback}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conversation Transcript */}
      {evaluation.conversation_history && evaluation.conversation_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Conversation Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluation.conversation_history.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[70%] ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
