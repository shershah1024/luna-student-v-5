/**
 * Grammar Dashboard
 * Shows all grammar quiz attempts and performance analytics by topic
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookMarked,
  Calendar,
  ChevronRight,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface GrammarStats {
  totalQuizzes: number
  totalQuestions: number
  overallAccuracy: number
  averageScore: number
  lastQuizDate: string | null
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

interface QuizAttempt {
  task_id: string
  attempt_number: number
  task_title: string
  grammar_topics: string[]
  language: string
  level: string
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  accuracy: number
  total_points: number
  max_points: number
  percentage: number
  quiz_date: string
  questions: Question[]
}

interface TopicStats {
  topic: string
  quiz_count: number
  total_questions: number
  total_correct: number
  average_accuracy: number
  last_practiced: string
}

export default function GrammarDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: GrammarStats
    quizAttempts: QuizAttempt[]
    topicStats: TopicStats[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAttempt | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/grammar')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        quizAttempts: result.quizAttempts,
        topicStats: result.topicStats
      })
    } catch (err) {
      console.error('Error fetching grammar dashboard:', err)
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
          <p className="text-slate-600 font-medium">Loading your grammar progress...</p>
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

  const { stats, quizAttempts, topicStats } = data

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Grammar Dashboard</h1>
          <p className="text-gray-600">Track your grammar quiz performance and analyze error patterns</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Quizzes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Quizzes Taken</CardTitle>
                <BookMarked className="w-5 h-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
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

        {/* Most Practiced Grammar Topics */}
        {topicStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Practiced Grammar Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicStats.slice(0, 6).map((topic) => (
                <Card key={topic.topic} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold line-clamp-2">{topic.topic}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{topic.quiz_count} quizzes</p>
                      <p className="text-gray-600">{topic.total_questions} total questions</p>
                      <p className="font-bold text-green-600">{topic.average_accuracy.toFixed(1)}% accuracy</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Quiz Attempts */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Quizzes</h2>

          {quizAttempts.length === 0 ? (
            <Card className="p-12 text-center">
              <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes taken yet</h3>
              <p className="text-gray-600 mb-6">
                Complete a grammar quiz to see your results here!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {quizAttempts.map((quiz, index) => {
                const formattedDate = new Date(quiz.quiz_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                const accuracyColor = quiz.accuracy >= 80 ? 'text-green-600' :
                                     quiz.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'

                return (
                  <Card key={`${quiz.task_id}-${quiz.attempt_number}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Date */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {quiz.task_title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              Attempt {quiz.attempt_number}
                            </Badge>
                            {quiz.level && (
                              <Badge variant="outline">{quiz.level}</Badge>
                            )}
                          </div>

                          {/* Grammar Topics */}
                          {quiz.grammar_topics.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {quiz.grammar_topics.map((topic, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{quiz.total_questions} questions</span>
                          </div>

                          {/* Results */}
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                              <p className={`text-xl font-bold ${accuracyColor}`}>
                                {quiz.accuracy.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Correct</p>
                              <p className="text-xl font-bold text-green-600">
                                {quiz.correct_answers}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Incorrect</p>
                              <p className="text-xl font-bold text-red-600">
                                {quiz.incorrect_answers}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Score</p>
                              <p className="text-xl font-bold text-blue-600">
                                {quiz.percentage.toFixed(0)}%
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="bg-gray-200 rounded-full h-2 mb-4">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${quiz.accuracy}%` }}
                            ></div>
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedQuiz(quiz)}
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

      {/* Detailed Quiz Results Modal */}
      {selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedQuiz.task_title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedQuiz.quiz_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Attempt {selectedQuiz.attempt_number}</Badge>
                      <Badge variant="outline">{selectedQuiz.level}</Badge>
                      <span className="text-sm text-gray-600">
                        {selectedQuiz.correct_answers}/{selectedQuiz.total_questions} correct
                      </span>
                    </div>
                    {selectedQuiz.grammar_topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedQuiz.grammar_topics.map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuiz(null)}
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
                        {selectedQuiz.accuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Points</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedQuiz.total_points}/{selectedQuiz.max_points}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Overall</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedQuiz.percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question Results */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Question-by-Question Results</h3>
                  <div className="space-y-3">
                    {selectedQuiz.questions.map((question, index) => (
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
