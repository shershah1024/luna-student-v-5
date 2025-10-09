'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookCheck,
  ChevronRight,
  Globe,
  GraduationCap,
  Sparkles,
} from 'lucide-react'

const teachingFeatures = [
  'Lesson Planning', 'Assignment Creation', 'Student Assessment', 'Progress Tracking', 
  'Vocabulary Lists', 'Grammar Exercises', 'Speaking Activities', 'Writing Prompts',
  'Listening Materials', 'Custom Worksheets', 'Quiz Generator', 'Grading Assistant'
];

const buttonColorClasses = [
  'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
  'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700',
  'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
  'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600',
  'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700',
  'bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-600 hover:to-emerald-700',
  'bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700',
  'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700',
];

export function HeroSection() {
  const featuresToShow = teachingFeatures.slice(0, 8);

  return (
    <div className="relative flex items-center justify-center overflow-hidden py-20 lg:py-28">
      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight">
            <span className="block">Empower Your</span>
            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">
              Language Teaching With AI
            </span>
          </h1>

          {/* Teaching Features Section */}
          <div className="flex flex-col items-center mt-10 md:mt-12">
            <div className="flex flex-wrap gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 justify-center max-w-3xl lg:max-w-4xl">
              {featuresToShow.map((feature, index) => (
                <Link
                  key={feature}
                  href="/teachers/dashboard"
                  className={`px-5 py-3 sm:px-6 rounded-lg text-white font-semibold text-sm sm:text-base transition-all transform hover:scale-105 shadow-lg min-w-[160px] sm:min-w-[170px] text-center flex items-center justify-center ${buttonColorClasses[index % buttonColorClasses.length]}`}
                >
                  {feature}
                  <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 text-white opacity-90" />
                </Link>
              ))}
            </div>

            {teachingFeatures.length > 8 && (
              <Link
                href="/teachers/dashboard"
                className="mt-6 sm:mt-8 px-8 py-3 rounded-lg bg-slate-600/80 hover:bg-slate-500/90 backdrop-blur-sm border border-slate-500/50 text-white font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-xl flex items-center"
              >
                Explore All Features
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  )
}
