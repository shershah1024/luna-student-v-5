"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import {
  Book,
  Headphones,
  PenTool,
  Target,
  Mic,
  MessageSquare,
  TrendingUp,
  Clock,
  Calendar,
  ArrowLeft,
  BarChart3,
  Trophy,
  Star,
  Zap,
  ChevronRight,
  BookMarked,
  Timer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Score {
  id: number
  user_id: string
  test_id: string
  section: number
  score: number
  total_score: number
  created_at: string
  course?: string
  percentage?: number
  exam_id?: string
}

interface PronunciationScore {
  id: number
  user_id: string
  word: string
  language: string
  pronunciation_score: number
  accuracy_score: number
  word_details: any[]
  course: string
  exercise_type: string
  created_at: string
}

interface TestDashboardProps {
  skillType: "reading" | "listening" | "writing" | "grammar" | "pronunciation" | "speaking"
}

const skillConfig = {
  reading: {
    name: "Reading",
    icon: Book,
    gradient: "from-emerald-400 to-green-500",
    bgGradient: "from-emerald-50 to-green-50",
    emoji: "📚",
    description: "German text comprehension and analysis"
  },
  listening: {
    name: "Listening",
    icon: Headphones,
    gradient: "from-orange-400 to-red-500",
    bgGradient: "from-orange-50 to-red-50",
    emoji: "🎧",
    description: "German audio comprehension and understanding"
  },
  writing: {
    name: "Writing",
    icon: PenTool,
    gradient: "from-indigo-400 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50",
    emoji: "✍️",
    description: "German written expression and composition"
  },
  grammar: {
    name: "Grammar",
    icon: Target,
    gradient: "from-amber-400 to-yellow-500",
    bgGradient: "from-amber-50 to-yellow-50",
    emoji: "🎯",
    description: "German grammar rules and structure"
  },
  pronunciation: {
    name: "Pronunciation",
    icon: Mic,
    gradient: "from-pink-400 to-rose-500",
    bgGradient: "from-pink-50 to-rose-50",
    emoji: "🗣️",
    description: "German pronunciation and speaking accuracy"
  },
  speaking: {
    name: "Speaking",
    icon: MessageSquare,
    gradient: "from-violet-400 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
    emoji: "💬",
    description: "German spoken communication and fluency"
  }
}

const getPerformanceBadgeStyle = (percentage: number) => {
  if (percentage >= 90) return "bg-emerald-500 text-white"
  if (percentage >= 80) return "bg-blue-500 text-white"
  if (percentage >= 70) return "bg-amber-500 text-white"
  return "bg-red-500 text-white"
}

const getPerformanceMessage = (percentage: number) => {
  if (percentage >= 95) return "Perfect mastery! 🏆"
  if (percentage >= 90) return "Excellent work! ⭐"
  if (percentage >= 80) return "Great progress! 💪"
  if (percentage >= 70) return "Good effort! 👍"
  if (percentage >= 60) return "Keep practicing! 📚"
  return "More practice needed! 🚀"
}

