/**
 * Speaking Dashboard
 * Shows all speaking conversations, evaluations, scores, and progress trends
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConversationDetailView } from '@/components/dashboard/ConversationDetailView'
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Award,
  Calendar,
  ChevronRight
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface SpeakingStats {
  totalConversations: number
  averageTotalScore: number
  averageGrammarVocabScore: number
  averageCommunicationScore: number
  averagePronunciationScore: number
  lastConversationDate: string | null
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
}

interface Evaluation {
  id: string
  user_id: string
  task_id: string
  course_name: string
  attempt_id: number
  conversation_history: any[]
  task_instructions: string
  grammar_vocabulary_score: number
  communication_score: number
  total_score: number
  percentage_score: number
  evaluation_data: any
  created_at: string
  updated_at: string
  task_instructions: {
    task_id: string
    lesson_title: string
    topic: string
    level: string
    bot_instruction: string
    user_instruction: string
    tips: string[]
  }
}

interface TaskStats {
  taskId: string
  title: string
  topic: string
  level: string
  conversationCount: number
  averageScore: number
  lastAttempt: string
}

export default function SpeakingDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: SpeakingStats
    evaluations: Evaluation[]
    taskStats: TaskStats[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/speaking')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        evaluations: result.evaluations,
        taskStats: result.taskStats
      })
    } catch (err) {
      console.error('Error fetching speaking dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your speaking progress...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || 'Failed to load data'}</p>
        </div>
      </div>
    )
  }

  const { stats, evaluations, taskStats } = data

  // Get trend icon
  const TrendIcon = stats.trend.direction === 'up' ? TrendingUp :
                    stats.trend.direction === 'down' ? TrendingDown : Minus

  const trendColor = stats.trend.direction === 'up' ? 'text-green-600' :
                     stats.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Speaking Dashboard</h1>
          <p className="text-gray-600">Track your speaking progress and conversation evaluations</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Conversations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Conversations</CardTitle>
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
            </CardContent>
          </Card>

          {/* Average Total Score */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                <Award className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageTotalScore.toFixed(1)}<span className="text-lg text-gray-500">/10</span>
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                <span className={`text-sm font-medium ${trendColor}`}>
                  {stats.trend.percentage}%
                </span>
                <span className="text-sm text-gray-500">vs previous</span>
              </div>
            </CardContent>
          </Card>

          {/* Grammar & Vocabulary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Grammar & Vocab</CardTitle>
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageGrammarVocabScore.toFixed(1)}<span className="text-lg text-gray-500">/5</span>
              </p>
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Communication</CardTitle>
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageCommunicationScore.toFixed(1)}<span className="text-lg text-gray-500">/5</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Most Practiced Tasks */}
        {taskStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Practiced Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskStats.slice(0, 6).map((task) => (
                <Card key={task.taskId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{task.topic}</p>
                      </div>
                      <Badge variant="outline">{task.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{task.conversationCount} conversations</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {task.averageScore.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Conversations */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Conversations</h2>

          {evaluations.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-6">
                Start a speaking exercise to see your progress here!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => {
                const taskInfo = evaluation.task_instructions || {}
                const evalData = evaluation.evaluation_data || {}
                const formattedDate = new Date(evaluation.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Date */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {taskInfo.lesson_title || 'Speaking Practice'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              Attempt {evaluation.attempt_id}/3
                            </Badge>
                            {evalData.level_assessment && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                {evalData.level_assessment}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            {taskInfo.topic && (
                              <>
                                <span>•</span>
                                <span>{taskInfo.topic}</span>
                              </>
                            )}
                          </div>

                          {/* Scores */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Grammar & Vocabulary</p>
                              <p className="text-xl font-bold text-gray-900">
                                {Number(evaluation.grammar_vocabulary_score).toFixed(1)}/5
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Communication</p>
                              <p className="text-xl font-bold text-gray-900">
                                {Number(evaluation.communication_score).toFixed(1)}/5
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Total Score</p>
                              <p className="text-xl font-bold text-blue-600">
                                {Number(evaluation.total_score).toFixed(1)}/10
                              </p>
                            </div>
                          </div>

                          {/* Quick Feedback */}
                          {evalData.overall_feedback && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {evalData.overall_feedback}
                              </p>
                            </div>
                          )}

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEvaluation(evaluation)}
                            className="mt-2"
                          >
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedEvaluation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedEvaluation.task_instructions?.lesson_title || 'Speaking Evaluation'}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedEvaluation.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvaluation(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ConversationDetailView evaluation={selectedEvaluation} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
