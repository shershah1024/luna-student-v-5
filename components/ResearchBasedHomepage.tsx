'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  BarChart3,
  Brain,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageCircle,
  Headphones,
  PenTool,
  AlertCircle,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// Language Learning Effectiveness Section - Focus on student outcomes
const LanguageEffectivenessSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main focus badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium mb-6 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>Making language learning actually work</span>
          </motion.div>

          {/* Main value proposition */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            Complete assignments{' '}
            <span className="relative inline-block">
              <span className="italic text-purple-600">3x faster</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none">
                <path d="M2 8C50 4, 100 4, 198 8" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="block text-2xl md:text-3xl mt-4 text-gray-700 font-normal">
              with AI support that's always available
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            Luna is your companion for language learning. Work on teacher-assigned tasks,
            practice speaking in any language, and get instant feedback that adapts to
            your level—available 24/7 whenever you need support.
          </motion.p>

          {/* Learning outcomes comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, rotate: -0.5 }}
            className="bg-white rounded-3xl shadow-xl p-8 mb-8 border-2 border-purple-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Without Luna vs. With Your AI Companion</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h4 className="font-medium text-red-600 mb-3">❌ Without Luna</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Wait for class to practice speaking</li>
                  <li>• Struggle alone on assignments</li>
                  <li>• Feedback takes days to receive</li>
                  <li>• Limited practice opportunities</li>
                  <li>• Get stuck with no help available</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="font-medium text-green-600 mb-3">✅ With Luna</h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>• Practice speaking 24/7 in any language</li>
                  <li>• Get AI help on assignments instantly</li>
                  <li>• Instant feedback on pronunciation</li>
                  <li>• Unlimited practice anytime, anywhere</li>
                  <li>• Always-available learning support</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Key metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <motion.div whileHover={{ scale: 1.05, rotate: -2 }} className="bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-200 rounded-3xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">300%</div>
              <div className="text-gray-700 font-medium">More speaking practice</div>
              <div className="text-sm text-gray-600 mt-1">Available to you, anytime</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-200 rounded-3xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
              <div className="text-gray-700 font-medium">Achieve fluency faster</div>
              <div className="text-sm text-gray-600 mt-1">vs. 62% traditional</div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-200 rounded-3xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">12+</div>
              <div className="text-gray-700 font-medium">Languages supported</div>
              <div className="text-sm text-gray-600 mt-1">Practice any language</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Research-backed effectiveness section
const EffectivenessSection = () => {
  const principles = [
    {
      title: "Comprehensible Input at 95-98%",
      description: "You understand almost everything while naturally acquiring new language patterns. Luna maintains this optimal zone automatically for you.",
      icon: <Brain className="w-5 h-5" />,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Immediate Corrective Feedback",
      description: "You know instantly what's right or wrong, forming correct language patterns from the start. No more fossilized errors from delayed correction.",
      icon: <Zap className="w-5 h-5" />,
      color: "from-amber-500 to-amber-600"
    },
    {
      title: "Meaningful Interaction",
      description: "Negotiate meaning with patient AI partners, developing real communication skills through authentic conversation practice.",
      icon: <MessageCircle className="w-5 h-5" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Perfect Memory Timing",
      description: "Words and structures reappear exactly when you're about to forget them, moving knowledge from short-term to permanent memory.",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4 border-2 border-green-200"
          >
            <Shield className="w-4 h-4" />
            <span>Built on proven language learning principles</span>
          </motion.div>

          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            The <span className="italic text-purple-600">science</span> behind faster language learning
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Luna applies proven language acquisition principles that make learning
            natural, effective, and permanent - not just memorization that fades.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {principles.map((principle, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, rotate: index % 2 === 0 ? -1 : 1 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 shadow-lg border-2 border-gray-200"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-gradient-to-br ${principle.color} rounded-2xl text-white shadow-lg`}>
                  {principle.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {principle.title}
                  </h3>
                  <p className="text-gray-600">
                    {principle.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Every student succeeds section
const EveryStudentSucceedsSection = () => {
  const challenges = [
    { level: "German", needs: "Complete speaking assignments", color: "bg-blue-500" },
    { level: "French", needs: "Practice pronunciation", color: "bg-green-500" },
    { level: "Spanish", needs: "Work on grammar tasks", color: "bg-amber-500" },
    { level: "12+ more", needs: "Any language you're learning", color: "bg-purple-500" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-white relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium mb-4 shadow-lg">
                <Users className="w-4 h-4" />
                <span>Personalized for you</span>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Learn at your{' '}
                <span className="relative inline-block">
                  <span className="italic text-purple-600">perfect</span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none">
                    <path d="M2 8C50 4, 100 4, 198 8" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </span>
                {' '}pace
              </h2>

              <p className="text-xl text-gray-600 mb-6">
                Complete teacher-assigned tasks at your own pace with AI support that
                adapts to your level. Whether you're practicing German, French, Spanish,
                or any other language, Luna keeps you in your optimal learning zone.
              </p>

              <p className="text-lg text-gray-700 font-medium mb-6">
                How Luna supports your learning:
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Work on assignments with instant AI guidance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Practice speaking anytime without judgment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Get immediate feedback on pronunciation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">Learn at your speed, available 24/7</span>
                </li>
              </ul>

              <Link href="/demo/personalization">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-all shadow-lg"
                >
                  See personalized learning in action
                  <ArrowRight className="inline-block ml-2 w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, rotate: -1 }}
              className="bg-white rounded-3xl shadow-xl p-6 border-2 border-purple-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Practice <span className="italic text-purple-600">any language</span>:
              </h3>
              <div className="space-y-3">
                {challenges.map((challenge, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-2xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <span className={`px-3 py-1 ${challenge.color} text-white rounded-full text-sm font-medium shadow-md`}>
                      {challenge.level}
                    </span>
                    <span className="text-sm text-gray-600">{challenge.needs}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
                <p className="text-green-800 font-medium">
                  ✓ Your AI companion supports all languages
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Skills development with research backing
const SkillsDevelopmentSection = () => {
  const skills = [
    {
      name: "Speaking",
      icon: <MessageCircle className="w-6 h-6" />,
      traditional: "Limited practice time, no feedback outside class",
      withLuna: "24/7 AI conversation partners with instant pronunciation feedback",
      effectiveness: "3x more speaking practice than traditional classroom",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-100 to-blue-50",
      border: "border-blue-200"
    },
    {
      name: "Listening",
      icon: <Headphones className="w-6 h-6" />,
      traditional: "Generic audio, one speed for all students",
      withLuna: "Native speaker videos adapted to each level with adjustable speed",
      effectiveness: "87% improved comprehension in 8 weeks",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-100 to-green-50",
      border: "border-green-200"
    },
    {
      name: "Reading",
      icon: <BookOpen className="w-6 h-6" />,
      traditional: "Fixed texts, dictionary dependency",
      withLuna: "Graded readers with inline definitions maintaining 95% comprehension",
      effectiveness: "2x faster vocabulary acquisition",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-100 to-purple-50",
      border: "border-purple-200"
    },
    {
      name: "Writing",
      icon: <PenTool className="w-6 h-6" />,
      traditional: "Wait days for feedback, generic corrections",
      withLuna: "Instant AI feedback on grammar, style, and structure",
      effectiveness: "65% reduction in grading time",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-100 to-orange-50",
      border: "border-orange-200"
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform <span className="italic text-purple-600">every</span> skill area
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Proven methods that accelerate language acquisition for every student
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, rotate: index % 2 === 0 ? 1 : -1 }}
              className="relative"
            >
              <div className={`bg-gradient-to-br ${skill.bgGradient} rounded-3xl border-2 ${skill.border} overflow-hidden shadow-lg`}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 bg-gradient-to-br ${skill.gradient} rounded-2xl text-white shadow-lg`}>
                      {skill.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{skill.name}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Traditional approach:</p>
                      <p className="text-gray-600">{skill.traditional}</p>
                    </div>

                    <div>
                      <p className="text-sm text-green-600 font-medium mb-1">With Luna:</p>
                      <p className="text-gray-800 font-medium">{skill.withLuna}</p>
                    </div>

                    <div className="pt-3 border-t-2 border-white">
                      <p className="text-sm font-medium text-blue-600">
                        📊 {skill.effectiveness}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Learner dashboard preview
const DashboardPreviewSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 to-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Track <span className="italic text-purple-600">your progress</span> in real-time
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See exactly how you're improving with detailed analytics
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-100"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <h3 className="text-lg font-semibold">Your Learning Dashboard</h3>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Your Progress</h4>
                  <span className="text-green-600 text-sm font-medium px-3 py-1 bg-green-100 rounded-full">Active</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Level</span>
                    <span className="font-bold text-gray-900">B1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Weekly Progress</span>
                    <span className="font-bold text-green-600">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Exercises Completed</span>
                    <span className="font-bold text-gray-900">87%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-200">
                <h4 className="font-semibold text-gray-900 mb-4">Areas to Practice</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-amber-100 rounded-xl border border-amber-200">
                    <span className="text-sm">Grammar: Dative case</span>
                    <button className="text-amber-700 text-xs font-medium px-2 py-1 bg-amber-200 rounded-full">Practice</button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-100 rounded-xl border border-blue-200">
                    <span className="text-sm">Speaking: Past tense</span>
                    <button className="text-blue-700 text-xs font-medium px-2 py-1 bg-blue-200 rounded-full">Start</button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
                <h4 className="font-semibold text-gray-900 mb-4">Your Strengths</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reading</span>
                    <span className="text-green-600 font-medium">98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vocabulary</span>
                    <span className="text-green-600 font-medium">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Listening</span>
                    <span className="text-green-600 font-medium">92%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>AI Insight:</strong> Great job completing your teacher's assignments!
                Try some extra speaking practice to reinforce what you've learned today.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Social proof with specific metrics
const ProofSection = () => {
  const stats = [
    { value: "95%", label: "Comprehension maintained", subtext: "for optimal learning", color: "from-blue-500 to-blue-600", bgColor: "from-blue-100 to-blue-50", border: "border-blue-200" },
    { value: "11 hrs", label: "Time saved weekly", subtext: "on average", color: "from-amber-500 to-amber-600", bgColor: "from-amber-100 to-amber-50", border: "border-amber-200" },
    { value: "3x", label: "More speaking practice", subtext: "vs. traditional methods", color: "from-purple-500 to-purple-600", bgColor: "from-purple-100 to-purple-50", border: "border-purple-200" },
    { value: "87%", label: "Student engagement", subtext: "improvement rate", color: "from-green-500 to-green-600", bgColor: "from-green-100 to-green-50", border: "border-green-200" }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
              className={`text-center bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border-2 ${stat.border} shadow-lg`}
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-700 font-medium mb-1">{stat.label}</div>
              <div className="text-sm text-gray-500">{stat.subtext}</div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

// Final CTA
const FinalCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-amber-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white shadow-2xl border-2 border-purple-400"
        >
          <h2 className="text-4xl font-bold mb-4">
            Start learning with{' '}
            <span className="relative inline-block">
              <span className="italic">your AI companion</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 300 10" fill="none">
                <path d="M2 8C100 4, 200 4, 298 8" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </span>
            {' '}today
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Complete assignments faster and practice any language with 24/7 AI support
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/lessons">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg"
              >
                Start Learning Free
              </motion.button>
            </Link>
            <Link href="/demo">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-purple-700 text-white rounded-full font-semibold hover:bg-purple-800 transition-all border-2 border-white/30"
              >
                See How It Works
              </motion.button>
            </Link>
          </div>

          <p className="text-sm text-purple-200">
            No credit card required • Full access to all features • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Main component
const ResearchBasedHomepage = () => {
  return (
    <>
      <LanguageEffectivenessSection />
      <EffectivenessSection />
      <EveryStudentSucceedsSection />
      <SkillsDevelopmentSection />
      <DashboardPreviewSection />
      <ProofSection />
      <FinalCTA />
    </>
  );
};

export default ResearchBasedHomepage;
