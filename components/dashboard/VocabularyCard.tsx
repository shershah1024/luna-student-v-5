'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import VocabularyProgress from '@/components/dashboard/VocabularyProgress'
import SampleVocabularyProgress from '@/components/dashboard/SampleVocabularyProgress'

interface VocabularyData {
  totalVocabulary: number
  learnedVocabulary: number
}

interface VocabularyCardProps {
  courseId: string
  userId?: string
  onVocabularyModalOpen: () => void
}

export default function VocabularyCard({ courseId, userId, onVocabularyModalOpen }: VocabularyCardProps) {
  const router = useRouter()
  const [vocabularyData, setVocabularyData] = useState<VocabularyData | null>(null)
  const [loading, setLoading] = useState(!!userId) // Only loading if we have a userId

  // Fetch vocabulary summary data
  useEffect(() => {
    async function fetchVocabularyData() {
      console.log('[VocabularyCard] Starting fetch - userId:', userId, 'courseId:', courseId)
      
      if (!userId) {
        console.log('[VocabularyCard] No userId provided, using sample data')
        setLoading(false)
        return
      }
      
      try {
        // Use the existing vocabulary progress API to get summary data
        const apiUrl = `/api/vocabulary-progress-data?limit=1`
        console.log('[VocabularyCard] Fetching from:', apiUrl)
        
        const response = await fetch(apiUrl)
        console.log('[VocabularyCard] Response status:', response.status, 'ok:', response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[VocabularyCard] Received data:', {
            hasData: !!data,
            recentCount: data?.recent?.length || 0,
            allCount: data?.all?.length || 0
          })
          
          // Calculate vocabulary stats from the progress data
          const processedData = {
            totalVocabulary: data?.all?.length || 0, // Total words user has encountered
            learnedVocabulary: data?.all?.length || 0 // Number of words with progress (same for now)
          }
          
          console.log('[VocabularyCard] Processed vocabulary data:', processedData)
          setVocabularyData(processedData)
        } else {
          const errorText = await response.text()
          console.error('[VocabularyCard] API error - Status:', response.status, 'Response:', errorText)
        }
      } catch (error) {
        console.error('[VocabularyCard] Fetch error:', error)
      } finally {
        console.log('[VocabularyCard] Fetch completed, loading set to false')
        setLoading(false)
      }
    }

    fetchVocabularyData()
  }, [courseId, userId])

  if (loading) {
    return (
      <div className="bg-gray-300 rounded-3xl p-6 animate-pulse">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-400 rounded"></div>
              <div className="h-3 bg-gray-400 rounded w-32"></div>
            </div>
            <div className="h-4 w-4 bg-gray-400 rounded"></div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <div className="h-8 bg-gray-400 rounded w-12"></div>
            <div className="h-4 bg-gray-400 rounded w-8"></div>
          </div>
          <div className="space-y-2 mb-4 flex-1">
            <div className="h-3 bg-gray-400 rounded w-20"></div>
            <div className="h-4 bg-gray-400 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-400 rounded-xl"></div>
        </div>
      </div>
    )
  }

  // Only show data if we have user data
  const hasUserData = vocabularyData !== null

  return (
    <div 
      className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onClick={onVocabularyModalOpen}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-white" />
            <div className="text-xs font-medium text-white uppercase tracking-wider">Vocabulary Practice</div>
          </div>
          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {!hasUserData && userId && (
          <div className="mb-3 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <div className="text-white font-semibold text-sm mb-1">
              No Data Yet
            </div>
            <div className="text-white/90 text-xs">
              📚 Start learning to track your vocabulary!
            </div>
          </div>
        )}
        {hasUserData && (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-emerald-900">{vocabularyData.learnedVocabulary}</span>
            <span className="text-sm text-emerald-700">words learned</span>
          </div>
        )}

        <div className="space-y-2 mb-4" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs text-white/70 font-medium uppercase mb-2">Recent Words</div>
          {hasUserData ? (
            <VocabularyProgress courseId={courseId} showProgress={true} limit={5} />
          ) : (
            <SampleVocabularyProgress showProgress={true} limit={5} />
          )}
        </div>
        
        <Button
          size="sm"
          className="w-full bg-white text-teal-600 hover:bg-white/90 font-medium shadow-lg"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/vocabulary-practice`)
          }}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
      </div>
    </div>
  )
}