import React from 'react'
import { Gauge, CheckCircle2, BarChart3, Sparkles } from 'lucide-react'

const outcomes = [
  {
    icon: Gauge,
    stat: '80% faster',
    title: 'Prep time slashed',
    desc: 'Generate reading, listening, writing, and speaking tasks in minutes.'
  },
  {
    icon: CheckCircle2,
    stat: '1‑click',
    title: 'Assess & feedback',
    desc: 'Automatic grading with rubrics and personalized comments.'
  },
  {
    icon: BarChart3,
    stat: 'Real‑time',
    title: 'Progress insights',
    desc: 'Track proficiency growth and identify who needs support.'
  },
  {
    icon: Sparkles,
    stat: 'Adaptive',
    title: 'Personalized practice',
    desc: 'Differentiate automatically across levels and skills.'
  },
]

export default function OutcomesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-2">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-4">
              Outcomes that matter
            </h2>
            <p className="text-[#4A5568] text-lg">
              Luna lets you ship brilliant classes without the grind. Create once, assign everywhere,
              and keep every learner moving.
            </p>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {outcomes.map(({ icon: Icon, stat, title, desc }) => (
              <div key={title} className="rounded-xl border border-[#E8E4E1] p-6 bg-[#FDFBF9] hover:bg-[#F7F4F1] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#2D3748] text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#2D3748]">{title}</h3>
                  </div>
                  <span className="text-[#065F46] text-sm font-semibold">{stat}</span>
                </div>
                <p className="text-[#4A5568] text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

