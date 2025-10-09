'use client'

import { AlertCircle } from 'lucide-react'

interface SampleGrammarProgressProps {
  showErrors?: boolean
  limit?: number
}

// Sample grammar categories with counts for preview
const sampleCategories = [
  { name: 'ARTICLES', displayName: 'Articles', count: 8, highSeverity: 3 },
  { name: 'VERB_CONJUGATION', displayName: 'Verb Conjugation', count: 6, highSeverity: 2 },
  { name: 'WORD_ORDER', displayName: 'Word Order', count: 5, highSeverity: 1 },
  { name: 'PREPOSITIONS', displayName: 'Prepositions', count: 4, highSeverity: 1 },
  { name: 'PLURAL_FORMS', displayName: 'Plural Forms', count: 3, highSeverity: 0 },
  { name: 'CAPITALIZATION', displayName: 'Capitalization', count: 2, highSeverity: 0 },
]

const getCategoryColor = (category: string) => {
  const colors = {
    'ARTICLES': 'text-red-400 bg-red-400/10 border-red-400/20',
    'VERB_CONJUGATION': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'WORD_ORDER': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'PREPOSITIONS': 'text-green-400 bg-green-400/10 border-green-400/20',
    'PLURAL_FORMS': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'CAPITALIZATION': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  };
  return colors[category as keyof typeof colors] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
};

export default function SampleGrammarProgress({ showErrors = false, limit = 4 }: SampleGrammarProgressProps) {
  const categories = sampleCategories.slice(0, limit)

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div 
          key={category.name} 
          className={`flex items-center justify-between p-3 rounded-lg border ${getCategoryColor(category.name)}`}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
              <AlertCircle className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block">{category.displayName}</span>
              <div className="flex items-center gap-2 text-xs opacity-75">
                <span>{category.count} errors</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-red-400/20 text-red-300">
                  {category.highSeverity} high
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="text-center pt-2">
        <div className="text-white/60 text-xs">
          Sample categories - Practice writing to get personalized feedback!
        </div>
      </div>
    </div>
  )
}