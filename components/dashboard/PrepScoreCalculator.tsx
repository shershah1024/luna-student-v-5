import { useState } from 'react';
import { Info, TrendingUp, BookOpen, Headphones, Mic, PenTool, Target, Zap, Calendar, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface PrepScoreData {
  // Lesson Progress
  completedLessons: number;
  totalLessons: number;
  exerciseTypesCompleted: string[];
  chapterProgress: number;
  
  // Skill Scores (0-100 or null)
  reading: number | null;
  listening: number | null;
  speaking: number | null;
  writing: number | null;
  
  // Practice Metrics
  testAttempts: {
    reading: number;
    listening: number;
    speaking: number;
    writing: number;
  };
  recentTestDays: number; // Days since last test
  averageImprovement: number; // % improvement over time
  
  // Active Learning
  vocabularyMastered: number;
  pronunciationScore: number | null;
  grammarScore: number | null;
  
  // Engagement
  activeDaysLast30: number;
  currentStreak: number;
  todayActivity: boolean;
  
  // Time range for calculation
  timeRange: 'today' | 'week' | 'month' | 'all';
}

interface ScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  icon: React.ComponentType<{ className?: string }>;
  breakdown?: string[];
  color: string;
}

export function calculatePrepScore(data: PrepScoreData): {
  total: number;
  components: ScoreComponent[];
  level: string;
  recommendation: string;
} {
  const components: ScoreComponent[] = [];
  
  // Time-based multipliers
  const isToday = data.timeRange === 'today';
  const speakingMultiplier = isToday ? 3 : 1;
  const listeningMultiplier = isToday ? 3 : 1;
  
  // 1. Core Learning Progress (30 points base)
  const lessonCompletion = Math.min((data.completedLessons / data.totalLessons) * 10, 10);
  const exerciseTypes = Math.min(data.exerciseTypesCompleted.length * 1.25, 10);
  const difficulty = Math.min(data.chapterProgress * 10, 10);
  
  components.push({
    name: 'Learning Progress',
    score: lessonCompletion + exerciseTypes + difficulty,
    maxScore: 30,
    icon: BookOpen,
    breakdown: [
      `Lessons: ${lessonCompletion.toFixed(1)}/10`,
      `Exercise Variety: ${exerciseTypes.toFixed(1)}/10`,
      `Chapter Progress: ${difficulty.toFixed(1)}/10`
    ],
    color: 'blue'
  });
  
  // 2. Skill Assessment (30 points base, but weighted differently)
  const baseSkillPoints = 7.5;
  const readingScore = data.reading ? (data.reading / 100) * baseSkillPoints : 0;
  const writingScore = data.writing ? (data.writing / 100) * baseSkillPoints : 0;
  const listeningScore = data.listening ? (data.listening / 100) * baseSkillPoints * listeningMultiplier : 0;
  const speakingScore = data.speaking ? (data.speaking / 100) * baseSkillPoints * speakingMultiplier : 0;
  
  // Normalize if multipliers push total over 30
  const totalSkillRaw = readingScore + writingScore + listeningScore + speakingScore;
  const skillNormalizer = totalSkillRaw > 30 ? 30 / totalSkillRaw : 1;
  
  components.push({
    name: 'Language Skills',
    score: totalSkillRaw * skillNormalizer,
    maxScore: 30,
    icon: Target,
    breakdown: [
      `Reading: ${(readingScore * skillNormalizer).toFixed(1)}`,
      `Writing: ${(writingScore * skillNormalizer).toFixed(1)}`,
      `Listening: ${(listeningScore * skillNormalizer).toFixed(1)}${isToday ? ' (3x)' : ''}`,
      `Speaking: ${(speakingScore * skillNormalizer).toFixed(1)}${isToday ? ' (3x)' : ''}`
    ],
    color: 'purple'
  });
  
  // 3. Practice & Mastery (20 points)
  const totalTests = Object.values(data.testAttempts).reduce((a, b) => a + b, 0);
  const testPoints = Math.min(totalTests * 0.5, 8);
  const recentBonus = data.recentTestDays < 7 ? 2 : 0;
  const improvementPoints = Math.min(data.averageImprovement * 0.07, 7);
  const practiceScore = testPoints + recentBonus + improvementPoints + 3; // 3 base points
  
  components.push({
    name: 'Practice & Tests',
    score: Math.min(practiceScore, 20),
    maxScore: 20,
    icon: TrendingUp,
    breakdown: [
      `Test Attempts: ${testPoints.toFixed(1)}/8`,
      `Recent Activity: ${recentBonus}/2`,
      `Improvement: ${improvementPoints.toFixed(1)}/7`,
      `Section Mastery: 3/3`
    ],
    color: 'green'
  });
  
  // 4. Active Learning (10 points, weighted for today)
  const vocabPoints = Math.min(data.vocabularyMastered / 50, 4);
  const pronPoints = data.pronunciationScore 
    ? (data.pronunciationScore / 100) * 3 * (isToday ? speakingMultiplier : 1)
    : 0;
  const grammarPoints = data.grammarScore ? (data.grammarScore / 100) * 3 : 0;
  
  const activeTotal = vocabPoints + pronPoints + grammarPoints;
  const activeNormalizer = activeTotal > 10 ? 10 / activeTotal : 1;
  
  components.push({
    name: 'Active Learning',
    score: activeTotal * activeNormalizer,
    maxScore: 10,
    icon: Zap,
    breakdown: [
      `Vocabulary: ${(vocabPoints * activeNormalizer).toFixed(1)}/4`,
      `Pronunciation: ${(pronPoints * activeNormalizer).toFixed(1)}${isToday ? ' (3x)' : ''}`,
      `Grammar: ${(grammarPoints * activeNormalizer).toFixed(1)}/3`
    ],
    color: 'orange'
  });
  
  // 5. Engagement (10 points)
  const activeDaysPoints = (data.activeDaysLast30 / 30) * 3;
  const streakPoints = Math.min(data.currentStreak / 7, 2);
  const todayBonus = data.todayActivity ? 3 : 0;
  const consistencyPoints = 2; // Base for time distribution
  
  components.push({
    name: 'Consistency',
    score: activeDaysPoints + streakPoints + todayBonus + consistencyPoints,
    maxScore: 10,
    icon: Calendar,
    breakdown: [
      `Active Days: ${activeDaysPoints.toFixed(1)}/3`,
      `Streak: ${streakPoints.toFixed(1)}/2`,
      `Today: ${todayBonus}/3`,
      `Distribution: ${consistencyPoints}/2`
    ],
    color: 'amber'
  });
  
  // Calculate total
  const total = Math.round(components.reduce((sum, c) => sum + c.score, 0));
  
  // Determine level and recommendation
  let level = 'Just Starting';
  let recommendation = 'Focus on completing your first lessons';
  
  if (total >= 80) {
    level = 'Exam Ready';
    recommendation = 'You\'re well prepared! Consider taking a full practice exam.';
  } else if (total >= 60) {
    level = 'Advanced';
    recommendation = 'Great progress! Focus on your weaker skills.';
  } else if (total >= 40) {
    level = 'Progressing Well';
    recommendation = 'Keep up the consistency. Try more speaking exercises.';
  } else if (total >= 20) {
    level = 'Building Foundation';
    recommendation = 'Focus on daily practice and completing more lessons.';
  }
  
  return { total, components, level, recommendation };
}

