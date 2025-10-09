'use client';

import { useState } from 'react';
import { BookOpen, ArrowRight, CheckCircle, Volume2, Brain, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utilityClasses } from '@/lib/design-tokens';
import { motion, AnimatePresence } from 'framer-motion';

interface VocabularyTutorProps {
  sectionId: string;
  lessonId: string;
  userId: string;
  vocabulary: any[];
  onComplete: () => void;
}

export default function VocabularyTutor({
  sectionId,
  lessonId,
  userId,
  vocabulary,
  onComplete,
}: VocabularyTutorProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [studiedWords, setStudiedWords] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  const handleWordStudied = () => {
    const newStudied = [...studiedWords, vocabulary[currentWordIndex].term];
    setStudiedWords(newStudied);

    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setShowCompletion(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const handleRestart = () => {
    setCurrentWordIndex(0);
    setStudiedWords([]);
    setShowCompletion(false);
  };

  const currentWord = vocabulary[currentWordIndex];
  const progress = ((studiedWords.length) / vocabulary.length) * 100;

  return (
    <div className={cn(utilityClasses.premiumCard, utilityClasses.glassMorphism, "p-8 max-w-4xl mx-auto space-y-8")}>
      {/* Premium Header */}
      <div className="text-center">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-12 h-12 bg-[#2D3748] rounded-2xl flex items-center justify-center shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className={cn(utilityClasses.headingText)}>Vocabulary Study</span>
        </div>
        <p className="text-[#4A5568] text-lg">
          Master {vocabulary.length} new words for this lesson
        </p>
      </div>

      {/* Premium Progress Bar */}
      <div className={cn(
        utilityClasses.premiumCard,
        "p-4 bg-[#EFEAE6] border border-[#E8E4E1]"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#2D3748]" />
            <span className="font-medium text-[#2D3748]">Progress</span>
          </div>
          <span className="text-[#2D3748] font-semibold">
            {studiedWords.length} / {vocabulary.length} words
          </span>
        </div>
        
        <div className="w-full h-3 bg-[#E8E4E1] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#2D3748] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Vocabulary Card or Completion */}
      <AnimatePresence mode="wait">
        {!showCompletion ? (
          <motion.div
            key={currentWordIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              utilityClasses.premiumCard,
              "p-12 text-center bg-[#FDFBF9] border border-[#E8E4E1] shadow-xl"
            )}
          >
            {currentWord && (
              <>
                {/* Premium Word Card */}
                <div className="space-y-8">
                  {/* Source Term */}
                  <div>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-[#2D3748] rounded-xl flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-[#4A5568] uppercase tracking-wider">Word</span>
                    </div>
                    <div className="text-4xl font-bold text-[#2D3748] mb-2">
                      {currentWord.term}
                    </div>
                    
                    {/* Audio Button (if audio available) */}
                    {currentWord.audio && (
                      <motion.button
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFEAE6] hover:bg-[#E8E4E1] text-[#2D3748] rounded-xl transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Listen</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Translation */}
                  <div>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-[#2D3748] rounded-xl flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-[#4A5568] uppercase tracking-wider">English</span>
                    </div>
                    <div className="text-2xl font-semibold text-[#2D3748]">
                      {currentWord.translation}
                    </div>
                  </div>

                  {/* Example Sentence */}
                  {currentWord.example && (
                    <div className={cn(
                      utilityClasses.premiumCard,
                      "p-6 bg-[#EFEAE6] border border-[#E8E4E1]"
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-[#2D3748] rounded-lg flex items-center justify-center">
                          <BookOpen className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-[#2D3748]">Example Usage</span>
                      </div>
                      <p className="text-[#4A5568] italic text-lg leading-relaxed">
                        "{currentWord.example}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Premium Action Button */}
                <div className="mt-12">
                  <motion.button
                    onClick={handleWordStudied}
                    className="px-10 py-4 bg-[#2D3748] hover:bg-[#1F2937] text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentWordIndex < vocabulary.length - 1 ? (
                      <>
                        <ArrowRight className="h-5 w-5" />
                        Next Word
                      </>
                    ) : (
                      <>
                        <Trophy className="h-5 w-5" />
                        Complete Study
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
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
                  Vocabulary Complete!
                </h3>
                <p className="text-[#2D3748] text-lg">
                  You've studied all {vocabulary.length} words successfully
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
                  Study Again
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
