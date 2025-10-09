"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import {
  MessageSquare,
  ChevronLeft,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Mic,
  Star,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

interface SpeakingScore {
  id: number
  user_id: string
  task_id: string
  test_id: string
  course: string
  section: number
  score: number
  max_score: number
  percentage: number
  evaluation_data: any
  conversation_data: any
  created_at: string
}

export function SpeakingDashboard() {
  const router = useRouter()
  const { user } = useUser()
  const [scores, setScores] = useState<SpeakingScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadScores() {
      if (!user) return

      try {
        const response = await fetch("/api/user-scores")
        if (response.ok) {
          const data = await response.json()
          setScores(data.speaking || [])
        }
      } catch (error) {
        console.error("Error loading speaking scores:", error)
      } finally {
        setLoading(false)
      }
    }

    loadScores()
  }, [user])

  // Calculate statistics
  const totalTests = scores.length
  const averageScore = totalTests > 0
    ? Math.round(scores.reduce((sum, score) => sum + score.percentage, 0) / totalTests)
    : 0
  const perfectScores = scores.filter(s => s.percentage === 100).length
  const recentScores = scores.slice(0, 5)

  // Prepare chart data
  const progressData = scores
    .slice(-10)
    .reverse()
    .map((score, index) => ({
      test: `Test ${index + 1}`,
      score: score.percentage,
      date: new Date(score.created_at).toLocaleDateString(),
    }))

  const sectionData = scores.reduce((acc, score) => {
    const section = `Section ${score.section}`
    if (!acc[section]) {
      acc[section] = { section, total: 0, count: 0 }
    }
    acc[section].total += score.percentage
    acc[section].count++
    return acc
  }, {} as Record<string, { section: string; total: number; count: number }>)

  const sectionAverages = Object.values(sectionData).map(data => ({
    section: data.section,
    average: Math.round(data.total / data.count),
  }))

  // Extract evaluation criteria if available
  const criteriaData = scores.length > 0 && scores[0].evaluation_data
    ? Object.entries(scores[0].evaluation_data)
        .filter(([key]) => key !== 'feedback' && typeof scores[0].evaluation_data[key] === 'number')
        .map(([criterion, _]) => {
          const avg = scores.reduce((sum, score) => {
            const value = score.evaluation_data?.[criterion]
            return sum + (typeof value === 'number' ? value : 0)
          }, 0) / scores.length
          return {
            criterion: criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            average: Math.round(avg),
          }
        })
    : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 pt-20">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 pt-16 sm:pt-20">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4 touch-manipulation"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Speaking Progress</h1>
                <p className="text-sm sm:text-base text-gray-600">Track your spoken German communication skills</p>
              </div>
            </div>
            <Badge className="bg-pink-500 text-white text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 self-start sm:self-auto">
              {averageScore}% Average
            </Badge>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                <span className="hidden sm:inline">Total Sessions</span>
                <span className="sm:hidden">Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{totalTests}</div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="hidden sm:inline">Average Score</span>
                <span className="sm:hidden">Average</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{averageScore}%</div>
              <Progress value={averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                <span className="hidden sm:inline">Perfect Scores</span>
                <span className="sm:hidden">Perfect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{perfectScores}</div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">100% results</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                Best Section
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {sectionAverages.length > 0
                  ? sectionAverages.sort((a, b) => b.average - a.average)[0].section
                  : "N/A"}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {sectionAverages.length > 0
                  ? `${sectionAverages.sort((a, b) => b.average - a.average)[0].average}% avg`
                  : "No data"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Progress Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-pink-600" />
                  Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="test" 
                        fontSize={12}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        fontSize={12}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ fill: "#ec4899", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#ec4899", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Criteria Performance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-pink-600" />
                  Speaking Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {criteriaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={criteriaData} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="criterion" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        fontSize={10}
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        fontSize={12}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="average" 
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
                    No criteria data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-pink-600" />
                Recent Speaking Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentScores.length > 0 ? (
                <div className="space-y-3">
                  {recentScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{score.task_id}</p>
                          <p className="text-sm text-gray-600">
                            Section {score.section} • {new Date(score.created_at).toLocaleDateString()}
                          </p>
                          {score.conversation_data?.duration && (
                            <p className="text-xs text-gray-500">
                              Duration: {Math.round(score.conversation_data.duration)}s
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            score.percentage >= 90
                              ? "bg-emerald-500 text-white"
                              : score.percentage >= 70
                              ? "bg-blue-500 text-white"
                              : "bg-amber-500 text-white"
                          }
                        >
                          {score.percentage}%
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {score.score}/{score.max_score}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No speaking sessions completed yet. Start practicing to see your progress!
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <Button
            onClick={() => router.push("/tests/speaking")}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white touch-manipulation py-3 sm:py-2"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Practice Speaking
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="touch-manipulation py-3 sm:py-2"
          >
            Back to Overview
          </Button>
        </motion.div>
      </main>
    </div>
  )
}