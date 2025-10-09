'use client';

import { useState } from 'react';
import { BookOpen, ArrowRight, CheckCircle, GraduationCap, Target, Lightbulb, Languages, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';
import { motion, AnimatePresence } from 'framer-motion';

interface GrammarTutorProps {
  sectionId: string;
  lessonId: string;
  userId: string;
  grammarTopic: string;
  content: any;
  onComplete: () => void;
}

export default function GrammarTutor({
  sectionId,
  lessonId,
  userId,
  grammarTopic,
  content,
  onComplete,
}: GrammarTutorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const steps = [
    { id: 'explanation', label: 'Learn', icon: Lightbulb },
    { id: 'examples', label: 'Examples', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Target }
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowCompletion(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setShowCompletion(false);
  };

  const renderStep = () => {
    const stepId = steps[currentStep].id;
    
    switch (stepId) {
      case 'explanation':
        return (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Premium Explanation Header */}
            <div className="text-center">
              <div className="flex items-center gap-3 justify-center mb-6">
                <div className="w-10 h-10 bg-[#2D3748] rounded-2xl flex items-center justify-center shadow-lg">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-semibold text-[#2D3748]">Grammar Explanation</span>
              </div>
            </div>

            {/* Premium Content Card */}
            <div className={cn(
              utilityClasses.premiumCard,
              "p-8 bg-[#FDFBF9] border border-[#E8E4E1]"
            )}>
              <div className="prose prose-lg max-w-none text-[#2D3748] leading-relaxed">
                <div className="text-lg">
                  {content.explanation || `Learn about ${grammarTopic} in German grammar. This fundamental concept will help you construct better sentences and communicate more effectively.`}
                </div>
              </div>
            </div>

            {/* Key Points (if available) */}
            {content.keyPoints && (
              <div className={cn(
                utilityClasses.premiumCard,
                "p-6 bg-[#EFEAE6] border border-[#E8E4E1]"
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-[#2D3748] rounded-lg flex items-center justify-center">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-semibold text-[#2D3748]">Key Points</span>
                </div>
                <ul className="space-y-2">
                  {content.keyPoints.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-[#2D3748]">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-[#2D3748] flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        );
      
      case 'examples':
        return (
          <motion.div
            key="examples"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Premium Examples Header */}
            <div className="text-center">
              <div className="flex items-center gap-3 justify-center mb-6">
                <div className="w-10 h-10 bg-[#2D3748] rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-semibold text-[#2D3748]">Examples in Context</span>
              </div>
            </div>

            {/* Premium Example Cards */}
            <div className="space-y-4">
              {(content.examples || [
                { german: `Example of ${grammarTopic} in German`, english: `Translation showing ${grammarTopic} usage` },
                { german: `Another ${grammarTopic} example`, english: `Another translation example` }
              ]).map((example: any, index: number) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    utilityClasses.premiumCard,
                    "p-6 bg-[#FDFBF9] border border-[#E8E4E1] hover:shadow-lg transition-all duration-300"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[#2D3748] rounded-xl flex items-center justify-center">
                      <Languages className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-[#4A5568]">Example {index + 1}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-[#2D3748] mb-1">German:</div>
                      <div className="text-lg font-semibold text-[#2D3748]">{example.german}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-[#4A5568]" />
                      <div className="h-px bg-gradient-to-r from-[#E8E4E1] to-transparent flex-1" />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-[#4A5568] mb-1">English:</div>
                      <div className="text-[#2D3748] font-medium">{example.english}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      
      case 'practice':
        return (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Premium Practice Header */}
            <div className="text-center">
              <div className="flex items-center gap-3 justify-center mb-6">
                <div className="w-10 h-10 bg-[#2D3748] rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-semibold text-[#2D3748]">Practice & Review</span>
              </div>
            </div>

            {/* Premium Practice Content */}
            <div className={cn(
              utilityClasses.premiumCard,
              "p-8 text-center bg-[#EFEAE6] border border-[#E8E4E1]"
            )}>
              <div className="space-y-6">
                <div className="w-16 h-16 bg-[#2D3748] rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-[#2D3748] mb-2">Ready to Practice!</h3>
                  <p className="text-[#2D3748] leading-relaxed">
                    You've learned the theory and seen examples of <strong>{grammarTopic}</strong>. 
                    Practice exercises help reinforce your understanding and build confidence.
                  </p>
                </div>

                <div className={cn(
                  utilityClasses.premiumCard,
                  "p-4 bg-[#FDFBF9] border border-[#E8E4E1]"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-[#2D3748]" />
                    <span className="text-sm font-medium text-[#2D3748]">Tip</span>
                  </div>
                  <p className="text-sm text-[#4A5568]">
                    Practice exercises for {grammarTopic} will be available in dedicated practice sections throughout your lessons.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn(utilityClasses.premiumCard, utilityClasses.glassMorphism, "p-8 max-w-4xl mx-auto space-y-8")}>
      {/* Premium Header */}
      <div className="text-center">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-12 h-12 bg-[#2D3748] rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className={cn(utilityClasses.headingText)}>German Grammar</span>
        </div>
        <h2 className="text-3xl font-bold text-[#2D3748] mb-2">{grammarTopic}</h2>
        <p className="text-[#4A5568] text-lg">Master this essential grammar concept step by step</p>
      </div>

      {/* Premium Progress Steps */}
      <div className={cn(
        utilityClasses.premiumCard,
        "p-4 bg-[#EFEAE6] border border-[#E8E4E1]"
      )}>
        <div className="flex items-center justify-center gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300",
                    isActive && "bg-[#2D3748] shadow-lg scale-110",
                    isCompleted && "bg-[#2D3748] shadow-lg",
                    isUpcoming && "bg-[#E8E4E1] text-[#4A5568]"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      (isActive || isCompleted) ? "text-white" : "text-[#4A5568]"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    isActive && "text-[#2D3748]",
                    isCompleted && "text-[#2D3748]",
                    isUpcoming && "text-[#4A5568]"
                  )}>
                    {step.label}
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 transition-colors duration-300",
                    index < currentStep ? "bg-[#2D3748]" : "bg-[#E8E4E1]"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!showCompletion ? (
          <div key={currentStep}>
            {renderStep()}
            
            {/* Premium Action Button */}
            <div className="text-center pt-8">
              <motion.button
                onClick={handleNextStep}
                className="px-10 py-4 bg-[#2D3748] hover:bg-[#1F2937] text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    <ArrowRight className="h-5 w-5" />
                    Continue to {steps[currentStep + 1].label}
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5" />
                    Complete Grammar Lesson
                  </>
                )}
              </motion.button>
            </div>
          </div>
        ) : (
          /* Premium Completion Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              utilityClasses.premiumCard,
              "p-12 text-center bg-[#EFEAE6] border border-[#E8E4E1]"
            )}
          >
            <div className="space-y-6">
              <div className="w-20 h-20 bg-[#2D3748] rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-[#2D3748] mb-2">
                  Grammar Lesson Complete!
                </h3>
                <p className="text-[#2D3748] text-lg">
                  You've mastered the essentials of <strong>{grammarTopic}</strong>
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-white border-2 border-[#E8E4E1] text-[#2D3748] rounded-xl font-medium hover:bg-[#FDFBF9] hover:border-[#2D3748] transition-all duration-200 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Review Again
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}