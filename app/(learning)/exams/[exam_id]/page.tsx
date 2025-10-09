'use client';

import React from 'react';
import { useExamStore } from '@/lib/stores/examStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  PlayCircle,
  BarChart3,
  Users,
  Award,
  Calendar
} from 'lucide-react';

const SKILL_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: MessageSquare
};

const SKILL_COLORS = {
  reading: 'from-blue-500 to-blue-600',
  listening: 'from-green-500 to-green-600',
  writing: 'from-purple-500 to-purple-600',
  speaking: 'from-orange-500 to-orange-600'
};

export default function ExamOverviewPage() {
  const params = useParams();
  const { 
    currentExam, 
    availableTests, 
    getSkillProgress, 
    getOverallProgress 
  } = useExamStore();

  if (!currentExam || !availableTests.length) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>
          <p className="text-gray-500 mt-4">Loading exam overview...</p>
        </Card>
      </div>
    );
  }

  // Group tests by skill
  const testsBySkill = availableTests.reduce((acc, test) => {
    if (!acc[test.skill]) {
      acc[test.skill] = [];
    }
    acc[test.skill].push(test);
    return acc;
  }, {} as Record<string, typeof availableTests>);

  const skills = Object.keys(testsBySkill) as Array<keyof typeof SKILL_ICONS>;
  const overallProgress = getOverallProgress();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Exam Header */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentExam.title}</h1>
              <p className="text-blue-100 text-lg mb-4">{currentExam.description}</p>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>{currentExam.difficulty_level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{currentExam.estimated_duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{availableTests.length} test sections</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold mb-2">{overallProgress}%</div>
              <div className="text-blue-100">Overall Progress</div>
              <Progress 
                value={overallProgress} 
                className="w-48 mt-2 bg-blue-400/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {skills.map((skill) => {
          const Icon = SKILL_ICONS[skill];
          const skillTests = testsBySkill[skill];
          const skillProgress = getSkillProgress(skill);
          const completedTests = skillTests.filter(t => t.status === 'completed');
          
          return (
            <Card key={skill} className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${SKILL_COLORS[skill]} opacity-5`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className={`h-8 w-8 text-gray-700`} />
                  <Badge variant="outline">
                    {completedTests.length}/{skillTests.length}
                  </Badge>
                </div>
                <CardTitle className="capitalize text-lg">{skill}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{skillProgress}%</span>
                  </div>
                  <Progress value={skillProgress} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{skillTests.length}</div>
                      <div className="text-gray-500">Tests</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {skillTests.reduce((sum, t) => sum + t.estimated_duration_minutes, 0)}m
                      </div>
                      <div className="text-gray-500">Duration</div>
                    </div>
                  </div>
                  
                  <Link href={`/exams/${params.exam_id}/test/${skillTests[0].test_id}/${skill}`}>
                    <Button 
                      className="w-full mt-3" 
                      variant={skillProgress > 0 ? "default" : "outline"}
                      size="sm"
                    >
                      {skillProgress === 100 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Review
                        </>
                      ) : skillProgress > 0 ? (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Test List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            All Test Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skills.map((skill) => {
              const skillTests = testsBySkill[skill];
              const Icon = SKILL_ICONS[skill];
              
              return (
                <div key={skill} className="space-y-2">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2 capitalize">
                    <Icon className="h-4 w-4" />
                    {skill} Tests
                  </h3>
                  
                  <div className="grid gap-2">
                    {skillTests.map((test) => (
                      <Link 
                        key={test.test_id} 
                        href={`/exams/${params.exam_id}/test/${test.test_id}/${skill}`}
                      >
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:border-gray-300 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              test.status === 'completed' ? 'bg-green-500' :
                              test.status === 'in_progress' ? 'bg-blue-500' :
                              'bg-gray-300'
                            }`} />
                            
                            <div>
                              <div className="font-medium text-sm">{test.title}</div>
                              <div className="text-xs text-gray-500">
                                Section {test.section_number} • {test.total_questions} questions
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-gray-500">
                              {test.estimated_duration_minutes}min
                            </div>
                            
                            {test.status === 'completed' && (
                              <>
                                <Badge variant="secondary" className="text-xs">
                                  {test.score}%
                                </Badge>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </>
                            )}
                            
                            {test.status === 'in_progress' && (
                              <PlayCircle className="h-4 w-4 text-blue-600" />
                            )}
                            
                            {test.status === 'not_started' && (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Begin with the first available test section
            </p>
            <Button className="w-full">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start First Test
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Review exam guidelines and requirements
            </p>
            <Button variant="outline" className="w-full">
              <BookOpen className="h-4 w-4 mr-2" />
              View Instructions
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Track your completion status
            </p>
            <Button variant="outline" className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Progress
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}