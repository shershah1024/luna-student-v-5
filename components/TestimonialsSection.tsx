import React from 'react'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Ana Rodrigues',
    role: 'German Teacher, Secondary School',
    quote: 'I reclaimed 6 hours a week. My students get instant, meaningful feedback and come to class prepared.',
  },
  {
    name: 'David Lee',
    role: 'Head of Languages, College',
    quote: 'We standardized assessment across levels without losing personalization. Adoption by staff was instant.',
  },
  {
    name: 'Sofia Marin',
    role: 'Private Tutor',
    quote: 'Writing and speaking practice finally scale. I onboard new learners with confidence and zero admin.',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-3">Loved by language educators</h2>
          <p className="text-[#4A5568] text-lg">4.9/5 average rating across 200+ reviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-[#E8E4E1] bg-[#FDFBF9] p-6 hover:bg-[#F7F4F1] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                <div>
                  <p className="font-semibold text-[#2D3748]">{t.name}</p>
                  <p className="text-sm text-[#6B7280]">{t.role}</p>
                </div>
              </div>
              <p className="text-[#374151] mb-4">“{t.quote}”</p>
              <div className="flex gap-1 text-yellow-500" aria-label="5 star rating">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

