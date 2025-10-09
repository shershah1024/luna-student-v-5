/**
 * My Progress Dashboard
 * Hub page with links to all skill-specific dashboards
 */

'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MessageSquare,
  Mic,
  FileText,
  BookOpen,
  Headphones,
  BookMarked,
  Volume2,
  AlertCircle
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Dashboard cards configuration
const dashboardCards = [
  {
    title: 'Speaking',
    description: 'View your speaking conversations and evaluation scores',
    href: '/dashboard/speaking',
    icon: Mic,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    available: true
  },
  {
    title: 'Writing',
    description: 'Track your writing submissions and feedback',
    href: '/dashboard/writing',
    icon: FileText,
    color: 'bg-green-100 text-green-700 border-green-300',
    available: true
  },
  {
    title: 'Reading',
    description: 'Review your reading comprehension test results',
    href: '/dashboard/reading',
    icon: BookOpen,
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    available: true
  },
  {
    title: 'Listening',
    description: 'Check your listening test performance',
    href: '/dashboard/listening',
    icon: Headphones,
    color: 'bg-pink-100 text-pink-700 border-pink-300',
    available: true
  },
  {
    title: 'Chatbot Conversations',
    description: 'See all your chatbot practice sessions',
    href: '/dashboard/chatbot',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    available: true
  },
  {
    title: 'Grammar',
    description: 'Analyze your grammar quiz results and error patterns',
    href: '/dashboard/grammar',
    icon: BookMarked,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    available: true
  },
  {
    title: 'Pronunciation',
    description: 'Track your pronunciation practice progress',
    href: '/dashboard/pronunciation',
    icon: Volume2,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    available: true
  },
  {
    title: 'Grammar Errors',
    description: 'Cross-skill grammar error analysis and patterns',
    href: '/dashboard/grammar-errors',
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-300',
    available: true
  }
]

export default function ProgressDashboard() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Progress</h1>
          <p className="text-gray-600">
            Track your learning progress across different skills and activities
          </p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((dashboard) => {
            const Icon = dashboard.icon
            const CardComponent = dashboard.available ? Link : 'div'
            const cardProps = dashboard.available ? { href: dashboard.href } : {}

            return (
              <CardComponent key={dashboard.title} {...cardProps}>
                <Card
                  className={`h-full transition-all ${
                    dashboard.available
                      ? 'hover:shadow-lg cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${dashboard.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          {dashboard.title}
                          {!dashboard.available && (
                            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                              Coming Soon
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {dashboard.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CardComponent>
            )
          })}
        </div>
      </div>
    </div>
  )
}
