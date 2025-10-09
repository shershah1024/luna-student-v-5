import React from 'react'
import { Sparkles, ClipboardList, Send, BarChart3 } from 'lucide-react'

const steps = [
  {
    step: '1',
    title: 'Create',
    desc: 'Paste a text, link a video, or upload materials. Luna turns it into ready‑to‑use tasks.',
    icon: Sparkles,
  },
  {
    step: '2',
    title: 'Assign',
    desc: 'Share with a class or individual students. Works on any device.',
    icon: Send,
  },
  {
    step: '3',
    title: 'Measure',
    desc: 'Instant results and feedback. See who needs help and why.',
    icon: BarChart3,
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 border-y border-[#E8E4E1] bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2D3748] mb-3">How it works</h2>
          <p className="text-[#4A5568] text-lg">From content to outcomes in three simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="relative rounded-xl p-6 bg-[#FDFBF9] border border-[#E8E4E1] hover:shadow-sm">
              <div className="absolute -top-3 -left-3 h-10 w-10 rounded-lg bg-[#2D3748] text-white flex items-center justify-center font-semibold">
                {step}
              </div>
              <div className="flex items-center gap-3 mb-3 mt-2">
                <div className="p-2 rounded-lg bg-[#2D3748] text-white"><Icon className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold text-[#2D3748]">{title}</h3>
              </div>
              <p className="text-[#4A5568]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

