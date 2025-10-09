import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Headphones, 
  MessageSquare, 
  PenTool, 
  BrainCircuit, 
  Mic,
  Target,
  Sparkles,
  Globe,
  Award,
  BarChart3,
  Users
} from 'lucide-react';
import Link from 'next/link';

// Component for displaying all platform features with generated images
const FeaturesSection = () => {
  // Teacher features with actual generated images
  const teacherFeatures = [
    {
      icon: <BrainCircuit className="w-5 h-5" />,
      title: "AI Assignment Generator",
      description: "Create TELC A1-aligned assignments instantly with intelligent content generation",
      image: "https://examaudio.tslfiles.org/uploads/20250829190411_63eb744e-fdac-4f56-8ce7-48b9f35d27c6.png",
      link: "/teachers/assignments"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Reading Quiz Builder",
      description: "Auto-generate comprehension passages with questions at the perfect difficulty",
      image: "https://examaudio.tslfiles.org/uploads/20250829190527_d88c4e27-a3a0-4e16-a649-c62715d4f22b.png",
      link: "/teachers/assignments/create/reading-quiz"
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: "Listening Exercise Creator",
      description: "Design audio dialogues with native speakers and auto-generated questions",
      image: "https://examaudio.tslfiles.org/uploads/20250829190643_ada595e8-f59e-48a9-8b0b-b2c0ad59d883.png",
      link: "/teachers/assignments/create/listening-quiz"
    },
    {
      icon: <PenTool className="w-5 h-5" />,
      title: "Writing Task Designer",
      description: "Build essay tasks with AI-powered evaluation and detailed rubrics",
      image: "https://examaudio.tslfiles.org/uploads/20250829190800_4234ca72-a4fa-4d18-9e0b-4037ec7e14d7.png",
      link: "/teachers/assignments/create/writing"
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Debate Challenge Setup",
      description: "Create structured debates with AI opponents for critical thinking",
      image: "https://examaudio.tslfiles.org/uploads/20250829191015_18356986-af09-404c-aaed-e8f3d471d02b.png",
      link: "/teachers/assignments/create/debate"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Story Workshop Builder",
      description: "Design collaborative storytelling with AI guidance and genre flexibility",
      image: "https://examaudio.tslfiles.org/uploads/20250829191113_44334b05-5870-4efb-92f1-c91e04727504.png",
      link: "/teachers/assignments/create/storytelling"
    }
  ];

  // Student features with actual generated images
  const studentFeatures = [
    {
      icon: <Mic className="w-5 h-5" />,
      title: "Speaking Practice with AI",
      description: "Real-time conversations with patient AI tutors for pronunciation and fluency",
      image: "https://examaudio.tslfiles.org/uploads/20250829191220_8b2aabb3-6ec2-4393-ac9d-03425481dcee.png",
      link: "/lessons/speaking",
      highlight: true
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Vocabulary Mastery",
      description: "Context-based learning with progress tracking and spaced repetition",
      image: "https://examaudio.tslfiles.org/uploads/20250829191315_e4b93236-6737-49a9-b001-e127c69f437d.png",
      link: "/lessons/vocabulary"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Grammar Tutor",
      description: "Interactive grammar lessons with instant correction and explanations",
      image: "https://examaudio.tslfiles.org/uploads/20250829191415_aac80252-b7a4-414f-be80-ac1feb833a0c.png",
      link: "/lessons/grammar"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Progress Analytics",
      description: "Track improvement across all skills with detailed performance insights",
      image: "https://examaudio.tslfiles.org/uploads/20250829191517_188e919e-acb4-442b-919a-1f1606fbcda0.png",
      link: "/dashboard"
    }
  ];

  return (
    <div className="bg-gradient-to-b from-[#FDFBF9] to-white py-20">
      <div className="max-w-[90rem] mx-auto px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-[#2D3748] mb-4">
            Powerful Features for Teachers & Students
          </h2>
          <p className="text-xl text-[#4A5568] max-w-3xl mx-auto">
            Discover our comprehensive suite of AI-powered tools designed to transform 
            language teaching and accelerate learning outcomes
          </p>
        </motion.div>

        {/* Teacher Features */}
        <div className="mb-20">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-semibold text-[#2D3748] mb-8 flex items-center gap-2"
          >
            <Users className="w-6 h-6 text-blue-600" />
            For Teachers
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teacherFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group"
              >
                <Link href={feature.link}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          {feature.icon}
                        </div>
                        <h4 className="text-lg font-semibold text-[#2D3748]">
                          {feature.title}
                        </h4>
                      </div>
                      
                      <p className="text-[#4A5568] text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      
                      <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-purple-600 transition-colors">
                        <span>Learn More</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Student Features */}
        <div>
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-semibold text-[#2D3748] mb-8 flex items-center gap-2"
          >
            <Award className="w-6 h-6 text-purple-600" />
            For Students
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {studentFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative"
              >
                {feature.highlight && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <Link href={feature.link}>
                  <div className={`bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${
                    feature.highlight ? 'ring-2 ring-purple-400 ring-offset-2' : ''
                  }`}>
                    {/* Image Container */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                          {feature.icon}
                        </div>
                        <h4 className="text-lg font-semibold text-[#2D3748]">
                          {feature.title}
                        </h4>
                      </div>
                      
                      <p className="text-[#4A5568] text-sm leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      
                      <div className="flex items-center text-purple-600 text-sm font-medium group-hover:text-pink-600 transition-colors">
                        <span>Start Learning</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Experience the Future of Language Learning?
          </h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of teachers and students already achieving amazing results 
            with our AI-powered platform
          </p>
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
            >
              <Link href="/sign-up">
                Get Started Free
              </Link>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              <Link href="/demo">
                Watch Demo
              </Link>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturesSection;