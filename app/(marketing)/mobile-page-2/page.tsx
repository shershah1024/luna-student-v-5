'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  BookOpen,
  Headphones,
  MessageCircle,
  Target,
  Star,
  Timer,
  Mic,
  Check,
  Sparkles,
  AlertTriangle,
  Gauge,
  Shield,
} from 'lucide-react'

export default function MobileLandingV2() {
  const { user } = useUser()
  const dashboardUrl = '/dashboard'

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Hero Section - Matching Main Homepage */}
      <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-12">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-400 opacity-90" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-screen-sm mx-auto px-6 text-center">
          <div className="space-y-6">
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ace The Goethe A1 with
              <span className="block bg-gradient-to-r from-teal-200 to-cyan-200 bg-clip-text text-transparent mt-2">
                AI-Powered Preparation
              </span>
            </h1>
            
            <p className="text-base text-white/90 leading-relaxed max-w-md mx-auto">
              Your personal AI tutor offers interactive lessons, practice tests, and instant feedback across all Goethe A1 skills.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-2 border border-white/20">
                <p className="text-xs text-white/70 mb-1">Available</p>
                <p className="text-sm font-bold text-white">24/7</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-2 border border-white/20">
                <p className="text-xs text-white/70 mb-1">Focus</p>
                <p className="text-sm font-bold text-white">Goethe A1</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-2 border border-white/20">
                <p className="text-xs text-white/70 mb-1">Lessons</p>
                <p className="text-sm font-bold text-white">Quick</p>
              </div>
            </div>
            
            {/* CTA Button */}
            <Button 
              size="lg" 
              className="text-base px-8 py-6 bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-2xl hover:shadow-white/25 transition-all duration-300 w-full sm:w-auto"
              asChild
            >
              <Link href={user ? dashboardUrl : '/sign-in?redirect_url=%2Fdashboard'}>
                {user ? 'Continue Learning' : 'Start Goethe Prep'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium">Explore Features</p>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mx-auto max-w-screen-sm px-6 mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Start Learning</h2>
          <p className="text-sm text-gray-600">Choose your preferred way to practice</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/lessons" className="group">
            <Card className="h-full active:scale-[0.98] transition-all duration-200 hover:shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 group-hover:from-blue-100 group-hover:to-blue-200/50">
              <CardContent className="p-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white inline-flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Lessons</p>
                <p className="text-xs text-gray-600">Interactive learning</p>
              </CardContent>
            </Card>
          </Link>


          <Link href="/vocabulary-practice" className="group">
            <Card className="h-full active:scale-[0.98] transition-all duration-200 hover:shadow-md border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 group-hover:from-violet-100 group-hover:to-violet-200/50">
              <CardContent className="p-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white inline-flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Vocabulary</p>
                <p className="text-xs text-gray-600">AI tutor chat</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>


      {/* Today's Plan */}
      <section className="mx-auto max-w-screen-sm px-6 mb-8">
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Today's Goals</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Continue your learning journey</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <Star className="h-4 w-4 text-gray-300" />
                <Star className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-white/70 rounded-lg p-3 mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Next: Family & Introductions</p>
              <p className="text-xs text-gray-600">Practice basic conversation skills</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/70 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-600 mb-1">10</div>
                <p className="text-xs text-gray-600">min Listening</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3">
                <div className="text-lg font-bold text-emerald-600 mb-1">8</div>
                <p className="text-xs text-gray-600">min Reading</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3">
                <div className="text-lg font-bold text-orange-600 mb-1">5</div>
                <p className="text-xs text-gray-600">min Speaking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>





      <div className="pb-20"></div>

      {/* Clean Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-gray-200 shadow-lg">
        <div className="mx-auto max-w-screen-sm px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Ready to start learning?</p>
              <p className="text-xs text-gray-600 mt-0.5">Begin your Goethe A1 journey today</p>
            </div>
            <Button asChild size="lg" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
              <Link href={user ? dashboardUrl : '/sign-in?redirect_url=%2Fdashboard'}>
                {user ? 'Continue' : 'Get Started'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  )
}

function RoadblockItem({
  icon,
  title,
  problem,
  solution,
}: {
  icon: ReactNode
  title: string
  problem: string
  solution: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{title}</p>
            <div className="mt-1 grid grid-cols-1 gap-2">
              <div className="rounded-md bg-red-50 border border-red-100 p-2">
                <p className="text-[11px] font-medium text-red-700">Challenge</p>
                <p className="text-xs text-red-700/90">{problem}</p>
              </div>
              <div className="rounded-md bg-emerald-50 border border-emerald-100 p-2">
                <p className="text-[11px] font-medium text-emerald-700">Solution</p>
                <p className="text-xs text-emerald-800">{solution}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
