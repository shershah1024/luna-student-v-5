import React from 'react'
import { Clock, FileText, Brain, Users } from 'lucide-react'

export default function PainPointsSection() {
  const items = [
    {
      icon: Clock,
      title: 'Prep takes too long',
      before: 'Manually building materials for each class',
      after: 'Create quality lessons in minutes with AI',
    },
    {
      icon: FileText,
      title: 'Assessment is tedious',
      before: 'Hours grading and writing feedback',
      after: 'Auto‑assess, rubric‑based feedback in one click',
    },
    {
      icon: Brain,
      title: 'One pace for all',
      before: 'Mixed proficiency, fixed worksheets',
      after: 'Adaptive tasks for each learner’s level',
    },
    {
      icon: Users,
      title: 'Limited individual time',
      before: 'Hard to support each student well',
      after: 'AI co‑tutor that gives patient guidance 24/7',
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-3">
            The teaching grind, solved
          </h2>
          <p className="text-[#4A5568] text-lg">Designed for how language classes actually run in 2025</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(({ icon: Icon, title, before, after }) => (
            <div key={title} className="rounded-xl border border-[#E8E4E1] bg-[#FDFBF9] p-6 hover:shadow-sm hover:bg-[#F7F4F1] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#2D3748] text-white">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#2D3748]">{title}</h3>
              </div>
              <div className="text-sm">
                <p className="text-[#6B7280] mb-2"><span className="font-semibold text-[#374151]">Before:</span> {before}</p>
                <p className="text-[#065F46]"><span className="font-semibold text-[#065F46]">After:</span> {after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

