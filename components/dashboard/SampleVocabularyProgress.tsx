'use client'

import { sampleVocabularyWords } from '@/data/sampleData'

interface SampleVocabularyProgressProps {
  showProgress?: boolean
  limit?: number
}

export default function SampleVocabularyProgress({ showProgress = false, limit = 10 }: SampleVocabularyProgressProps) {
  const words = sampleVocabularyWords.slice(0, limit)

  if (words.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-white/70 text-sm">
          No vocabulary words available yet
        </div>
        <div className="text-white/50 text-xs mt-1">
          Start with Chapter 1 to begin learning!
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
          <div className="flex-1">
            <div className="font-medium text-white text-sm">{word.word}</div>
            <div className="text-white/70 text-xs">{word.definition}</div>
          </div>
          {showProgress && (
            <div className="ml-3 flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-white/70 text-xs ml-2">Learning</span>
            </div>
          )}
        </div>
      ))}
      <div className="text-center pt-2">
        <div className="text-white/60 text-xs">
          Sample vocabulary - Start learning to see your progress!
        </div>
      </div>
    </div>
  )
}