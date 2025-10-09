'use client'

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { 
  Sparkles,
  Zap,
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
  Command
} from 'lucide-react';
import Link from 'next/link';

// Magnetic button component with cursor following
const MagneticButton = ({ children, className = '', href = '#', variant = 'primary' }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    
    if (distance < 150) {
      const force = (150 - distance) / 150;
      setPosition({
        x: deltaX * force * 0.2,
        y: deltaY * force * 0.2
      });
    }
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl',
    secondary: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
    ghost: 'text-gray-700 hover:bg-gray-100'
  };
  
  return (
    <Link href={href}>
      <motion.button
        ref={ref}
        animate={{ x: position.x, y: position.y }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setPosition({ x: 0, y: 0 })}
        whileTap={{ scale: 0.98 }}
        className={`
          relative px-6 py-3 rounded-xl font-medium
          transition-all duration-300 group
          ${variantClasses[variant]}
          ${className}
        `}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </motion.button>
    </Link>
  );
};

// Glassmorphic card with hover effects
const GlassCard = ({ children, className = '', delay = 0, size = 'normal' }) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    normal: 'col-span-1 row-span-1 md:col-span-2',
    large: 'col-span-1 row-span-1 md:col-span-2 lg:col-span-3 lg:row-span-2',
    tall: 'col-span-1 row-span-2'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`
        relative group
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-pink-400/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 overflow-hidden">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[-1px] bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-2xl animate-gradient" />
          <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl" />
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// Animated counter component
const AnimatedCounter = ({ value, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = value / 50;
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 30);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Main Modern Features Section
const ModernFeaturesSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -50]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  // Mouse position for gradient effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <section 
      className="relative min-h-screen py-24 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20" />
        <motion.div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(139, 92, 246, 0.15), transparent 50%)`
          }}
        />
      </div>

      {/* Floating orbs animation */}
      <motion.div style={{ y: y1 }} className="absolute top-20 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl" />
      <motion.div style={{ y: y2 }} className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with animated text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Next-Gen Learning Platform</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Experience the Future
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              of Language Learning
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Powered by AI, designed for humans. Master German with our revolutionary platform
            that adapts to your learning style.
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-[200px]">
          
          {/* Hero Feature - Large Card */}
          <GlassCard size="large" delay={0.1}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Teaching Assistant
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6 flex-1">
                Create personalized lessons in seconds with our advanced AI that understands
                your teaching style and adapts to student needs.
              </p>
              
              <div className="grid grid-cols-3 gap-4 mt-auto">
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    <AnimatedCounter value={98} suffix="%" />
                  </p>
                  <p className="text-sm text-gray-500">Time Saved</p>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    <AnimatedCounter value={15} suffix="K" />
                  </p>
                  <p className="text-sm text-gray-500">Lessons Created</p>
                </div>
                <div>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    <AnimatedCounter value={4.9} />
                  </p>
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
              </div>
              
              <MagneticButton href="/teachers/assignments" className="mt-6 w-full">
                Start Creating
              </MagneticButton>
            </div>
          </GlassCard>

          {/* Live Sessions Card */}
          <GlassCard size="normal" delay={0.2}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Live Speaking</h4>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-500">Live</span>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full opacity-20 animate-pulse" />
                  <div className="absolute inset-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Practice with AI tutors 24/7
              </p>
            </div>
          </GlassCard>

          {/* Stats Card - Tall */}
          <GlassCard size="tall" delay={0.3}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Growth Stats</h4>
              </div>
              
              <div className="space-y-6 flex-1">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Reading</span>
                    <span className="text-sm font-semibold">89%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "89%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Speaking</span>
                    <span className="text-sm font-semibold">76%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "76%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Writing</span>
                    <span className="text-sm font-semibold">92%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "92%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Listening</span>
                    <span className="text-sm font-semibold">84%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "84%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions Grid */}
          <GlassCard size="small" delay={0.4}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Reading Quiz</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Auto-generate</p>
            </div>
          </GlassCard>

          <GlassCard size="small" delay={0.5}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-3">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Listening</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Native audio</p>
            </div>
          </GlassCard>

          <GlassCard size="small" delay={0.6}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-3">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Debate</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">AI opponent</p>
            </div>
          </GlassCard>

          {/* Achievement Card */}
          <GlassCard size="normal" delay={0.7}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Achievements</h4>
              </div>
              
              <div className="grid grid-cols-4 gap-3 flex-1">
                {[Star, Shield, Target, Zap].map((Icon, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ type: "spring" }}
                    className="aspect-square bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-lg flex items-center justify-center"
                  >
                    <Icon className="w-6 h-6 text-yellow-600" />
                  </motion.div>
                ))}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <strong>12 new</strong> achievements unlocked this week
              </p>
            </div>
          </GlassCard>

          {/* Community Card */}
          <GlassCard size="normal" delay={0.8}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Active Now</h4>
              </div>
              
              <div className="flex -space-x-2 mb-4">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full border-2 border-white"
                    style={{ zIndex: 8 - i }}
                  />
                ))}
                <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">+42</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <AnimatedCounter value={523} /> students learning right now
              </p>
            </div>
          </GlassCard>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-3xl opacity-30" />
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-16 rounded-3xl">
              <h3 className="text-3xl font-bold mb-4">
                Ready to Transform Your Teaching?
              </h3>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of educators using AI to create personalized, 
                engaging lessons that students love.
              </p>
              <div className="flex gap-4 justify-center">
                <MagneticButton href="/sign-up" variant="secondary">
                  Get Started Free
                </MagneticButton>
                <MagneticButton href="/demo" variant="ghost">
                  Watch Demo
                </MagneticButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ModernFeaturesSection;