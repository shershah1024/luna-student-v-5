import React from 'react'
import { GraduationCap, Users, Building2, PencilLine, Mic, Headphones, BookOpen } from 'lucide-react'

const useCases = [
  {
    icon: GraduationCap,
    title: 'Individual Teachers',
    points: [
      'Prep full lessons in minutes',
      'Auto‑grade writing and speaking',
      'Personalize tasks per student',
    ],
  },
  {
    icon: Users,
    title: 'Tutoring Centers',
    points: [
      'Standardize quality across tutors',
      'Assign practice at scale',
      'Track outcomes across cohorts',
    ],
  },
  {
    icon: Building2,
    title: 'Departments & Schools',
    points: [
      'Curriculum‑aligned banks of tasks',
      'Shared rubrics and feedback',
      'Insights for program improvement',
    ],
  },
]

export default function UseCasesSection() {
  return (
    <section className="py-20 bg-[#FDFBF9]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-3">Built for every setting</h2>
          <p className="text-[#4A5568] text-lg">From classrooms to institutions — Luna scales with you</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {useCases.map(({ icon: Icon, title, points }) => (
            <div key={title} className="rounded-xl border border-[#E8E4E1] bg-white p-6 hover:shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#2D3748] text-white"><Icon className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold text-[#2D3748]">{title}</h3>
              </div>
              <ul className="space-y-2 text-[#4A5568]">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

