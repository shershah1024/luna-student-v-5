"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Users, ArrowRight, MessageSquare, BookOpen, Mic } from 'lucide-react';

const HomeContent = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    assignments: 1000,
    weeklyHours: 11,
    languages: 12
  });

  useEffect(() => {
    const fetchAssignmentStats = async () => {
      try {
        const response = await fetch('/api/stats/assignments');
        if (response.ok) {
          const data = await response.json();
          setStats(prevStats => ({
            ...prevStats,
            assignments: data.totalAssignments || prevStats.assignments
          }));
        }
      } catch (error) {
        console.error('Error fetching assignment stats:', error);
      }
    };

    fetchAssignmentStats();
    const interval = setInterval(fetchAssignmentStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 via-white to-amber-50">
      {/* Organic Background Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Main Content */}
      <div className="relative z-10 px-6 lg:px-16 py-16 w-full">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          {/* Badge */}
          <div className="flex justify-start mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span>Meet Luna - Your AI Learning Partner</span>
            </div>
          </div>

          {/* Main Heading with Playful Typography */}
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight max-w-5xl">
            Your{' '}
            <span className="relative inline-block">
              <span className="italic text-purple-600">AI Companion</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 5, 100 5, 198 10" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round"/>
              </svg>
            </span>
            <br />
            for{' '}
            <span className="relative inline-block">
              <span className="italic text-amber-500">Language Learning</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 5, 100 5, 198 10" stroke="#C084FC" strokeWidth="6" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            Complete teacher-assigned tasks, practice speaking, and master any language
            with unlimited AI support. Get instant feedback that adapts to your level,
            available 24/7 whenever you need to practice.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Left Column - Features */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Your <span className="italic text-purple-600">interactive</span> learning experience
            </h2>

            {/* Feature Cards */}
            <motion.div
              whileHover={{ scale: 1.02, rotate: -1 }}
              className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-3xl p-6 shadow-sm border-2 border-purple-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Assignments</h3>
                  <p className="text-gray-600 text-sm">
                    Work on teacher-assigned tasks with AI support for speaking, listening, reading, and writing
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, rotate: 1 }}
              className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl p-6 shadow-sm border-2 border-amber-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Practice Anytime</h3>
                  <p className="text-gray-600 text-sm">
                    Get unlimited speaking practice in any language, 24/7, with no judgment
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, rotate: -1 }}
              className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-6 shadow-sm border-2 border-blue-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Feedback</h3>
                  <p className="text-gray-600 text-sm">
                    Get immediate corrections and guidance from AI-powered assessment
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/lessons')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full text-base font-semibold hover:bg-purple-700 transition-all shadow-lg"
              >
                Start Learning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-800 text-gray-800 rounded-full text-base font-semibold hover:bg-gray-50 transition-all"
              >
                Watch Demo
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-xl border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why learners <span className="italic text-purple-600">love</span> Luna</h3>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-gray-900">{formatNumber(stats.assignments)}+</p>
                    <p className="text-sm text-gray-600">Practice exercises</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-gray-900 tabular-nums">24/7</p>
                    <p className="text-sm text-gray-600">Available anytime</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-gray-900">{formatNumber(stats.languages)}+</p>
                    <p className="text-sm text-gray-600">Languages supported</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-8 shadow-xl text-white"
            >
              <p className="text-lg italic mb-4">
                "Luna makes it so easy to complete my assignments. I can practice speaking
                French anytime, and the instant feedback helps me improve faster than ever!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  SK
                </div>
                <div>
                  <p className="font-semibold">Sarah Kim</p>
                  <p className="text-sm text-purple-200">French Learner, B1 Level</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default HomeContent;
