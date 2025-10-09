export interface Test {
  id: string
  title: string
  description: string
  duration: number
  totalQuestions: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  thumbnail: string
  papers: {
    reading?: boolean
    writing?: boolean
    speaking?: boolean
    listening?: boolean
  }
}

export type ExamMode = 'test' | 'learn'
export type PaperType = 'reading' | 'writing' | 'speaking' | 'listening'

export interface Paper {
  id: string
  title: string
  duration: number
  totalQuestions: number
  sections: Section[]
}

export interface Section {
  id: string
  title: string
  instructions: string
  questions?: Question[]
  tasks?: Task[]
  audio_url?: string
  context?: any
  images?: string[]
}

export interface Question {
  question_number: number
  statement?: string
  question?: string
  correct_letter?: string
  correct_answer?: string
  options?: Record<string, string>
  marks?: number
  thinking?: string
  image_prompt?: string
  transcript?: string
}

export interface Task {
  task_number: number
  prompt: string
  example_response: string
  marks: number
}
