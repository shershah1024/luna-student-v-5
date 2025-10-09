'use client'

import { useState, useEffect } from 'react'
import { Flame, Target, Calendar } from 'lucide-react'
import { sampleActivityData, type SampleActivityData } from '@/data/sampleData'

interface ActivityData {
  weeklyTimeSpent: number
  todayTimeSpent?: number
  monthlyTimeSpent?: number
  allTimeSpent?: number
  averageScore: number
  skillScores: {
    reading: number | null
    listening: number | null
    writing: number | null
    speaking: number | null
  }
  totalLessons: number
  completedLessons: number
  completedLessonsToday?: number
  completedLessonsMonth?: number
  totalTests: number
  completedTests: number
  completedTestsToday?: number
  completedTestsMonth?: number
  totalVocabulary: number
  learnedVocabulary: number
  learnedVocabularyToday?: number
  learnedVocabularyMonth?: number
  streaks: {
    current: number
    longest: number
    active_today: boolean
  }
  exerciseTypesCompleted?: string[]
  testAttempts?: {
    reading: number
    listening: number
    speaking: number
    writing: number
  }
  recentTestDays?: number
  averageImprovement?: number
  pronunciationScore?: number | null
  grammarScore?: number | null
  activeDaysLast30?: number
}

type TimeRange = 'today' | 'week' | 'month' | 'all'

interface ActivityCardProps {
  courseId: string
  userId?: string
}

export default function ActivityCard({ courseId, userId }: ActivityCardProps) {
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week')

  // Initialize component - for now use sample data, later we can add a specific activity API
  useEffect(() => {
    console.log('[ActivityCard] Initializing - userId:', userId, 'courseId:', courseId)
    
    if (!userId) {
      console.log('[ActivityCard] No userId provided, using sample data')
    } else {
      console.log('[ActivityCard] User exists but using sample data for now')
      // TODO: Create a dedicated /api/user-activity endpoint that returns just activity metrics
      // without complex RPC calls - time spent, lessons completed, streaks, etc.
    }
    
    setLoading(false)
  }, [courseId, userId])


  if (loading) {
    return (
      <div className="md:col-span-2 lg:row-span-2 bg-gray-300 rounded-3xl p-8 animate-pulse">
        <div className="h-4 bg-gray-400 rounded w-20 mb-4"></div>
        <div className="h-8 bg-gray-400 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-400 rounded w-24"></div>
      </div>
    )
  }

  // Use sample data if no real data exists
  const displayData = activityData || sampleActivityData

  return (
    <div className="md:col-span-2 lg:row-span-2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl p-8 relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      <div>
        {/* Sample Data Banner */}
        {!activityData && (
          <div className="mb-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
            <div className="text-white font-semibold text-lg mb-1">
              No Data Yet
            </div>
            <div className="text-white/90 text-sm">
              📊 Showing sample data - Start learning to see your real progress!
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 relative z-10">
          <button
            onClick={() => setSelectedTimeRange('today')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedTimeRange === 'today'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedTimeRange('week')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedTimeRange === 'week'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedTimeRange('month')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedTimeRange === 'month'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedTimeRange('all')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedTimeRange === 'all'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            All Time
          </button>
        </div>
        
        {/* Activity Statements */}
        <div className="flex flex-col justify-start pt-2 space-y-6">
          {selectedTimeRange === 'today' && (
            <>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.learnedVocabularyToday || 0}</span>
                <span className="text-sm ml-2 text-white/90">new words mastered</span>
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedLessonsToday || 0}</span> lessons completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedTestsToday || 0}</span> test sections completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.streaks?.active_today ? 1 : 0}</span> day{displayData.streaks?.active_today ? '' : 's'} active
              </div>
              <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-white/90">
                    <span className="font-bold">{displayData.streaks?.current || 0}</span> day streak
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-white/90">
                    Best: <span className="font-bold">{displayData.streaks?.longest || 0}</span> days
                  </span>
                </div>
              </div>
            </>
          )}
          
          {selectedTimeRange === 'week' && (
            <>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.learnedVocabulary || 0}</span>
                <span className="text-sm ml-2 text-white/90">new words mastered</span>
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedLessons || 0}</span> lessons completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedTests || 0}</span> test sections completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{Math.min(displayData.streaks?.current || 0, 7)}</span> days active
              </div>
              <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-white/90">
                    <span className="font-bold">{displayData.streaks?.current || 0}</span> day streak
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-white/90">
                    Best: <span className="font-bold">{displayData.streaks?.longest || 0}</span> days
                  </span>
                </div>
              </div>
            </>
          )}
          
          {selectedTimeRange === 'month' && (
            <>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.learnedVocabularyMonth || 0}</span>
                <span className="text-sm ml-2 text-white/90">new words mastered</span>
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedLessonsMonth || 0}</span> lessons completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedTestsMonth || 0}</span> test sections completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.activeDaysLast30 || 0}</span> days active
              </div>
              <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-white/90">
                    <span className="font-bold">{displayData.streaks?.current || 0}</span> day streak
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-white/90">
                    Best: <span className="font-bold">{displayData.streaks?.longest || 0}</span> days
                  </span>
                </div>
              </div>
            </>
          )}
          
          {selectedTimeRange === 'all' && (
            <>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.learnedVocabulary || 0}</span> total words mastered
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedLessons || 0}</span> lessons completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.completedTests || 0}</span> test sections completed
              </div>
              <div className="text-white">
                <span className="font-bold text-3xl">{displayData.streaks?.longest || 0}</span> day longest streak
              </div>
              <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-white/90">
                    Current: <span className="font-bold">{displayData.streaks?.current || 0}</span> days
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-white/90">
                    Active: <span className="font-bold">{displayData.activeDaysLast30 || 0}</span>/30 days
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
    </div>
  )
}