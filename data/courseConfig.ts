export interface CourseConfig {
  id: string
  title: string
  subtitle: string
  level: string
  organization: 'Goethe'
  description: string[]
  estimatedHours: number
  examStructure: {
    duration: string
    passingScore: string
    sections: string
  }
  lessons: {
    description: string
    topics: string[]
    features: string[]
  }
}

export const courseConfigs: Record<string, CourseConfig> = {
  'goethe-a1': {
    id: 'goethe-a1',
    title: 'Goethe-Zertifikat A1',
    subtitle: 'Start Deutsch 1 - Beginner Level German',
    level: 'A1',
    organization: 'Goethe',
    estimatedHours: 80,
    description: [
      'The Goethe-Zertifikat A1: Start Deutsch 1 is a German language exam that certifies that candidates have acquired very basic language skills and corresponds to the first level (A1) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).',
      'This examination is suitable for adults and young people, and focuses on everyday language, covering basic communication in familiar situations.'
    ],
    examStructure: {
      duration: 'Total Duration: 80 minutes',
      passingScore: 'Passing Score: 60/100 points',
      sections: '4 Sections: Listening (20 min), Reading (25 min), Writing (20 min), Speaking (15 min)'
    },
    lessons: {
      description: 'Interactive lessons covering all A1 topics including grammar, vocabulary, and practical conversations for everyday situations.',
      topics: ['Basic Greetings', 'Numbers & Time', 'Family & Friends'],
      features: ['Daily Activities', 'Shopping', 'Directions']
    },
  },
  'goethe-a2': {
    id: 'goethe-a2',
    title: 'Goethe-Zertifikat A2',
    subtitle: 'Elementary Level German Certificate',
    level: 'A2',
    organization: 'Goethe',
    estimatedHours: 120,
    description: [
      'The Goethe-Zertifikat A2 is a German exam for adults that certifies elementary language skills and corresponds to the second level (A2) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).',
      'This examination shows that you can communicate in simple, routine tasks requiring a simple and direct exchange of information on familiar topics and activities.'
    ],
    examStructure: {
      duration: 'Total Duration: 105 minutes',
      passingScore: 'Passing Score: 60/100 points',
      sections: '4 Modules: Reading (30 min), Listening (30 min), Writing (30 min), Speaking (15 min)'
    },
    lessons: {
      description: 'Build on basic German skills with lessons covering everyday situations, past experiences, and future plans.',
      topics: ['Daily Routines', 'Past Experiences', 'Future Plans'],
      features: ['Work & School', 'Health & Body', 'Travel & Transport']
    },
  },
  'goethe-b1': {
    id: 'goethe-b1',
    title: 'Goethe-Zertifikat B1',
    subtitle: 'Intermediate German Language Certificate',
    level: 'B1',
    organization: 'Goethe',
    estimatedHours: 160,
    description: [
      'The Goethe-Zertifikat B1 is a German exam for young people and adults that certifies intermediate German language skills according to the third level (B1) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).',
      'This certificate demonstrates that you can understand the main points of clear standard input on familiar matters and can deal with most situations likely to arise while traveling in German-speaking areas.'
    ],
    examStructure: {
      duration: 'Total Duration: 180 minutes',
      passingScore: 'Passing Score: 60% per module',
      sections: '4 Modules: Reading (65 min), Listening (40 min), Writing (60 min), Speaking (15 min)'
    },
    lessons: {
      description: 'Develop intermediate German skills with complex topics covering work, education, culture, and abstract concepts.',
      topics: ['Work & Career', 'Education System', 'Culture & Society'],
      features: ['Complex Grammar', 'Opinion Expression', 'Formal Communication']
    },
  },
  'goethe-b2': {
    id: 'goethe-b2',
    title: 'Goethe-Zertifikat B2',
    subtitle: 'Upper-Intermediate German Certificate',
    level: 'B2',
    organization: 'Goethe',
    estimatedHours: 200,
    description: [
      'The Goethe-Zertifikat B2 is a German exam for young people and adults that certifies advanced language skills and corresponds to the fourth level (B2) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).',
      'This qualification shows that you can understand the main ideas of complex texts on both concrete and abstract topics and can interact with a degree of fluency and spontaneity.'
    ],
    examStructure: {
      duration: 'Total Duration: 190 minutes',
      passingScore: 'Passing Score: 60% per module',
      sections: '4 Modules: Reading, Listening, Writing, Speaking'
    },
    lessons: {
      description: 'Master advanced German with sophisticated grammar, professional vocabulary, and complex communication strategies.',
      topics: ['Professional German', 'Abstract Concepts', 'Current Affairs'],
      features: ['Advanced Grammar', 'Academic Writing', 'Critical Thinking']
    },
  },
  'goethe-c1': {
    id: 'goethe-c1',
    title: 'Goethe-Zertifikat C1',
    subtitle: 'Advanced German Language Certification',
    level: 'C1',
    organization: 'Goethe',
    estimatedHours: 250,
    description: [
      'The Goethe-Zertifikat C1 is a German language exam for adults that certifies very advanced language skills and corresponds to the fifth level (C1) on the six-level scale of competence laid down in the Common European Framework of Reference for Languages (CEFR).',
      'This qualification is recognized worldwide as proof of advanced German language competence and is suitable for anyone who wants to study at or work in German universities and professional environments.'
    ],
    examStructure: {
      duration: 'Total Duration: 200 minutes',
      passingScore: 'Passing Score: 60% per module',
      sections: '4 Modules: Reading (65 min), Listening (40 min), Writing (75 min), Speaking (20 min)'
    },
    lessons: {
      description: 'Master complex grammatical structures, academic vocabulary, and sophisticated communication strategies for professional and academic contexts.',
      topics: ['Academic Writing', 'Complex Grammar', 'Abstract Topics'],
      features: ['Idiomatic Language', 'Critical Analysis', 'Fluent Expression']
    },
  }
}