'use client'

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  Brain,
  BookOpen,
  Headphones,
  MessageCircle,
  Mic,
  Globe,
  BarChart3,
  Trophy,
  Users,
  Target,
  PenTool,
  Play,
  ChevronRight,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Layers,
  Command,
  Zap,
  ArrowRight,
  Check,
  X,
  Volume2,
  FileText,
  GraduationCap,
  Lightbulb,
  Rocket,
  Heart
} from 'lucide-react';
import Link from 'next/link';

// Section 1: Interactive 3D Cards Carousel
const InteractiveCardsSection = () => {
  const [activeCard, setActiveCard] = useState(0);
  const cards = [
    {
      title: "AI Assignment Generator",
      description: "Create personalized lessons in seconds",
      icon: <Brain className="w-8 h-8" />,
      color: "from-purple-600 to-blue-600",
      stats: "15K+ lessons created"
    },
    {
      title: "Live Speaking Practice",
      description: "24/7 AI tutors for pronunciation",
      icon: <Mic className="w-8 h-8" />,
      color: "from-green-600 to-emerald-600",
      stats: "98% accuracy improvement"
    },
    {
      title: "Smart Progress Tracking",
      description: "Real-time analytics and insights",
      icon: <BarChart3 className="w-8 h-8" />,
      color: "from-orange-600 to-red-600",
      stats: "4.9/5 teacher rating"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated background mesh */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-blue-600/20"
          style={{ backgroundSize: "200% 200%" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-white text-center mb-16"
        >
          Transform Teaching with AI
        </motion.h2>

        <div className="relative h-[400px] flex items-center justify-center">
          {cards.map((card, index) => {
            const isActive = index === activeCard;
            const offset = index - activeCard;
            
            return (
              <motion.div
                key={index}
                animate={{
                  x: offset * 120,
                  scale: isActive ? 1 : 0.85,
                  opacity: Math.abs(offset) > 1 ? 0 : 1,
                  rotateY: offset * -15,
                  z: isActive ? 100 : -Math.abs(offset) * 100,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute w-80 cursor-pointer"
                onClick={() => setActiveCard(index)}
                style={{ perspective: 1000 }}
              >
                <div className={`relative p-8 rounded-2xl bg-gradient-to-br ${card.color} transform-gpu`}>
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl" />
                  <div className="relative z-10 text-white">
                    <div className="mb-4">{card.icon}</div>
                    <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                    <p className="text-white/80 mb-4">{card.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">{card.stats}</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveCard(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeCard ? "w-8 bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 2: Split Screen Comparison
const ComparisonSection = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
          {/* Traditional Way */}
          <motion.div 
            className="relative p-12 bg-gray-100"
            whileHover={{ scale: 0.98 }}
          >
            <div className="absolute top-4 right-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Without Luna</h3>
            <ul className="space-y-4">
              {[
                "Hours creating lesson plans",
                "Manual grading and feedback",
                "Limited practice opportunities",
                "No real-time progress tracking",
                "One-size-fits-all approach"
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <span className="text-gray-600 line-through">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* With Luna */}
          <motion.div 
            className="relative p-12 bg-gradient-to-br from-purple-50 to-blue-50"
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            <div className="absolute top-4 right-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">With Luna</h3>
            <ul className="space-y-4">
              {[
                "Create lessons in minutes",
                "Automated assessment & insights",
                "24/7 AI practice partners",
                "Live progress dashboards",
                "Personalized for every student"
              ].map((item, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <motion.div 
                    animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                  </motion.div>
                  <span className="text-gray-900 font-medium">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Section 3: Animated Stats with Floating Elements
const FloatingStatsSection = () => {
  const stats = [
    { value: 15000, label: "Lessons Created", icon: <FileText />, suffix: "+" },
    { value: 98, label: "Success Rate", icon: <Trophy />, suffix: "%" },
    { value: 4.9, label: "Teacher Rating", icon: <Star />, suffix: "/5" },
    { value: 523, label: "Active Now", icon: <Users />, suffix: "" }
  ];

  return (
    <section className="relative py-32 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white text-center mb-16"
        >
          Trusted by Educators Worldwide
        </motion.h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, type: "spring" }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="relative"
            >
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center border border-white/30">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-4 text-white/80"
                >
                  {stat.icon}
                </motion.div>
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 4: Interactive Feature Grid with Hover Effects
const InteractiveGridSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const features = [
    { 
      icon: <BookOpen className="w-6 h-6" />, 
      title: "Reading", 
      color: "bg-blue-500",
      description: "Auto-generated comprehension exercises"
    },
    { 
      icon: <Headphones className="w-6 h-6" />, 
      title: "Listening", 
      color: "bg-green-500",
      description: "Native speaker audio dialogues"
    },
    { 
      icon: <Mic className="w-6 h-6" />, 
      title: "Speaking", 
      color: "bg-purple-500",
      description: "Real-time pronunciation feedback"
    },
    { 
      icon: <PenTool className="w-6 h-6" />, 
      title: "Writing", 
      color: "bg-orange-500",
      description: "AI-powered essay evaluation"
    },
    { 
      icon: <MessageCircle className="w-6 h-6" />, 
      title: "Debate", 
      color: "bg-pink-500",
      description: "Structured argument practice"
    },
    { 
      icon: <Globe className="w-6 h-6" />, 
      title: "Vocabulary", 
      color: "bg-indigo-500",
      description: "Context-based word learning"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Complete Learning Suite</span>
          </motion.div>
          <h2 className="text-4xl font-bold text-gray-900">All Skills, One Platform</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className="relative group cursor-pointer"
            >
              <div className="relative h-48 bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-600" />
                </div>
                
                {/* Animated background on hover */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 2, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`absolute inset-0 ${feature.color} opacity-10`}
                      style={{ borderRadius: "50%" }}
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 p-6 h-full flex flex-col">
                  <div className={`inline-flex p-3 rounded-xl ${feature.color} text-white mb-4 self-start`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                  
                  <motion.div
                    className="mt-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                  >
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section 5: Testimonial Carousel with Parallax
const TestimonialCarousel = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "German Teacher",
      school: "International School Berlin",
      quote: "Luna has transformed my teaching. I save hours every week and my students are more engaged than ever.",
      rating: 5
    },
    {
      name: "Michael Schmidt",
      role: "Language Department Head",
      school: "Munich Academy",
      quote: "The AI-powered assessments provide insights I never had before. It's like having a teaching assistant 24/7.",
      rating: 5
    },
    {
      name: "Emma Williams",
      role: "TELC Instructor",
      school: "Language Institute Hamburg",
      quote: "My pass rates have increased by 40% since using Luna. The practice tools are incredibly effective.",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Parallax stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Loved by Educators
        </h2>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTestimonial}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            
            <p className="text-xl text-white mb-6 italic">
              "{testimonials[activeTestimonial].quote}"
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full" />
              <div>
                <p className="text-white font-semibold">{testimonials[activeTestimonial].name}</p>
                <p className="text-white/60 text-sm">{testimonials[activeTestimonial].role}</p>
                <p className="text-white/40 text-xs">{testimonials[activeTestimonial].school}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeTestimonial ? "w-8 bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Main component combining all sections
const DynamicFeaturesShowcase = () => {
  return (
    <>
      <InteractiveCardsSection />
      <ComparisonSection />
      <FloatingStatsSection />
      <InteractiveGridSection />
      <TestimonialCarousel />
    </>
  );
};

export default DynamicFeaturesShowcase;