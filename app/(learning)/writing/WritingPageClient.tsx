'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Home, BookOpen, ClipboardCheck, ChevronRight, ArrowRight } from 'lucide-react'

export default function WritingPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get('test_id')
  const mode = searchParams.get('mode')
  const [selectedMode, setSelectedMode] = useState<'learn' | 'test' | null>(mode as 'learn' | 'test' | null)
  const [showSections, setShowSections] = useState<boolean>(!!mode)
  
  // Store testId in localStorage when available
  useEffect(() => {
    if (testId) {
      localStorage.setItem('writing_test_id', testId)
    }
  }, [testId])
  
  const handleBack = () => {
    router.push('/dashboard')
  }
  
  const handleContinue = () => {
    if (!selectedMode || !testId) return
    
    // Store the selected mode in localStorage
    localStorage.setItem('writing_mode', selectedMode)
    // Navigate directly to section1
    router.push(`/writing/section1?test_id=${testId}&mode=${selectedMode}`)
  }

  const handleStartSection = (section: number) => {
    if (!selectedMode || !testId) return
    // Navigate to the selected section with the selected mode
    router.push(`/writing/section${section}?test_id=${testId}&mode=${selectedMode}`)
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
                onClick={() => router.push('/writing/tests')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <span>View All Tests</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xl font-bold">
              German Writing Exercise
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
                  No writing test ID provided. Please select a writing test first.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {!showSections ? (
              /* Mode Selection Only */
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Mode</h2>
                  <p className="text-gray-600">Select how you want to practice your writing skills</p>
                </div>
                <div className="p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Learn Mode Card */}
                    <div 
                      className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${selectedMode === 'learn' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setSelectedMode('learn')}
                    >
                      <div className="flex items-start mb-4">
                        <div className="bg-green-100 p-3 rounded-full mr-4">
                          <BookOpen className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Learn Mode</h3>
                          <p className="text-gray-500 mt-1">Practice at your own pace with full support</p>
                        </div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600 ml-14">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>Access to explanations and feedback</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>Immediate feedback on your writing</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>Suggestions for improvement</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>No time limits</span>
                        </li>
                      </ul>
                    </div>
                    {/* Test Mode Card */}
                    <div 
                      className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${selectedMode === 'test' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setSelectedMode('test')}
                    >
                      <div className="flex items-start mb-4">
                        <div className="bg-amber-100 p-3 rounded-full mr-4">
                          <ClipboardCheck className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Test Mode</h3>
                          <p className="text-gray-500 mt-1">Simulate a real exam experience</p>
                        </div>
                      </div>
                      <ul className="space-y-2 text-sm text-gray-600 ml-14">
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-2">✓</span>
                          <span>No hints or explanations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-2">✓</span>
                          <span>Results shown only after submission</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-2">✓</span>
                          <span>Timed environment (optional)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-amber-500 mr-2">✓</span>
                          <span>Authentic exam conditions</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleContinue}
                      disabled={!selectedMode}
                      className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium ${selectedMode ? (selectedMode === 'learn' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-600 text-white hover:bg-amber-700') : 'bg-gray-200 text-gray-500 cursor-not-allowed'} transition-colors`}
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Section Selection */
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose a Section</h2>
                  <p className="text-gray-600">Select which writing section you want to practice</p>
                </div>
                <div className="p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Section 1 Card */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900">Section 1: Form Completion</h3>
                        <p className="text-gray-500 mt-1">Fill in missing information in forms</p>
                      </div>
                      <div className="p-6 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-4">
                          In this section, you'll practice filling out forms with the correct information based on a given context.
                        </p>
                        <div className="flex flex-col space-y-3">
                          <button
                            onClick={() => handleStartSection(1)}
                            className={`w-full py-2 rounded-md font-medium ${selectedMode === 'learn' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-600 text-white hover:bg-amber-700'} transition-colors`}
                          >
                            Start Section 1
                          </button>
                          <button
                            onClick={() => handleStartSection(2)}
                            className="w-full py-2 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                          >
                            Go to Section 2 <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Section 2 Card */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900">Section 2: Short Message</h3>
                        <p className="text-gray-500 mt-1">Write a short message or letter</p>
                      </div>
                      <div className="p-6 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-4">
                          In this section, you'll practice writing short messages or letters in German based on a given scenario.
                        </p>
                        <button
                          onClick={() => handleStartSection(2)}
                          className={`w-full py-2 rounded-md font-medium ${selectedMode === 'learn' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-600 text-white hover:bg-amber-700'} transition-colors`}
                        >
                          Start Section 2
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