interface PrepScoreDisplayProps {
  score: number;
  data: PrepScoreData;
  className?: string;
}

export function PrepScoreDisplay({ score, data, className }: PrepScoreDisplayProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { components, level, recommendation } = calculatePrepScore(data);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
  };
  
  return (
    <>
      <button
        onClick={() => setShowBreakdown(true)}
        className={cn(
          "group cursor-pointer transition-all hover:scale-105",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-6xl font-bold", getScoreColor(score))}>
            {score}
          </span>
          <Info className="h-4 w-4 text-white/40 group-hover:text-white/60" />
        </div>
        <div className="text-white/80">prep score</div>
      </button>
      
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Prep Score Breakdown</span>
              <span className={cn("text-3xl font-bold", getScoreColor(score))}>
                {score}/100
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* Level Badge */}
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-xl font-semibold">{level}</span>
              </div>
              <p className="text-sm text-slate-400">{recommendation}</p>
            </div>
            
            {/* Component Breakdown */}
            <div className="space-y-4">
              {components.map((component) => {
                const Icon = component.icon;
                const percentage = (component.score / component.maxScore) * 100;
                
                return (
                  <div key={component.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", `text-${component.color}-400`)} />
                        <span className="font-medium">{component.name}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {component.score.toFixed(1)} / {component.maxScore}
                      </span>
                    </div>
                    
                    <Progress 
                      value={percentage} 
                      className="h-2 bg-slate-800"
                    />
                    
                    {component.breakdown && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pl-6">
                        {component.breakdown.map((item, idx) => (
                          <div key={idx}>{item}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Time Range Note */}
            {data.timeRange === 'today' && (
              <div className="text-xs text-slate-400 text-center italic">
                * Speaking and Listening scores are weighted 3x for today's view to encourage active practice
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}