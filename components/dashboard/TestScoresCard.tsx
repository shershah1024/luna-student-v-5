'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { sampleTestScoresData } from '@/data/sampleData'

interface TestProgressData {
  skillScores: {
    reading: number | null
    listening: number | null
    writing: number | null
    speaking: number | null
  }
  testAttempts: {
    reading: number
    listening: number
    writing: number
    speaking: number
  }
  sectionAttempts: {
    reading: number
    listening: number
    writing: number
    speaking: number
  }
  overallAverage: number
  totalTestsSections: number
  nextTest: {
    examId: string
    examName: string
    testType: 'reading' | 'listening' | 'writing' | 'speaking'
    testId?: string
  } | null
  recommendations: string[]
}

interface TestScoresCardProps {
  courseId: string
  userId?: string
  onTestScoresModalOpen: () => void
}

export default function TestScoresCard({ courseId, userId, onTestScoresModalOpen }: TestScoresCardProps) {
  const router = useRouter()
  const [testData, setTestData] = useState<TestProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real test progress data from our new API
  useEffect(() => {
    async function fetchTestProgress() {
      if (!userId) {
        console.log('[TestScoresCard] No userId provided, using sample data')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        console.log('[TestScoresCard] Fetching test progress for userId:', userId, 'courseId:', courseId)
        
        const response = await fetch(`/api/test-progress?course=${courseId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch test progress: ${response.status}`)
        }
        
        const data: TestProgressData = await response.json()
        console.log('[TestScoresCard] Test progress data received:', data)
        setTestData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test progress'
        console.error('[TestScoresCard] Error fetching test progress:', errorMessage)
        setError(errorMessage)
        // Don't set testData to null on error, keep existing data if any
      } finally {
        setLoading(false)
      }
    }

    fetchTestProgress()
  }, [courseId, userId])

  if (loading) {
    return (
      <div className="md:col-span-2 bg-gray-300 rounded-3xl p-6 animate-pulse">
        <div className="h-4 bg-gray-400 rounded w-20 mb-4"></div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-400 mb-1"></div>
              <div className="h-3 bg-gray-400 rounded w-12 mx-auto mb-1"></div>
              <div className="h-2 bg-gray-400 rounded w-8 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Use sample data if no real data exists or if there's an error without userId
  const displayData = testData || (userId ? null : sampleTestScoresData)
  const hasRealData = testData && testData.totalTestsSections > 0

  return (
    <div className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-sm font-medium text-white uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
          onClick={onTestScoresModalOpen}
        >
          Test Scores <span className="text-xs normal-case">(click for details)</span>
        </h3>
        
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-400/30">
            <div className="text-white font-semibold text-sm mb-1">
              Error Loading
            </div>
            <div className="text-white/90 text-xs">
              ⚠️ Could not fetch test data
            </div>
          </div>
        )}
        
        
        {!userId && (
          <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-yellow-400/30">
            <div className="text-white font-semibold text-sm mb-1">
              Sample Data
            </div>
            <div className="text-white/90 text-xs">
              🔍 Sign in to see your progress
            </div>
          </div>
        )}
        
      </div>
      {/* Show skill scores only if we have real data or sample data for non-authenticated users */}
      {(hasRealData || (!userId && displayData)) ? (
        <div className="grid grid-cols-4 gap-3">
          {/* Reading Score */}
          {(hasRealData ? testData.skillScores.reading : displayData?.skillScores?.reading) !== null ? (
            <div className="text-center cursor-pointer" onClick={onTestScoresModalOpen}>
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-200 flex items-center justify-center mb-1 hover:bg-orange-300 transition-colors">
                <span className="text-xl font-bold text-orange-700">
                  {Math.round(hasRealData ? testData.skillScores.reading! : displayData?.skillScores?.reading!)}%
                </span>
              </div>
              <div className="text-xs text-white font-medium">Reading</div>
              <div className="text-xs text-white/70">
                {hasRealData ? testData.testAttempts.reading : (displayData?.testAttempts?.reading || 0)} tests
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-1">
                <span className="text-xl text-white/50">-</span>
              </div>
              <div className="text-xs text-white/50">Reading</div>
              <div className="text-xs text-white/30">0 tests</div>
            </div>
          )}
          
          {/* Listening Score */}
          {(hasRealData ? testData.skillScores.listening : displayData?.skillScores?.listening) !== null ? (
            <div className="text-center cursor-pointer" onClick={onTestScoresModalOpen}>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-200 flex items-center justify-center mb-1 hover:bg-green-300 transition-colors">
                <span className="text-xl font-bold text-green-700">
                  {Math.round(hasRealData ? testData.skillScores.listening! : displayData?.skillScores?.listening!)}%
                </span>
              </div>
              <div className="text-xs text-white font-medium">Listening</div>
              <div className="text-xs text-white/70">
                {hasRealData ? testData.testAttempts.listening : (displayData?.testAttempts?.listening || 0)} tests
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-1">
                <span className="text-xl text-white/50">-</span>
              </div>
              <div className="text-xs text-white/50">Listening</div>
              <div className="text-xs text-white/30">0 tests</div>
            </div>
          )}
          
          {/* Speaking Score */}
          {(hasRealData ? testData.skillScores.speaking : displayData?.skillScores?.speaking) !== null ? (
            <div className="text-center cursor-pointer" onClick={onTestScoresModalOpen}>
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-200 flex items-center justify-center mb-1 hover:bg-blue-300 transition-colors">
                <span className="text-xl font-bold text-blue-700">
                  {Math.round(hasRealData ? testData.skillScores.speaking! : displayData?.skillScores?.speaking!)}%
                </span>
              </div>
              <div className="text-xs text-white font-medium">Speaking</div>
              <div className="text-xs text-white/70">
                {hasRealData ? testData.testAttempts.speaking : (displayData?.testAttempts?.speaking || 0)} tests
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-1">
                <span className="text-xl text-white/50">-</span>
              </div>
              <div className="text-xs text-white/50">Speaking</div>
              <div className="text-xs text-white/30">0 tests</div>
            </div>
          )}
          
          {/* Writing Score */}
          {(hasRealData ? testData.skillScores.writing : displayData?.skillScores?.writing) !== null ? (
            <div className="text-center cursor-pointer" onClick={onTestScoresModalOpen}>
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-200 flex items-center justify-center mb-1 hover:bg-purple-300 transition-colors">
                <span className="text-xl font-bold text-purple-700">
                  {Math.round(hasRealData ? testData.skillScores.writing! : displayData?.skillScores?.writing!)}%
                </span>
              </div>
              <div className="text-xs text-white font-medium">Writing</div>
              <div className="text-xs text-white/70">
                {hasRealData ? testData.testAttempts.writing : (displayData?.testAttempts?.writing || 0)} tests
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-1">
                <span className="text-xl text-white/50">-</span>
              </div>
              <div className="text-xs text-white/50">Writing</div>
              <div className="text-xs text-white/30">0 tests</div>
            </div>
          )}
        </div>
      ) : (
        /* Clean "no data" state for authenticated users with no test progress */
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-white font-semibold text-lg mb-2">No Test Data Yet</h4>
          <p className="text-white/80 text-sm text-center max-w-xs mb-4">
            Complete lessons to track your German language skills and progress
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white/90">Reading</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white/90">Listening</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white/90">Speaking</span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white/90">Writing</span>
          </div>
        </div>
      )}
    </div>
  )
}