'use client'

export const dynamic = 'force-dynamic';

import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Star,
  Brain,
  MessageCircle,
  ArrowRight,
  Menu,
  X,
  Play,
  Zap,
  Target,
  Timer,
  Award,
  Headphones,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function MobilePage1() {
  const { user } = useUser()
  const dashboardUrl = "/dashboard"
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedDemo, setExpandedDemo] = useState(false)
  const [currentDemoStep, setCurrentDemoStep] = useState(0)

  // Auto-advance demo conversation
  useEffect(() => {
    if (expandedDemo && currentDemoStep < 3) {
      const timer = setTimeout(() => {
        setCurrentDemoStep(currentDemoStep + 1)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [expandedDemo, currentDemoStep])

  const demoMessages = [
    {
      sender: "Luna",
      message: "Guten Tag! Ready to practice German?",
      isAI: true
    },
    {
      sender: "You",
      message: "Yes! Can you help with 'können' vs 'kann'?",
      isAI: false
    },
    {
      sender: "Luna", 
      message: "Perfect! 'Ich kann' but 'wir können'. The verb changes with the subject!",
      isAI: true
    },
    {
      sender: "You",
      message: "Ah! So 'Kannst du helfen?' is correct?",
      isAI: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Luna</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 px-4 py-4 space-y-3">
            <Link href="/dashboard" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link href="/lessons" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Lessons
            </Link>
            <Link href="/speaking-tests" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Speaking Practice
            </Link>
            <Link href="/vocabulary-tutor" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Vocabulary
            </Link>
          </div>
        )}
      </header>

      {/* Mobile Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-teal-500 text-white">
        {/* Simplified background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 1px, transparent 1px),
                             radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 px-4 py-12 text-center">
          {/* Hero Content */}
          <div className="space-y-6">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-1.5">
              🚀 Join 1,200+ Successful Students
            </Badge>
            
            <h1 className="text-3xl font-bold leading-tight">
              Pass Goethe Exams with
              <span className="block text-4xl bg-gradient-to-r from-teal-200 to-cyan-200 bg-clip-text text-transparent">
                Luna AI
              </span>
            </h1>
            
            <p className="text-white/90 text-lg px-4 leading-relaxed">
              Your personal AI tutor guarantees Goethe success with proven methods that work
            </p>

            {/* Primary CTA */}
            <div className="px-4">
              <Button 
                size="lg" 
                className="w-full text-lg px-6 py-6 bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-xl"
                asChild
              >
                {user ? (
                  <Link href={dashboardUrl}>
                    Continue Learning
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link href="/sign-in?redirect_url=%2Fdashboard">
                    Get My AI German Tutor
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-center gap-6 text-center pt-6 border-t border-white/20 mx-4">
              <div>
                <div className="text-2xl font-bold">€300+</div>
                <div className="text-sm text-white/80">Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold">7-Day</div>
                <div className="text-sm text-white/80">Free Trial</div>
              </div>
              <div>
                <div className="text-2xl font-bold">95%</div>
                <div className="text-sm text-white/80">Pass Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="px-4 py-8 bg-gray-50">
        <div className="space-y-4">
          <div className="text-center">
            <Badge className="bg-green-100 text-green-700 px-4 py-2 mb-3">
              ✅ Risk-Free Trial
            </Badge>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Try Luna for 7 Days Free
            </h2>
            <p className="text-gray-600 mb-4">
              Cancel anytime • No credit card required
            </p>
          </div>

          {/* Demo Chat Interface */}
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Luna AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm">Online</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-4">
              {/* Demo Messages */}
              {demoMessages.slice(0, expandedDemo ? currentDemoStep + 1 : 2).map((msg, index) => (
                <div key={index} className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.isAI 
                      ? 'bg-blue-600 text-white rounded-tl-none' 
                      : 'bg-gray-700 text-white rounded-tr-none'
                  }`}>
                    <p className="text-sm font-medium mb-1">{msg.sender}</p>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
              
              {/* Expand/Collapse Demo */}
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExpandedDemo(!expandedDemo)
                    if (!expandedDemo) setCurrentDemoStep(2)
                  }}
                  className="text-sm"
                >
                  {expandedDemo ? (
                    <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>See Full Conversation <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Try Demo CTA */}
          <Button 
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            asChild
          >
            <Link href={user ? dashboardUrl : "/sign-in?redirect_url=%2Fdashboard"}>
              <Play className="h-5 w-5 mr-2" />
              Start My 7-Day Free Trial
            </Link>
          </Button>
        </div>
      </section>

      {/* Core Benefits - Mobile Optimized */}
      <section className="px-4 py-8 bg-white">
        <div className="text-center mb-8">
          <Badge className="bg-green-100 text-green-700 px-4 py-2 mb-3">
            ✅ Why Choose Luna
          </Badge>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Everything You Need for Goethe Success
          </h2>
        </div>

        <div className="space-y-4">
          {/* Benefit Cards */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Pass Goethe First Try</h3>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-1">
                    <p>• AI-powered Goethe-focused preparation</p>
                    <p>• Proven methods with 95% success rate</p>
                    <p>• Save €200+ vs traditional tutoring</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">24/7 Personal AI Tutor</h3>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-1">
                    <p>• Available anytime, anywhere</p>
                    <p>• Adapts to your learning pace</p>
                    <p>• Never repeats - always progresses</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Timer className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Master German Faster</h3>
                  <div className="text-gray-600 text-sm leading-relaxed space-y-1">
                    <p>• 3x faster than traditional methods</p>
                    <p>• Practice fits your busy schedule</p>
                    <p>• Confidence in real conversations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Preview */}
      <section className="px-4 py-8 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Complete Goethe Preparation
          </h2>
          <p className="text-gray-600">All skills in one platform</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Headphones className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Listening</h3>
              <p className="text-xs text-gray-600">Audio practice</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Speaking</h3>
              <p className="text-xs text-gray-600">AI conversations</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Writing</h3>
              <p className="text-xs text-gray-600">Essay practice</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Reading</h3>
              <p className="text-xs text-gray-600">Comprehension</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
            asChild
          >
            <Link href={user ? dashboardUrl : "/sign-in?redirect_url=%2Fdashboard"}>
              Access My Goethe Training
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>


      {/* Sticky Bottom CTA */}
      <div className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3">
        <Button 
          size="lg" 
          className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-4 text-lg"
          asChild
        >
          {user ? (
            <Link href={dashboardUrl}>
              Continue Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link href="/sign-in?redirect_url=%2Fdashboard">
              Claim My AI German Tutor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </Button>
        <p className="text-center text-xs text-gray-600 mt-2">
          7-day free trial • Cancel anytime • €300+ value
        </p>
      </div>

      {/* Simplified Footer */}
      <footer className="bg-gray-900 text-white px-4 py-8">
        <div className="text-center space-y-6">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">Luna</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your personal AI German tutor for Goethe exam success
            </p>
            
            {/* Trust Badges */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm font-semibold text-white mb-1">🏆 Goethe Certified</div>
                <div className="text-xs text-gray-400">Official Preparation</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-white mb-1">🔒 Secure Learning</div>
                <div className="text-xs text-gray-400">Privacy Protected</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Learn</h3>
              <Link href="/dashboard" className="block text-gray-400 hover:text-white">Dashboard</Link>
              <Link href="/lessons" className="block text-gray-400 hover:text-white">Lessons</Link>
              <Link href="/speaking-tests" className="block text-gray-400 hover:text-white">Speaking</Link>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Practice</h3>
              <Link href="/vocabulary-tutor" className="block text-gray-400 hover:text-white">Vocabulary</Link>
              <Link href="/writing" className="block text-gray-400 hover:text-white">Writing</Link>
              <Link href="/listening" className="block text-gray-400 hover:text-white">Listening</Link>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <div className="text-center mb-3">
              <div className="text-xs text-gray-500 mb-1">Trusted by Microsoft, Google & Amazon Alumni</div>
              <div className="text-xs text-gray-400">Advanced AI Technology • GDPR Compliant</div>
            </div>
            <p className="text-gray-400 text-xs text-center">
              &copy; 2025 The Smart Language PTE Ltd. • All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}