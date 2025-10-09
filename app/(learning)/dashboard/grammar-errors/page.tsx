/**
 * Grammar Errors Dashboard
 * Cross-skill analysis of grammar errors from writing, speaking, and grammar exercises
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Info,
  FileText,
  Mic,
  BookMarked
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface GrammarErrorStats {
  totalErrors: number
  byCategoryCount: number
  bySourceCount: number
  bySeverityCount: number
  lastErrorDate: string | null
}

interface GrammarError {
  id: string
  user_id: string
  source_type: string
  source_id: string
  task_id: string
  attempt_id: number
  course: string
  language: string
  error_text: string
  correction: string
  explanation: string
  grammar_category: string
  error_type: string
  severity: string
  context: string
  created_at: string
}

interface CategoryStats {
  category: string
  count: number
  errors: GrammarError[]
}

interface SourceTypeStats {
  source_type: string
  count: number
  errors: GrammarError[]
}

interface SeverityStats {
  severity: string
  count: number
  errors: GrammarError[]
}

export default function GrammarErrorsDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: GrammarErrorStats
    recentErrors: GrammarError[]
    categoryStats: CategoryStats[]
    sourceTypeStats: SourceTypeStats[]
    severityStats: SeverityStats[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryStats | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/grammar-errors')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        recentErrors: result.recentErrors,
        categoryStats: result.categoryStats,
        sourceTypeStats: result.sourceTypeStats,
        severityStats: result.severityStats
      })
    } catch (err) {
      console.error('Error fetching grammar errors dashboard:', err)
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
          <p className="text-slate-600 font-medium">Loading your grammar error analysis...</p>
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

  const { stats, recentErrors, categoryStats, sourceTypeStats, severityStats } = data

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'major':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'moderate':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'minor':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'major':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'minor':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType.toLowerCase()) {
      case 'writing':
        return <FileText className="w-5 h-5" />
      case 'speaking':
        return <Mic className="w-5 h-5" />
      case 'grammar':
        return <BookMarked className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Grammar Errors Analysis</h1>
          <p className="text-gray-600">Cross-skill grammar error patterns and improvement areas</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Errors */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Errors</CardTitle>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalErrors}</p>
            </CardContent>
          </Card>

          {/* Error Categories */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Error Categories</CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.byCategoryCount}</p>
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Error Sources</CardTitle>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.bySourceCount}</p>
            </CardContent>
          </Card>

          {/* Last Error */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Last Error</CardTitle>
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-gray-900">
                {stats.lastErrorDate
                  ? new Date(stats.lastErrorDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Severity Breakdown */}
        {severityStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Errors by Severity</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {severityStats.map((severity) => (
                <Card key={severity.severity} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold capitalize">
                        {severity.severity}
                      </CardTitle>
                      {getSeverityIcon(severity.severity)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">{severity.count}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {((severity.count / stats.totalErrors) * 100).toFixed(0)}% of total
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Errors by Source Type */}
        {sourceTypeStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Errors by Activity Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sourceTypeStats.map((source) => (
                <Card key={source.source_type} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold capitalize">
                          {source.source_type}
                        </CardTitle>
                      </div>
                      {getSourceIcon(source.source_type)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">{source.count}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {((source.count / stats.totalErrors) * 100).toFixed(0)}% of errors
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Most Common Error Categories */}
        {categoryStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Common Error Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.slice(0, 6).map((category) => (
                <Card
                  key={category.category}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardHeader>
                    <CardTitle className="text-base font-semibold capitalize">
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">{category.count}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {((category.count / stats.totalErrors) * 100).toFixed(0)}% of errors
                    </p>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      View Examples
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Errors */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Errors</h2>

          {recentErrors.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No errors recorded yet</h3>
              <p className="text-gray-600 mb-6">
                Grammar errors from your exercises will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentErrors.map((grammarError) => {
                const formattedDate = new Date(grammarError.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })

                return (
                  <Card key={grammarError.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {grammarError.source_type}
                          </Badge>
                          <Badge className={getSeverityColor(grammarError.severity)}>
                            {grammarError.severity}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {grammarError.grammar_category}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{formattedDate}</span>
                      </div>

                      {/* Error and Correction */}
                      <div className="space-y-2 mb-3">
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-xs text-red-600 font-semibold mb-1">Error:</p>
                          <p className="text-red-800 line-through">{grammarError.error_text}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-xs text-green-600 font-semibold mb-1">Correction:</p>
                          <p className="text-green-800 font-medium">{grammarError.correction}</p>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Explanation:</p>
                        <p className="text-sm text-blue-900">{grammarError.explanation}</p>
                      </div>

                      {/* Context */}
                      {grammarError.context && (
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Context:</p>
                          <p className="text-sm text-gray-700 italic">{grammarError.context}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Details Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl capitalize">
                      {selectedCategory.category} Errors
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCategory.count} total errors in this category
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCategory.errors.slice(0, 10).map((grammarError) => (
                  <div key={grammarError.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize text-xs">
                        {grammarError.source_type}
                      </Badge>
                      <Badge className={getSeverityColor(grammarError.severity)}>
                        {grammarError.severity}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-semibold">Error:</span>{' '}
                        <span className="text-red-700 line-through">{grammarError.error_text}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Correction:</span>{' '}
                        <span className="text-green-700">{grammarError.correction}</span>
                      </p>
                      <p className="text-xs text-gray-600">{grammarError.explanation}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
