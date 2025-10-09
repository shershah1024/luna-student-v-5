'use client'

import { useRouter } from 'next/navigation'
import { Book, PenLine, MessageSquare, Headphones, ArrowLeft } from 'lucide-react'
import { PaperType } from '@/types'
import { availableTests } from '@/data/tests'
import { papers } from '@/data/papers'
import { useExamStore } from '@/lib/store'

interface PaperSelectionProps {
  testId: string
}

export function PaperSelection({ testId }: PaperSelectionProps) {
  const { setSelectedTestId, setSelectedPaper } = useExamStore()
  const router = useRouter()
  
  const selectedTest = availableTests.find(test => test.id === testId)

  if (!selectedTest) {
    router.push('/dashboard')
    return null
  }

  const getPaperIcon = (type: PaperType) => {
    switch (type) {
      case 'reading':
        return <Book className="w-6 h-6" />
      case 'writing':
        return <PenLine className="w-6 h-6" />
      case 'speaking':
        return <MessageSquare className="w-6 h-6" />
      case 'listening':
        return <Headphones className="w-6 h-6" />
    }
  }

  const handlePaperSelection = (paperType: PaperType) => {
    setSelectedPaper(paperType)
    router.push(`/exams/${testId}/${paperType}`)
  }

  const handleBack = () => {
    setSelectedTestId(null)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedTest.title}</h1>
              <p className="text-gray-600 mt-1">{selectedTest.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(selectedTest.papers) as PaperType[]).map((paperType) => (
            selectedTest.papers[paperType] && (
              <button
                key={paperType}
                onClick={() => handlePaperSelection(paperType)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full mb-4">
                    {getPaperIcon(paperType)}
                  </div>
                  <h2 className="text-xl font-semibold mb-2 capitalize">{papers[paperType].title}</h2>
                  <div className="space-y-1 text-gray-600">
                    <p>{papers[paperType].duration} minutes</p>
                    <p>{papers[paperType].totalQuestions} questions</p>
                  </div>
                </div>
              </button>
            )
          ))}
        </div>
      </main>
    </div>
  )
}
