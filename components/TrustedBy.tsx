import React from 'react'

const logos = [
  'Goethe‑Institut',
  'LanguageHub',
  'EduWorks',
  'Polyglot Labs',
  'CampusX',
  'GlobalLingua',
]

export default function TrustedBy() {
  return (
    <section className="py-16 border-t border-[#E8E4E1] bg-[#FDFBF9]">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-medium text-[#6B7280] mb-8">
          Trusted by educators and institutions worldwide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
          {logos.map((name) => (
            <div
              key={name}
              className="h-12 flex items-center justify-center rounded-lg bg-white border border-[#E8E4E1] text-[#6B7280] font-semibold tracking-wide hover:bg-[#F7F4F1] transition-colors"
              aria-label={name}
            >
              <span className="opacity-70">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

