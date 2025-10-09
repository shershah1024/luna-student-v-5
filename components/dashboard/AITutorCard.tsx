'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sampleTutorRecommendation, type SampleTutorRecommendation } from '@/data/sampleData'

interface TutorRecommendation {
  hasRecommendation: boolean
  recommendation?: string
  priority_level?: string
  week_start_date?: string
}

interface AITutorCardProps {
  courseId: string
  userId?: string
}

export default function AITutorCard({ courseId, userId }: AITutorCardProps) {
  const [tutorRecommendation, setTutorRecommendation] = useState<TutorRecommendation | null>(null)
  const [recommendationLoading, setRecommendationLoading] = useState(false)

  // Fetch AI tutor recommendation
  useEffect(() => {
    async function fetchOrGenerateRecommendation() {
      console.log('[AITutorCard] Starting fetch - userId:', userId, 'courseId:', courseId)
      
      if (!userId) {
        console.log('[AITutorCard] No userId provided, using sample data')
        return
      }
      
      setRecommendationLoading(true)
      
      try {
        const checkUrl = `/api/ai-tutor-recommendation?course=${courseId}`
        console.log('[AITutorCard] Checking existing recommendation:', checkUrl)
        
        // First, check if recommendation exists for this week
        const checkResponse = await fetch(checkUrl)
        console.log('[AITutorCard] Check response status:', checkResponse.status, 'ok:', checkResponse.ok)
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          console.log('[AITutorCard] Check data received:', {
            hasRecommendation: checkData.hasRecommendation,
            recommendation: checkData.recommendation ? 'Present' : 'Not present'
          })
          
          if (checkData.hasRecommendation) {
            // Recommendation exists, display it
            console.log('[AITutorCard] Using existing recommendation')
            setTutorRecommendation(checkData)
          } else {
            // No recommendation for this week, generate one
            console.log('[AITutorCard] Generating new recommendation')
            const generateResponse = await fetch(`/api/ai-tutor-recommendation?course=${courseId}`, {
              method: 'POST'
            })
            console.log('[AITutorCard] Generate response status:', generateResponse.status, 'ok:', generateResponse.ok)
            
            if (generateResponse.ok) {
              const generateData = await generateResponse.json()
              console.log('[AITutorCard] Generated recommendation data:', generateData)
              setTutorRecommendation({ ...generateData, hasRecommendation: true })
            } else {
              const errorText = await generateResponse.text()
              console.error('[AITutorCard] Generate API error - Status:', generateResponse.status, 'Response:', errorText)
              setTutorRecommendation({ hasRecommendation: false })
            }
          }
        } else {
          const errorText = await checkResponse.text()
          console.error('[AITutorCard] Check API error - Status:', checkResponse.status, 'Response:', errorText)
          setTutorRecommendation({ hasRecommendation: false })
        }
      } catch (error) {
        console.error('[AITutorCard] Fetch/generate error:', error)
        setTutorRecommendation({ hasRecommendation: false })
      } finally {
        console.log('[AITutorCard] Fetch/generate completed, loading set to false')
        setRecommendationLoading(false)
      }
    }

    fetchOrGenerateRecommendation()
  }, [courseId, userId])

  // Generate new recommendation
  const generateRecommendation = async () => {
    setRecommendationLoading(true)
    try {
      const response = await fetch(`/api/ai-tutor-recommendation?course=${courseId}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTutorRecommendation(data)
      }
    } catch (error) {
      console.error('Failed to generate recommendation:', error)
    } finally {
      setRecommendationLoading(false)
    }
  }

  if (recommendationLoading && !tutorRecommendation) {
    return (
      <div className="bg-gray-300 rounded-3xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-400 rounded"></div>
            <div className="h-3 bg-gray-400 rounded w-32"></div>
          </div>
          <div className="h-4 w-4 bg-gray-400 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-400 rounded w-20"></div>
          <div className="h-4 bg-gray-400 rounded w-full"></div>
          <div className="h-4 bg-gray-400 rounded w-3/4"></div>
          <div className="h-3 bg-gray-400 rounded w-16"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-300" />
            <div className="text-xs font-medium text-white uppercase tracking-wider">AI Tutor Recommendation</div>
          </div>
          <Sparkles className="h-4 w-4 text-yellow-300" />
        </div>
        {!userId && (
          <div className="mb-3 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <div className="text-white font-semibold text-sm mb-1">
              No Data Yet
            </div>
            <div className="text-white/90 text-xs">
              🤖 Showing sample AI recommendation
            </div>
          </div>
        )}
        
        {recommendationLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-3"></div>
            <div className="text-sm text-white text-center">
              Analyzing your progress and generating personalized recommendations...
            </div>
          </div>
        ) : tutorRecommendation?.hasRecommendation ? (
          <div className="flex-1">
            <div className="text-xs text-white/70 font-medium mb-2">
              Week of {new Date(tutorRecommendation.week_start_date || '').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-white mb-3 leading-relaxed">
              {tutorRecommendation.recommendation}
            </div>
            <div className="text-xs text-white/70">
              Priority: <span className="font-medium capitalize text-yellow-300">{tutorRecommendation.priority_level}</span>
            </div>
          </div>
        ) : !userId ? (
          <div className="flex-1">
            <div className="text-xs text-white/70 font-medium mb-2">
              Week of {new Date(sampleTutorRecommendation.week_start_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-white mb-3 leading-relaxed">
              {sampleTutorRecommendation.recommendation}
            </div>
            <div className="text-xs text-white/70">
              Priority: <span className="font-medium capitalize text-yellow-300">{sampleTutorRecommendation.priority_level}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-sm text-white mb-3">
              Unable to generate recommendation at this time
            </div>
            <Button
              size="sm"
              onClick={generateRecommendation}
              disabled={recommendationLoading}
              className="bg-white text-purple-600 hover:bg-white/90 text-xs shadow-lg"
            >
              <Sparkles className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}