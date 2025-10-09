"use client"

import React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const faqs = [
  {
    q: 'Is Luna only for German or TELC?',
    a: 'Luna is built for language teaching generally (German, Spanish, French, and more). The platform supports reading, listening, speaking and writing workflows beyond exam prep.',
  },
  {
    q: 'How does grading work?',
    a: 'You can use built‑in rubrics or your own. Luna generates rubric‑aligned feedback and suggested grades that you can accept or edit before publishing.',
  },
  {
    q: 'Will my materials remain private?',
    a: 'Yes. Your content is stored securely and not used to train models. You control sharing at the class or organization level.',
  },
  {
    q: 'Do students need an account?',
    a: 'Students can join via class link or invite. SSO/LMS integrations are being rolled out to minimize onboarding friction.',
  },
]

export default function FAQSection() {
  return (
    <section className="py-20 bg-white border-t border-[#E8E4E1]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-3">Frequently asked</h2>
          <p className="text-[#4A5568] text-lg">Quick answers for busy teachers</p>
        </div>
        <div className="space-y-4">
          {faqs.map((item, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="w-full text-left">
                <div className="w-full rounded-xl border border-[#E8E4E1] bg-[#FDFBF9] p-5 hover:bg-[#F7F4F1] transition-colors">
                  <p className="font-semibold text-[#2D3748]">{item.q}</p>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-5 py-4 text-[#4A5568] border-x border-b border-[#E8E4E1] rounded-b-xl bg-white">
                  {item.a}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  )
}

