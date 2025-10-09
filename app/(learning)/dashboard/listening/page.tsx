/**
 * Listening Dashboard
 * Shows all listening test attempts and performance analytics
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Headphones,
  Calendar,
  ChevronRight,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ListeningStats {
  totalTests: number
  totalQuestions: number
  overallAccuracy: number
  averageScore: number
  lastTestDate: string | null
}

interface Question {
  id: string
  question_id: string
  question_number: number
  user_answer: any
  correct_answer: any
  is_correct: boolean
  points_earned: number
  max_points: number
}

interface TestAttempt {
  task_id: string
  attempt_number: number
  task_title: string
  topic: string
  language: string
  level: string
  audio_url: string | null
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  accuracy: number
  total_points: number
  max_points: number
  percentage: number
  test_date: string
  questions: Question[]
}

interface TaskStats {
  task_id: string
  title: string
  topic: string
  language: string
  level: string
  attempt_count: number
  total_questions: number
  total_correct: number
  average_accuracy: number
  last_attempt: string
}

export default function ListeningDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: ListeningStats
    testAttempts: TestAttempt[]
    taskStats: TaskStats[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTest, setSelectedTest] = useState<TestAttempt | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/listening')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        testAttempts: result.testAttempts,
        taskStats: result.taskStats
      })
    } catch (err) {
      console.error('Error fetching listening dashboard:', err)
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
          <p className="text-slate-600 font-medium">Loading your listening progress...</p>
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

  const { stats, testAttempts, taskStats } = data

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Listening Dashboard</h1>
          <p className="text-gray-600">Track your listening comprehension test performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Tests */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Tests Taken</CardTitle>
                <Headphones className="w-5 h-5 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTests}</p>
            </CardContent>
          </Card>

          {/* Total Questions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Questions Answered</CardTitle>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </CardContent>
          </Card>

          {/* Overall Accuracy */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Overall Accuracy</CardTitle>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.overallAccuracy.toFixed(1)}%</p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore.toFixed(0)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Most Practiced Tests */}
        {taskStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Practiced Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskStats.slice(0, 6).map((task) => (
                <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold line-clamp-2">{task.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{task.topic}</p>
                      </div>
                      <Badge variant="outline">{task.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{task.attempt_count} attempts</p>
                      <p className="text-gray-600">{task.total_questions} total questions</p>
                      <p className="font-bold text-green-600">{task.average_accuracy.toFixed(1)}% accuracy</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Test Attempts */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Tests</h2>

          {testAttempts.length === 0 ? (
            <Card className="p-12 text-center">
              <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tests taken yet</h3>
              <p className="text-gray-600 mb-6">
                Complete a listening test to see your results here!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {testAttempts.map((test, index) => {
                const formattedDate = new Date(test.test_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                const accuracyColor = test.accuracy >= 80 ? 'text-green-600' :
                                     test.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'

                return (
                  <Card key={`${test.task_id}-${test.attempt_number}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Date */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {test.task_title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              Attempt {test.attempt_number}
                            </Badge>
                            {test.level && (
                              <Badge variant="outline">{test.level}</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{test.total_questions} questions</span>
                          </div>

                          {/* Results */}
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                              <p className={`text-xl font-bold ${accuracyColor}`}>
                                {test.accuracy.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Correct</p>
                              <p className="text-xl font-bold text-green-600">
                                {test.correct_answers}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Incorrect</p>
                              <p className="text-xl font-bold text-red-600">
                                {test.incorrect_answers}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Score</p>
                              <p className="text-xl font-bold text-blue-600">
                                {test.percentage.toFixed(0)}%
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="bg-gray-200 rounded-full h-2 mb-4">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${test.accuracy}%` }}
                            ></div>
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTest(test)}
                            className="mt-2"
                          >
                            View Answers
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

      {/* Detailed Test Results Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedTest.task_title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedTest.test_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Attempt {selectedTest.attempt_number}</Badge>
                      <Badge variant="outline">{selectedTest.level}</Badge>
                      <span className="text-sm text-gray-600">
                        {selectedTest.correct_answers}/{selectedTest.total_questions} correct
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTest(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedTest.accuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Points</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedTest.total_points}/{selectedTest.max_points}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Overall</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedTest.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Results */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Question-by-Question Results</h3>
                  <div className="space-y-3">
                    {selectedTest.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className={`border rounded-lg p-3 ${
                          question.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">Question {question.question_number}</span>
                              {question.is_correct ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="text-sm text-gray-600">
                                {question.points_earned}/{question.max_points} points
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="font-medium">Your answer:</span>{' '}
                                <span className={question.is_correct ? 'text-green-700' : 'text-red-700'}>
                                  {JSON.stringify(question.user_answer)}
                                </span>
                              </p>
                              {!question.is_correct && (
                                <p>
                                  <span className="font-medium">Correct answer:</span>{' '}
                                  <span className="text-green-700">
                                    {JSON.stringify(question.correct_answer)}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
