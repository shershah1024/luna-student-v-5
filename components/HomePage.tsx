'use client'

import Image from 'next/image'
import Link from 'next/link'
import { 
  Clock, 
  Award, 
  ChevronRight, 
  Globe, 
  MessageSquare
} from 'lucide-react'
import { HeroSection } from './HeroSection'
import { FeaturesOverviewSection } from './FeaturesOverviewSection'
import { FeatureSection } from './FeatureSection'
import { CallToActionSection } from './CallToActionSection'

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white">
      <HeroSection />

      <div id="features" className="pt-8 md:pt-12 pb-12 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturesOverviewSection />

          <FeatureSection
            imageUrl="/images/ai-conversation.png"
            imageAlt="AI Conversation Practice"
            IconComponent={MessageSquare}
            iconColorClass="text-blue-400"
            iconBgClass="bg-blue-500/20"
            title="Student Conversation Practice"
            description="Provide your students with AI-powered conversation practice that adapts to their level and gives instant feedback."
            features={['Personalized student feedback', 'Track conversation progress', 'Customizable dialogue scenarios']}
            linkHref="/conversation"
            linkText="Set up student practice"
            imagePosition="right"
          />

          <FeatureSection
            imageUrl="/images/listening.png"
            imageAlt="Listening Practice"
            IconComponent={Clock}
            iconColorClass="text-sky-400"
            iconBgClass="bg-sky-500/20"
            title="Listening Exercises Library"
            description="Access a comprehensive library of listening exercises you can assign to students at different proficiency levels."
            features={['Ready-to-assign exercises', 'Auto-graded assessments', 'Student progress tracking']}
            linkHref="/listening/tests"
            linkText="Browse exercise library"
            imagePosition="left"
          />

          <FeatureSection
            imageUrl="/images/writing.png"
            imageAlt="Writing Practice"
            IconComponent={Award}
            iconColorClass="text-indigo-400"
            iconBgClass="bg-indigo-500/20"
            title="Writing Assignment Tools"
            description="Create writing assignments and provide AI-assisted feedback to help students improve their written German."
            features={['Custom assignment creation', 'AI-powered grading assistance', 'Detailed error analysis']}
            linkHref="/writing"
            linkText="Create assignments"
            imagePosition="right"
          />

          <FeatureSection
            imageUrl="/images/tutor.png"
            imageAlt="AI German Tutor"
            IconComponent={Globe}
            iconColorClass="text-blue-400"
            iconBgClass="bg-blue-500/20"
            title="Meet Luna, Your Teaching Assistant"
            description="Luna helps you create engaging lessons, provide personalized student support, and automate routine teaching tasks."
            features={['Lesson plan generation', 'Automated student assessments', 'Personalized learning paths']}
            linkHref="/chat"
            linkText="Get teaching support"
            imagePosition="left"
            imageAspectClass="aspect-square"
          />

        </div>
      </div>

      <CallToActionSection />
    </div>
  )
}
