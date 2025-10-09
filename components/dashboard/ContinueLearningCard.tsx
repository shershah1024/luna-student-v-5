'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NextLearningData {}

interface ContinueLearningCardProps {
  courseId: string
  userId?: string
}

export default function ContinueLearningCard({ courseId, userId }: ContinueLearningCardProps) {
  const router = useRouter()
  const [learningData] = useState<NextLearningData | null>(null)
  const [loading] = useState(false)

  if (loading) {
    return (
      <div className="md:col-span-2 bg-gray-300 rounded-3xl p-6 animate-pulse">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 bg-gray-400 rounded"></div>
            <div>
              <div className="h-3 bg-gray-400 rounded w-20 mb-2"></div>
              <div className="h-4 bg-gray-400 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-400 rounded w-24"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-gray-400 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="md:col-span-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">      
      {!userId ? (
        <div className="text-center py-4">
          <div className="text-white font-semibold text-lg mb-2">Welcome!</div>
          <p className="text-white/80">Sign in to continue your learning journey</p>
        </div>
      ) : (
        <div className="flex items-center justify-between h-full">
          <div className="flex items-start gap-4 flex-1 pr-4">
            <BookOpen className="h-6 w-6 text-white mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white/90 uppercase tracking-wider mb-2">
                Continue Learning
              </div>
              <div className="text-lg font-semibold text-white mb-2 leading-tight">
                Open your assignments
              </div>
              <div className="text-sm text-white/80 leading-relaxed">Go to your dashboard to pick the next task.</div>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-white text-orange-600 hover:bg-white/90 font-medium px-6 py-3 text-sm rounded-xl shadow-sm"
          >
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  )
}
