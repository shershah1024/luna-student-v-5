import React from 'react'
import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="py-20 bg-[#FDFBF9]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden border border-[#E8E4E1]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-500/10" />
          <div className="relative px-8 md:px-14 py-14 bg-white/70 backdrop-blur">
            <h3 className="text-3xl md:text-4xl font-semibold text-[#111827] mb-3">
              Teach brilliantly. Save hours.
            </h3>
            <p className="text-[#4A5568] text-lg mb-8">
              Join thousands of teachers using Luna to craft engaging language classes that scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#2D3748] text-white font-medium hover:bg-[#1F2937]"
              >
                Get started free
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[#2D3748] text-[#2D3748] font-medium hover:bg-[#EFEAE6]"
              >
                Watch 90‑second demo
              </Link>
            </div>
            <p className="text-xs text-[#6B7280] mt-4">No credit card required • Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  )
}