export function TestDashboard({ skillType }: TestDashboardProps) {
  const router = useRouter()
  const { user } = useUser()
  const [scores, setScores] = useState<Score[]>([])
  const [pronunciationScores, setPronunciationScores] = useState<PronunciationScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = skillConfig[skillType]
  const Icon = config.icon

  useEffect(() => {
    async function loadTestData() {
      if (!user) return

      setLoading(true)
      try {
        const response = await fetch("/api/user-scores")
        if (!response.ok) {
          throw new Error("Failed to fetch test scores")
        }

        const data = await response.json()
        if (skillType === 'pronunciation') {
          setPronunciationScores(data[skillType] || [])
        } else {
          setScores(data[skillType] || [])
        }
      } catch (err) {
        console.error("Error loading test data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadTestData()
  }, [user, skillType])

  // Calculate statistics
  const totalTests = skillType === 'pronunciation' ? pronunciationScores.length : scores.length
  const averageScore = skillType === 'pronunciation' 
    ? (pronunciationScores.length > 0 
        ? Math.round(pronunciationScores.reduce((sum, score) => sum + score.pronunciation_score, 0) / pronunciationScores.length)
        : 0)
    : (totalTests > 0 
        ? Math.round(scores.reduce((sum, score) => sum + (score.score / score.total_score) * 100, 0) / totalTests)
        : 0)
  
  const recentScores = skillType === 'pronunciation'
    ? pronunciationScores
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
    : scores
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

  const perfectScores = skillType === 'pronunciation'
    ? pronunciationScores.filter(score => score.pronunciation_score >= 95).length
    : scores.filter(score => score.score === score.total_score).length
  const goodScores = skillType === 'pronunciation'
    ? pronunciationScores.filter(score => score.pronunciation_score >= 80).length
    : scores.filter(score => (score.score / score.total_score) >= 0.8).length

  // Group scores by exam_id (for pronunciation, group by word or course)
  const examGroups = skillType === 'pronunciation'
    ? pronunciationScores.reduce((acc: Record<string, PronunciationScore[]>, score) => {
        const groupKey = score.word
        if (!acc[groupKey]) {
          acc[groupKey] = []
        }
        acc[groupKey].push(score)
        return acc
      }, {})
    : scores.reduce((acc: Record<string, Score[]>, score) => {
        // Group by exam_id if available, otherwise fallback to test_id
        const groupKey = score.exam_id || `no-exam-${score.test_id}`
        if (!acc[groupKey]) {
          acc[groupKey] = []
        }
        acc[groupKey].push(score)
        return acc
      }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf2f8] pt-20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12 sm:py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdf2f8] pt-16 sm:pt-20">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-4 mb-4 sm:mb-6">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="flex items-center gap-2 hover:bg-gray-100 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>

          <div className={`bg-gradient-to-r ${config.bgGradient} rounded-xl sm:rounded-2xl p-4 sm:p-8 border-2 border-gray-200`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className={`p-3 sm:p-4 bg-gradient-to-br ${config.gradient} rounded-xl sm:rounded-2xl shadow-xl relative`}>
                  <Icon className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-lg sm:text-2xl">
                    {config.emoji}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {config.name} Dashboard
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-lg">{config.description}</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalTests}</p>
                <p className="text-gray-600 text-sm sm:text-base">Total Tests</p>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg"
          >
            <p className="text-red-800 font-medium">Unable to load test data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}

        {totalTests === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 sm:py-20"
          >
            <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${config.gradient} rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl`}>
              <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              No {config.name} Tests Yet
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
              Start your {config.name.toLowerCase()} journey and track your progress here!
            </p>
            <Button
              onClick={() => router.push("/courses")}
              className={`bg-gradient-to-r ${config.gradient} hover:shadow-xl text-white shadow-lg px-6 sm:px-8 py-3 rounded-xl font-semibold touch-manipulation`}
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Start {config.name} Tests 🚀
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              <Card className={`bg-gradient-to-br ${config.gradient} text-white border-0 shadow-xl`}>
                <CardContent className="p-3 sm:p-6 text-center">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xl sm:text-3xl font-bold">{averageScore}%</p>
                  <p className="text-xs sm:text-sm opacity-90">Average Score</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-3 sm:p-6 text-center">
                  <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xl sm:text-3xl font-bold">{perfectScores}</p>
                  <p className="text-xs sm:text-sm opacity-90">Perfect Scores</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white border-0 shadow-xl">
                <CardContent className="p-3 sm:p-6 text-center">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xl sm:text-3xl font-bold">{goodScores}</p>
                  <p className="text-xs sm:text-sm opacity-90">
                    <span className="hidden sm:inline">Excellent Scores (80%+)</span>
                    <span className="sm:hidden">Excellent (80%+)</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-400 to-purple-600 text-white border-0 shadow-xl col-span-2 lg:col-span-1">
                <CardContent className="p-3 sm:p-6 text-center">
                  <BookMarked className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xl sm:text-3xl font-bold">{Object.keys(examGroups).length}</p>
                  <p className="text-xs sm:text-sm opacity-90">Different Exams</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    Recent Test Results
                    <Badge className={getPerformanceBadgeStyle(averageScore)}>
                      {getPerformanceMessage(averageScore)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentScores.slice(0, 8).map((score, index) => {
                      const percentage = Math.round((score.score / score.total_score) * 100)
                      return (
                        <motion.div
                          key={score.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                              percentage >= 90 ? "bg-gradient-to-br from-emerald-400 to-green-500" :
                              percentage >= 80 ? "bg-gradient-to-br from-blue-400 to-blue-500" :
                              percentage >= 70 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                              "bg-gradient-to-br from-red-400 to-red-500"
                            }`}>
                              <BookMarked className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">
                                {score.test_id.replace(/_/g, " ")}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>Section {score.section}</span>
                                <span>•</span>
                                <span>{new Date(score.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(score.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {score.score}/{score.total_score}
                            </p>
                            <Badge className={getPerformanceBadgeStyle(percentage)}>
                              {percentage}%
                            </Badge>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  {recentScores.length > 8 && (
                    <div className="text-center mt-4">
                      <Badge variant="outline" className="text-sm">
                        +{recentScores.length - 8} more tests
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Test Breakdown by Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                    Performance by Exam
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(examGroups).map(([examId, examScores], index) => {
                      const avgScore = Math.round(
                        examScores.reduce((sum, score) => sum + (score.score / score.total_score) * 100, 0) / examScores.length
                      )
                      const bestScore = Math.max(...examScores.map(score => Math.round((score.score / score.total_score) * 100)))
                      const latestScore = examScores.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                      const latestPercentage = Math.round((latestScore.score / latestScore.total_score) * 100)

                      return (
                        <motion.div
                          key={examId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="p-6 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 bg-gradient-to-br ${config.gradient} rounded-xl shadow-sm`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 capitalize">
                                  {examId.startsWith('no-exam-') ? 'Individual Test' : `Exam ${examId.slice(0, 8)}`}
                                </h3>
                                <p className="text-sm text-gray-500">{examScores.length} sections</p>
                              </div>
                            </div>
                            <Badge className={getPerformanceBadgeStyle(avgScore)}>
                              {avgScore}% avg
                            </Badge>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Average Performance</span>
                                <span className="font-semibold">{avgScore}%</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-3">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${avgScore}%` }}
                                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                  className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{bestScore}%</p>
                                <p className="text-xs text-gray-500">Best Score</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-gray-900">{latestPercentage}%</p>
                                <p className="text-xs text-gray-500">Latest</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-gray-900">{examScores.length}</p>
                                <p className="text-xs text-gray-500">Sections</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200"
        >
          <div className="text-4xl mb-4">
            {averageScore >= 90 ? "🏆" : averageScore >= 80 ? "⭐" : averageScore >= 70 ? "💪" : "🚀"}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {averageScore >= 90 ? "Outstanding Performance!" : 
             averageScore >= 80 ? "Great Work!" : 
             averageScore >= 70 ? "Good Progress!" : 
             totalTests > 0 ? "Keep Practicing!" : 
             "Ready to Start?"}
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            {totalTests > 0 
              ? `You've completed ${totalTests} ${config.name.toLowerCase()} tests with an average of ${averageScore}%. ${getPerformanceMessage(averageScore)}`
              : `Begin your ${config.name.toLowerCase()} journey and track your detailed progress here!`
            }
          </p>
          <Button
            onClick={() => router.push("/courses")}
            className={`bg-gradient-to-r ${config.gradient} hover:shadow-xl text-white shadow-lg px-8 py-3 rounded-xl font-semibold`}
          >
            <Zap className="h-5 w-5 mr-2" />
            {totalTests > 0 ? "Continue Practicing" : "Start Learning"} 🎯
          </Button>
        </motion.div>
      </main>
    </div>
  )
} 