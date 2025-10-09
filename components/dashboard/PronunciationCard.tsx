'use client'

import { Volume2, Eye } from 'lucide-react'
import PronunciationProgress from '@/components/dashboard/PronunciationProgress'
import SamplePronunciationProgress from '@/components/dashboard/SamplePronunciationProgress'

interface PronunciationCardProps {
  courseId: string
  onPronunciationModalOpen: () => void
  hasUserData?: boolean
}

export default function PronunciationCard({ courseId, onPronunciationModalOpen, hasUserData = false }: PronunciationCardProps) {
  return (
    <div 
      className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onClick={onPronunciationModalOpen}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-white" />
          <div className="text-xs font-medium text-white uppercase tracking-wider">Pronunciation Practice</div>
        </div>
        <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {!hasUserData && (
        <div className="mb-3 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
          <div className="text-white font-semibold text-sm mb-1">
            No Data Yet
          </div>
          <div className="text-white/90 text-xs">
            🎤 Practice speaking to see your progress!
          </div>
        </div>
      )}
      
      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-xs text-white/70 font-medium uppercase mb-2">Recent Practice</div>
        {hasUserData ? (
          <PronunciationProgress courseId={courseId} showAudio={true} limit={5} />
        ) : (
          <SamplePronunciationProgress showAudio={true} limit={5} />
        )}
      </div>
    </div>
  )
}