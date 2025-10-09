'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { PaperType, ExamMode } from '@/types'
import { ReadingPaper } from '@/lib/examService'

interface Answer {
  questionNumber: number
  selectedAnswer?: string
  writtenAnswer?: string
}

interface ExamStoreState {
  selectedTestId: string | null
  setSelectedTestId: (id: string | null) => void
  selectedPaper: PaperType | null
  setSelectedPaper: (paper: PaperType | null) => void
  answers: Answer[]
  setAnswer: (answer: Answer) => void
  currentSection: number
  setCurrentSection: (section: number) => void
  mode: ExamMode | null
  setMode: (mode: ExamMode) => void
  showResults: boolean[]
  setShowResults: (sectionIndex: number, show: boolean) => void
  resetExam: () => void
  examData: ReadingPaper | null
  setExamData: (data: ReadingPaper | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

const ExamStoreContext = createContext<ExamStoreState | null>(null)

export function ExamStoreProvider({ children }: { children: ReactNode }) {
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<PaperType | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentSection, setCurrentSection] = useState(1)
  const [mode, setMode] = useState<ExamMode | null>(null)
  const [showResults, setShowResultsArray] = useState<boolean[]>(Array(6).fill(false))
  const [examData, setExamData] = useState<ReadingPaper | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAnswer = (answer: Answer) => {
    setAnswers(prev => [
      ...prev.filter(a => a.questionNumber !== answer.questionNumber),
      answer
    ])
  }

  const setShowResults = (sectionIndex: number, show: boolean) => {
    setShowResultsArray(prev => 
      prev.map((value, index) => index === sectionIndex - 1 ? show : value)
    )
  }

  const resetExam = () => {
    setSelectedTestId(null)
    setSelectedPaper(null)
    setCurrentSection(1)
    setAnswers([])
    setShowResultsArray(Array(6).fill(false))
    setExamData(null)
    setError(null)
    setMode(null)
  }

  return (
    <ExamStoreContext.Provider
      value={{
        selectedTestId,
        setSelectedTestId: (id) => {
          setSelectedTestId(id)
          if (id !== selectedTestId) {
            setSelectedPaper(null)
            setCurrentSection(1)
          }
        },
        selectedPaper,
        setSelectedPaper: (paper) => {
          setSelectedPaper(paper)
          setCurrentSection(1)
        },
        answers,
        setAnswer,
        currentSection,
        setCurrentSection,
        mode,
        setMode,
        showResults,
        setShowResults,
        resetExam,
        examData,
        setExamData,
        loading,
        setLoading,
        error,
        setError
      }}
    >
      {children}
    </ExamStoreContext.Provider>
  )
}

export function useExamStore() {
  const context = useContext(ExamStoreContext)
  if (!context) {
    throw new Error('useExamStore must be used within ExamStoreProvider')
  }
  return context
}
