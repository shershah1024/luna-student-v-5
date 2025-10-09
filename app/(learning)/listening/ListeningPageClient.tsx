'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Home, BookOpen, ClipboardCheck, ChevronRight } from 'lucide-react'

export default function ListeningPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get('test_id')
  const [selectedMode, setSelectedMode] = useState<'learn' | 'test' | null>(null)
  
  // Store testId in localStorage when available
  useEffect(() => {
    if (testId) {
      localStorage.setItem('listeningTestId', testId)
    }
  }, [testId])
  
  const handleBack = () => {
    router.push('/dashboard')
  }
  
  const handleStartExercise = () => {
    if (!selectedMode || !testId) return
    
    // Store the selected mode in localStorage
    localStorage.setItem('listeningMode', selectedMode)
    router.push(`/listening/section/1?test_id=${testId}&mode=${selectedMode}`)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Go to home"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/listening/tests')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <span>View All Tests</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xl font-bold">
              German Listening Exercise
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!testId ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No listening test ID provided. Please select a listening test first.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Choose Mode</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedMode('learn')}
                  className={`px-6 py-3 rounded-lg font-medium ${selectedMode === 'learn' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'} transition-colors`}
                >
                  Learn Mode
                </button>
                <button
                  onClick={() => setSelectedMode('test')}
                  className={`px-6 py-3 rounded-lg font-medium ${selectedMode === 'test' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'} transition-colors`}
                >
                  Test Mode
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-2">Mode Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-lg border p-4 ${selectedMode === 'learn' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                  <h4 className="font-bold mb-2 text-green-700">Learn Mode</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-800">
                    <li>See feedback immediately after each question</li>
                    <li>Unlimited attempts</li>
                    <li>Hints and explanations available</li>
                  </ul>
                </div>
                <div className={`rounded-lg border p-4 ${selectedMode === 'test' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'}`}>
                  <h4 className="font-bold mb-2 text-amber-700">Test Mode</h4>
                  <ul className="list-disc pl-5 space-y-1 text-amber-800">
                    <li>Results shown only after submission</li>
                    <li>Authentic exam conditions</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleStartExercise}
                  disabled={!selectedMode}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${selectedMode ? (selectedMode === 'learn' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-600 text-white hover:bg-amber-700') : 'bg-gray-200 text-gray-500 cursor-not-allowed'} transition-colors`}
                >
                  Start Exercise
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
