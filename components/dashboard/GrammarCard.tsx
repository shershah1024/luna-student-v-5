'use client'

import { Brain, Eye } from 'lucide-react'
import GrammarCategoriesProgress from '@/components/dashboard/GrammarCategoriesProgress'
import SampleGrammarProgress from '@/components/dashboard/SampleGrammarProgress'

interface GrammarCardProps {
  courseId: string
  userId?: string
}

export default function GrammarCard({ courseId, userId }: GrammarCardProps) {
  const hasUserData = !!userId;

  return (
    <div className="bg-gradient-to-br from-sky-400 to-cyan-500 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-white" />
          <div className="text-xs font-medium text-white uppercase tracking-wider">Grammar Categories</div>
        </div>
        <Eye className="h-4 w-4 text-white opacity-70" />
      </div>
      
      {!hasUserData && (
        <div className="mb-3 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
          <div className="text-white font-semibold text-sm mb-1">
            No Data Yet
          </div>
          <div className="text-white/90 text-xs">
            ✍️ Practice writing to get grammar feedback!
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="text-xs text-white/70 font-medium uppercase mb-2">
          {hasUserData ? 'Top Error Categories' : 'Sample Categories'}
        </div>
        {hasUserData ? (
          <GrammarCategoriesProgress courseId={courseId} showErrors={true} limit={4} />
        ) : (
          <SampleGrammarProgress showErrors={true} limit={4} />
        )}
      </div>
    </div>
  )
}