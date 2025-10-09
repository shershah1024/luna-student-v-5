'use client'

import { useExamStore } from '@/lib/store'
import { CheckCircle } from 'lucide-react'
import { useEvaluateAnswers } from '@/lib/hooks/useEvaluateAnswers'
import { useUser } from '@clerk/nextjs'

interface Props {
  sectionNumber: number
  onEvaluationResults?: (results: Record<number, boolean>) => void
}

export function SubmitSection({ sectionNumber, onEvaluationResults }: Props) {
  const { mode, showResults, setShowResults, examData } = useExamStore()
  const { evaluateSection3, evaluateSection4, evaluateSection6 } = useEvaluateAnswers()
  const { user } = useUser()

  if (mode === 'test') {
    return null
  }

  const handleSubmit = async () => {
    if (!examData?.id || !user?.emailAddresses?.[0]?.emailAddress) {
      return
    }

    const userEmail = user.emailAddresses[0].emailAddress

    switch (sectionNumber) {
      case 3:
        await evaluateSection3(examData.id, userEmail)
        break
      case 4:
        await evaluateSection4(examData.id, userEmail, onEvaluationResults || (() => {}))
        break
      case 6:
        await evaluateSection6(examData.id, userEmail, onEvaluationResults || (() => {}))
        break
      default:
        setShowResults(sectionNumber, true)
    }
  }

  return (
    <div className="mt-8">
      <button
        onClick={handleSubmit}
        disabled={showResults[sectionNumber - 1]}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium ${
          showResults[sectionNumber - 1]
            ? 'bg-green-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {showResults[sectionNumber - 1] ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Answers Submitted
          </>
        ) : (
          'Check Answers'
        )}
      </button>
    </div>
  )
}
