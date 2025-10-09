'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain,
  BookOpen,
  Headphones,
  MessageCircle,
  Mic,
  Globe,
  BarChart3,
  Users,
  Target,
  PenTool,
  ChevronRight,
  Star,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Check,
  FileText,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// Section 1: Clean Feature Cards with Subtle Hover
const PrimaryFeaturesSection = () => {
  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-Powered Content Creation",
      description: "Generate comprehensive lesson plans, quizzes, and assignments in minutes. Our AI understands TELC standards and adapts to your teaching style.",
      link: "/teachers/assignments"
    },
    {
      icon: <Mic className="w-5 h-5" />,
      title: "24/7 Speaking Practice",
      description: "Students practice conversations with patient AI tutors anytime. Real-time pronunciation feedback and personalized correction.",
      link: "/lessons/speaking"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Intelligent Progress Tracking",
      description: "Monitor individual and class progress with detailed analytics. Identify struggling students and celebrate achievements automatically.",
      link: "/dashboard"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span>Trusted by 500+ Language Educators</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4"
          >
            Everything you need to teach effectively
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600"
          >
            Luna combines cutting-edge AI with pedagogical best practices to help you create, 
            assign, and assess language learning at scale.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <Link href={feature.link}>
                <div className="h-full p-8 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300">
                  <div className="inline-flex p-3 rounded-xl bg-gray-50 text-gray-700 mb-5 group-hover:bg-gray-100 transition-colors">
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="inline-flex items-center text-gray-900 font-medium group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 2: Elegant Grid Layout
const SkillsGridSection = () => {
  const skills = [
    { 
      icon: <BookOpen className="w-5 h-5" />, 
      name: "Reading",
      description: "Comprehension exercises",
      students: "2.3K active"
    },
    { 
      icon: <Headphones className="w-5 h-5" />, 
      name: "Listening",
      description: "Native audio content",
      students: "1.8K active"
    },
    { 
      icon: <PenTool className="w-5 h-5" />, 
      name: "Writing",
      description: "Essay evaluation",
      students: "1.5K active"
    },
    { 
      icon: <MessageCircle className="w-5 h-5" />, 
      name: "Speaking",
      description: "Conversation practice",
      students: "2.1K active"
    },
    { 
      icon: <Globe className="w-5 h-5" />, 
      name: "Vocabulary",
      description: "Contextual learning",
      students: "3.2K active"
    },
    { 
      icon: <Target className="w-5 h-5" />, 
      name: "Grammar",
      description: "Interactive lessons",
      students: "2.7K active"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Comprehensive skill development
          </h2>
          <p className="text-lg text-gray-600">
            Cover all aspects of language learning with specialized tools for each skill area.
            Every module is designed with proven pedagogical methods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer"
            >
              <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-gray-50 text-gray-700 group-hover:bg-gray-100 transition-colors">
                    {skill.icon}
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {skill.students}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1">{skill.name}</h3>
                <p className="text-sm text-gray-600">{skill.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 3: Stats with Clean Design
const MetricsSection = () => {
  const metrics = [
    { 
      value: "98%", 
      label: "Student Satisfaction",
      subtext: "Based on 10,000+ reviews"
    },
    { 
      value: "3x", 
      label: "Faster Lesson Creation",
      subtext: "Compared to traditional methods"
    },
    { 
      value: "15K+", 
      label: "Lessons Generated",
      subtext: "Across 50+ institutions"
    },
    { 
      value: "4.9/5", 
      label: "Teacher Rating",
      subtext: "From 500+ educators"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Proven results that matter
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join hundreds of educators who are transforming language education with AI-powered tools.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-semibold text-gray-900 mb-2">
                {metric.value}
              </div>
              <div className="text-gray-900 font-medium mb-1">
                {metric.label}
              </div>
              <div className="text-sm text-gray-500">
                {metric.subtext}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 4: Feature List with Icons
const DetailedFeaturesSection = () => {
  const features = [
    {
      category: "For Teachers",
      icon: <GraduationCap className="w-5 h-5" />,
      items: [
        "Auto-generate quizzes aligned to curriculum standards",
        "Create speaking exercises with AI conversation partners",
        "Design writing tasks with automated rubrics",
        "Track individual student progress in real-time",
        "Export detailed performance reports"
      ]
    },
    {
      category: "For Students",
      icon: <Users className="w-5 h-5" />,
      items: [
        "Practice speaking with AI tutors 24/7",
        "Get instant feedback on pronunciation",
        "Access personalized vocabulary lists",
        "Complete interactive grammar exercises",
        "Track learning streaks and achievements"
      ]
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Built for modern language education
          </h2>
          <p className="text-lg text-gray-600">
            Every feature is designed to save time for teachers and accelerate learning for students.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {features.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-white text-gray-700">
                  {section.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {section.category}
                </h3>
              </div>
              
              <ul className="space-y-4">
                {section.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 5: Simple CTA
const CTASection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Ready to transform your teaching?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join educators worldwide who save hours while delivering better learning outcomes.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Get started free
              </motion.button>
            </Link>
            
            <Link href="/demo">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Watch demo
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Main component - streamlined to avoid redundancy with other page sections
const ElegantFeaturesShowcase = () => {
  return (
    <>
      <PrimaryFeaturesSection />
      <SkillsGridSection />
      <MetricsSection />
      <CTASection />
    </>
  );
};

export default ElegantFeaturesShowcase;