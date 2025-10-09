/**
 * Writing Dashboard
 * Shows all writing submissions, multi-dimensional scores, and grammar error patterns
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Calendar,
  ChevronRight,
  AlertCircle,
  BarChart3
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface WritingStats {
  totalSubmissions: number
  averageTotalScore: number
  averageTaskCompletion: number
  averageCoherenceCohesion: number
  averageVocabulary: number
  averageGrammarAccuracy: number
  averageFormat: number
  averageWordCount: number
  totalGrammarErrors: number
  lastSubmissionDate: string | null
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
}

interface Submission {
  id: string
  user_id: string
  task_id: string
  attempt_number: number
  response_text: string
  word_count: number
  task_completion_score: number
  coherence_cohesion_score: number
  vocabulary_score: number
  grammar_accuracy_score: number
  format_score: number
  total_score: number
  max_score: number
  percentage_score: number
  evaluation_data: any
  grammar_error_count: number
  language: string
  course_name: string
  created_at: string
  task_details: any
}

interface GrammarError {
  id: string
  error_text: string
  correction: string
  explanation: string
  grammar_category: string
  severity: string
  context: string
}

interface TaskStats {
  task_id: string
  title: string
  topic: string
  language: string
  level: string
  submission_count: number
  average_score: number
  total_word_count: number
  last_submission: string
}

interface ErrorPattern {
  category: string
  count: number
}

export default function WritingDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: WritingStats
    submissions: Submission[]
    taskStats: TaskStats[]
    errorPatterns: ErrorPattern[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/writing')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        submissions: result.submissions,
        taskStats: result.taskStats,
        errorPatterns: result.errorPatterns
      })
    } catch (err) {
      console.error('Error fetching writing dashboard:', err)
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
          <p className="text-slate-600 font-medium">Loading your writing progress...</p>
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

  const { stats, submissions, taskStats, errorPatterns } = data

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Writing Dashboard</h1>
          <p className="text-gray-600">Track your writing submissions and progress</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Submissions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                <Award className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageTotalScore.toFixed(1)}
                <span className="text-lg text-gray-500">/{stats.totalSubmissions > 0 ? submissions[0].max_score : 10}</span>
              </p>
              {stats.totalSubmissions > 3 && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <span className={`text-sm font-medium ${trendColor}`}>
                    {stats.trend.percentage}%
                  </span>
                  <span className="text-sm text-gray-500">vs previous</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Average Word Count */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Word Count</CardTitle>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.averageWordCount}</p>
            </CardContent>
          </Card>

          {/* Grammar Errors */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Grammar Errors</CardTitle>
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalGrammarErrors}</p>
            </CardContent>
          </Card>
        </div>

        {/* Score Breakdown */}
        {stats.totalSubmissions > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Average Scores by Dimension</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Task Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageTaskCompletion.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Coherence</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageCoherenceCohesion.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Vocabulary</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageVocabulary.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Grammar</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageGrammarAccuracy.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Format</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageFormat.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grammar Error Patterns */}
        {errorPatterns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Common Grammar Errors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {errorPatterns.slice(0, 8).map((pattern) => (
                <Card key={pattern.category}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">{pattern.category}</p>
                    <p className="text-2xl font-bold text-orange-600">{pattern.count}</p>
                    <p className="text-xs text-gray-500">errors</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Most Written Topics */}
        {taskStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Written Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskStats.slice(0, 6).map((task) => (
                <Card key={task.task_id} className="hover:shadow-md transition-shadow">
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
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{task.submission_count} submissions</p>
                      <p className="text-gray-600">{task.total_word_count} total words</p>
                      <p className="font-bold text-gray-900">{task.average_score.toFixed(1)} avg score</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Submissions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Submissions</h2>

          {submissions.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600 mb-6">
                Complete a writing task to see your progress here!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const taskDetails = submission.task_details || {}
                const formattedDate = new Date(submission.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Date */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {taskDetails.title || 'Writing Task'}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              Attempt {submission.attempt_number}
                            </Badge>
                            {taskDetails.level && (
                              <Badge variant="outline">{taskDetails.level}</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{submission.word_count} words</span>
                            <span>•</span>
                            <span>{submission.grammar_error_count} grammar errors</span>
                          </div>

                          {/* Scores */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Total Score</p>
                              <p className="text-xl font-bold text-blue-600">
                                {Number(submission.total_score).toFixed(1)}/{submission.max_score}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Percentage</p>
                              <p className="text-xl font-bold text-gray-900">
                                {Number(submission.percentage_score).toFixed(0)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Word Count</p>
                              <p className="text-xl font-bold text-gray-900">
                                {submission.word_count}
                              </p>
                            </div>
                          </div>

                          {/* Text Preview */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {submission.response_text}
                            </p>
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
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

      {/* Detailed Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedSubmission.task_details?.title || 'Writing Submission'}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedSubmission.created_at).toLocaleDateString('en-US', {
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
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Score Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Task Completion</p>
                      <p className="text-lg font-bold">{Number(selectedSubmission.task_completion_score).toFixed(1)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Coherence & Cohesion</p>
                      <p className="text-lg font-bold">{Number(selectedSubmission.coherence_cohesion_score).toFixed(1)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Vocabulary</p>
                      <p className="text-lg font-bold">{Number(selectedSubmission.vocabulary_score).toFixed(1)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Grammar Accuracy</p>
                      <p className="text-lg font-bold">{Number(selectedSubmission.grammar_accuracy_score).toFixed(1)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Format</p>
                      <p className="text-lg font-bold">{Number(selectedSubmission.format_score).toFixed(1)}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Score</p>
                      <p className="text-lg font-bold text-blue-600">{Number(selectedSubmission.total_score).toFixed(1)}/{selectedSubmission.max_score}</p>
                    </div>
                  </div>
                </div>

                {/* Your Writing */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Your Writing</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedSubmission.response_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-3">
                      {selectedSubmission.word_count} words
                    </p>
                  </div>
                </div>

                {/* Evaluation Feedback (if available) */}
                {selectedSubmission.evaluation_data && Object.keys(selectedSubmission.evaluation_data).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Feedback</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {JSON.stringify(selectedSubmission.evaluation_data)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
