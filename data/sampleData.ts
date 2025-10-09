// Sample data for dashboard components when no user data exists
// This provides realistic preview data to show users what features are available

export interface SampleActivityData {
  weeklyTimeSpent: number
  todayTimeSpent: number
  monthlyTimeSpent: number
  allTimeSpent: number
  totalLessons: number
  completedLessons: number
  completedLessonsToday: number
  completedLessonsMonth: number
  totalVocabulary: number
  learnedVocabulary: number
  learnedVocabularyToday: number
  learnedVocabularyMonth: number
  streaks: {
    current: number
    longest: number
    active_today: boolean
  }
  exerciseTypesCompleted: string[]
  averageImprovement: number
  pronunciationScore: number | null
  grammarScore: number | null
  activeDaysLast30: number
}


export interface SampleLearningData {
  nextLesson: {
    lessonId: string
    chapterId: string
    chapterTitle: string
    exerciseId: string
    exerciseTitle: string
    exerciseType: string
    progressInLesson: number
    totalInLesson: number
  }
}

export interface SampleVocabularyData {
  totalVocabulary: number
  learnedVocabulary: number
}

export interface SampleTutorRecommendation {
  hasRecommendation: boolean
  recommendation: string
  priority_level: string
  week_start_date: string
}

// Activity Card Sample Data
export const sampleActivityData: SampleActivityData = {
  weeklyTimeSpent: 0,
  todayTimeSpent: 0,
  monthlyTimeSpent: 0,
  allTimeSpent: 0,
  totalLessons: 45,
  completedLessons: 0,
  completedLessonsToday: 0,
  completedLessonsMonth: 0,
  totalVocabulary: 800,
  learnedVocabulary: 0,
  learnedVocabularyToday: 0,
  learnedVocabularyMonth: 0,
  streaks: {
    current: 0,
    longest: 0,
    active_today: false
  },
  exerciseTypesCompleted: [],
  averageImprovement: 0,
  pronunciationScore: null,
  grammarScore: null,
  activeDaysLast30: 0
}


// Continue Learning Card Sample Data
export const sampleLearningData: SampleLearningData = {
  nextLesson: {
    lessonId: 'chapter-1-lesson-1',
    chapterId: 'chapter-1',
    chapterTitle: 'Getting Started - Personal Information',
    exerciseId: 'intro-vocabulary',
    exerciseTitle: 'Basic Greetings and Introductions',
    exerciseType: 'vocabulary_practice',
    progressInLesson: 0,
    totalInLesson: 8
  }
}

// Vocabulary Card Sample Data
export const sampleVocabularyData: SampleVocabularyData = {
  totalVocabulary: 800,
  learnedVocabulary: 0
}

// AI Tutor Sample Data
export const sampleTutorRecommendation: SampleTutorRecommendation = {
  hasRecommendation: true,
  recommendation: "Welcome to Goethe A1! Start with Chapter 1 to learn basic greetings and personal information. Focus on building your foundation with simple vocabulary and common phrases used in everyday situations.",
  priority_level: "high",
  week_start_date: new Date().toISOString()
}

// Sample vocabulary words for progress components
export const sampleVocabularyWords = [
  { word: "Hallo", definition: "Hello", learning_status: "1", difficulty: "easy" },
  { word: "Danke", definition: "Thank you", learning_status: "1", difficulty: "easy" },
  { word: "Bitte", definition: "Please/You're welcome", learning_status: "1", difficulty: "easy" },
  { word: "Entschuldigung", definition: "Excuse me/Sorry", learning_status: "1", difficulty: "medium" },
  { word: "Sprechen", definition: "To speak", learning_status: "1", difficulty: "medium" }
]

// Sample pronunciation data
export const samplePronunciationData = [
  { word: "Hallo", phonetic: "ˈhalo", audio_url: null, attempts: 0, best_score: null },
  { word: "Guten Tag", phonetic: "ˈɡuːtən taːk", audio_url: null, attempts: 0, best_score: null },
  { word: "Auf Wiedersehen", phonetic: "aʊf ˈviːdɐˌzeːən", audio_url: null, attempts: 0, best_score: null },
  { word: "Sprechen", phonetic: "ˈʃprɛçən", audio_url: null, attempts: 0, best_score: null },
  { word: "Verstehen", phonetic: "fɛɐˈʃteːən", audio_url: null, attempts: 0, best_score: null }
]

// Sample grammar errors data
export const sampleGrammarErrors = [
  { 
    error_text: "Ich bin ein Student", 
    correction: "Ich bin Student", 
    explanation: "In German, you don't use the indefinite article 'ein/eine' with professions after 'sein'",
    grammar_point: "Articles with professions",
    difficulty: "beginner"
  },
  { 
    error_text: "Ich gehe zu der Schule", 
    correction: "Ich gehe zur Schule", 
    explanation: "Use the contraction 'zur' instead of 'zu der'",
    grammar_point: "Preposition contractions",
    difficulty: "beginner"
  },
  { 
    error_text: "Das Auto von meinem Vater", 
    correction: "Das Auto meines Vaters", 
    explanation: "Use the genitive case instead of 'von' for possession",
    grammar_point: "Genitive case",
    difficulty: "intermediate"
  }
]

// Sample test scores data for the TestScoresCard component
export const sampleTestScoresData = {
  totalTestsSections: 12,
  completedSections: 8,
  averageScore: 75,
  recentTests: [
    {
      testId: 'goethe_a1_reading_1',
      testName: 'Reading Section 1',
      score: 85,
      maxScore: 100,
      completedAt: new Date().toISOString()
    },
    {
      testId: 'goethe_a1_listening_1',
      testName: 'Listening Section 1',
      score: 72,
      maxScore: 100,
      completedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  nextTest: {
    examId: 'goethe_a1',
    examName: 'Goethe A1 Exam',
    testType: 'reading' as const,
    testId: 'goethe_a1_reading_2'
  },
  recommendations: [
    'Practice more listening exercises to improve comprehension',
    'Review grammar rules for better reading scores'
  ]
}