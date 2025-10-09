'use client'

import { Volume2, Play } from 'lucide-react'
import { samplePronunciationData } from '@/data/sampleData'

interface SamplePronunciationProgressProps {
  showAudio?: boolean
  limit?: number
}

export default function SamplePronunciationProgress({ showAudio = false, limit = 5 }: SamplePronunciationProgressProps) {
  const pronunciationWords = samplePronunciationData.slice(0, limit)

  if (pronunciationWords.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-white/70 text-sm">
          No pronunciation practice yet
        </div>
        <div className="text-white/50 text-xs mt-1">
          Start practicing to see your progress!
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pronunciationWords.map((word, index) => (
        <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <div className="flex-1">
            <div className="font-medium text-white text-sm">{word.word}</div>
            <div className="text-white/70 text-xs font-mono">[{word.phonetic}]</div>
          </div>
          {showAudio && (
            <div className="ml-3 flex items-center gap-2">
              <button className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <Volume2 className="h-3 w-3 text-white" />
              </button>
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-white/70 text-xs">Not practiced</span>
            </div>
          )}
        </div>
      ))}
      <div className="text-center pt-2">
        <div className="text-white/60 text-xs">
          Sample pronunciation - Practice speaking to see your scores!
        </div>
      </div>
    </div>
  )
}