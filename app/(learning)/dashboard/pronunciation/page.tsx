/**
 * Pronunciation Dashboard
 * Shows all pronunciation practice sessions and word-level scores
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Volume2,
  Calendar,
  ChevronRight,
  Target,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PronunciationStats {
  totalSessions: number
  totalWords: number
  averageScore: number
  lastPracticeDate: string | null
}

interface WordScore {
  id: string
  word: string
  pronunciation_score: number
  created_at: string
  word_details: any
}

interface PracticeSession {
  task_id: string
  attempt_id: string
  task_title: string
  theme: string
  language: string
  level: string
  total_words: number
  average_score: number
  session_date: string
  words: WordScore[]
}

interface ThemeStats {
  theme: string
  session_count: number
  total_words: number
  average_score: number
  last_practiced: string
}

export default function PronunciationDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: PronunciationStats
    practiceSessions: PracticeSession[]
    themeStats: ThemeStats[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/pronunciation')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        practiceSessions: result.practiceSessions,
        themeStats: result.themeStats
      })
    } catch (err) {
      console.error('Error fetching pronunciation dashboard:', err)
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
          <p className="text-slate-600 font-medium">Loading your pronunciation progress...</p>
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

  const { stats, practiceSessions, themeStats } = data

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pronunciation Dashboard</h1>
          <p className="text-gray-600">Track your pronunciation practice and improvement</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Practice Sessions</CardTitle>
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
            </CardContent>
          </Card>

          {/* Total Words */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Words Practiced</CardTitle>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWords}</p>
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
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore.toFixed(0)}</p>
            </CardContent>
          </Card>

          {/* Last Practice */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Last Practice</CardTitle>
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-gray-900">
                {stats.lastPracticeDate
                  ? new Date(stats.lastPracticeDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Practice Themes */}
        {themeStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Practice Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themeStats.slice(0, 6).map((theme) => (
                <Card key={theme.theme} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-semibold line-clamp-2 capitalize">
                          {theme.theme}
                        </CardTitle>
                      </div>
                      <Award className="w-5 h-5 text-yellow-600 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{theme.session_count} sessions</p>
                      <p className="text-gray-600">{theme.total_words} words</p>
                      <p className={`font-bold ${getScoreColor(theme.average_score)}`}>
                        {theme.average_score.toFixed(0)} avg score
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Practice Sessions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Sessions</h2>

          {practiceSessions.length === 0 ? (
            <Card className="p-12 text-center">
              <Volume2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No practice sessions yet</h3>
              <p className="text-gray-600 mb-6">
                Start practicing pronunciation to see your results here!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {practiceSessions.map((session, index) => {
                const formattedDate = new Date(session.session_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                const scoreColor = getScoreColor(session.average_score)

                return (
                  <Card key={`${session.task_id}-${session.attempt_id}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Date */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {session.task_title}
                            </h3>
                            {session.level && (
                              <Badge variant="outline">{session.level}</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs capitalize">
                              {session.theme}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{session.total_words} words</span>
                          </div>

                          {/* Results */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Words Practiced</p>
                              <p className="text-xl font-bold text-blue-600">
                                {session.total_words}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Average Score</p>
                              <p className={`text-xl font-bold ${scoreColor}`}>
                                {session.average_score.toFixed(0)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="bg-gray-200 rounded-full h-2 mb-4">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                session.average_score >= 90 ? 'bg-green-600' :
                                session.average_score >= 75 ? 'bg-yellow-600' : 'bg-orange-600'
                              }`}
                              style={{ width: `${session.average_score}%` }}
                            ></div>
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSession(session)}
                            className="mt-2"
                          >
                            View Word Scores
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

      {/* Detailed Session Results Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedSession.task_title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedSession.session_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedSession.level}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {selectedSession.theme}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {selectedSession.total_words} words
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSession(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Words Practiced</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedSession.total_words}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Average Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(selectedSession.average_score)}`}>
                        {selectedSession.average_score.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Word Scores */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Word-by-Word Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedSession.words.map((wordScore, index) => (
                      <div
                        key={wordScore.id}
                        className="border rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{wordScore.word}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getScoreColor(wordScore.pronunciation_score)}`}>
                              {wordScore.pronunciation_score.toFixed(0)}
                            </p>
                          </div>
                        </div>
                        {/* Progress bar for each word */}
                        <div className="bg-gray-200 rounded-full h-1.5 mt-2">
                          <div
                            className={`h-1.5 rounded-full ${
                              wordScore.pronunciation_score >= 90 ? 'bg-green-600' :
                              wordScore.pronunciation_score >= 75 ? 'bg-yellow-600' : 'bg-orange-600'
                            }`}
                            style={{ width: `${wordScore.pronunciation_score}%` }}
                          ></div>
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
