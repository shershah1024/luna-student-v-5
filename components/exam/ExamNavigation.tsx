'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useExamStore } from '@/lib/stores/examStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  PlayCircle,
  PauseCircle 
} from 'lucide-react';

const SKILL_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: MessageSquare
};

const SKILL_COLORS = {
  reading: 'text-blue-600 bg-blue-50 border-blue-200',
  listening: 'text-green-600 bg-green-50 border-green-200',
  writing: 'text-purple-600 bg-purple-50 border-purple-200',
  speaking: 'text-orange-600 bg-orange-50 border-orange-200'
};

export default function ExamNavigation() {
  const params = useParams();
  const pathname = usePathname();
  const { 
    currentExam, 
    availableTests, 
    currentTest,
    getSkillProgress,
    navigateToSkill 
  } = useExamStore();

  if (!currentExam || !availableTests.length) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
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

  return (
    <div className="p-6 space-y-6">
      {/* Exam Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Exam Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Sections</span>
            <span className="font-medium">{availableTests.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Skills</span>
            <span className="font-medium">{skills.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium">{currentExam.estimated_duration_minutes}min</span>
          </div>
        </CardContent>
      </Card>

      {/* Skills Navigation */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Test Sections</h3>
        
        {skills.map((skill) => {
          const Icon = SKILL_ICONS[skill];
          const skillTests = testsBySkill[skill];
          const skillProgress = getSkillProgress(skill);
          const isCurrentSkill = pathname.includes(`/${skill}`);
          
          return (
            <Card key={skill} className={`transition-all ${isCurrentSkill ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${SKILL_COLORS[skill].split(' ')[0]}`} />
                    <CardTitle className="text-sm font-medium capitalize">
                      {skill}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {skillProgress}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {skillTests.map((test) => {
                  const isCurrentTest = currentTest?.test_id === test.test_id;
                  const testPath = `/exams/${params.exam_id}/test/${test.test_id}/${skill}`;
                  
                  return (
                    <Link key={test.test_id} href={testPath}>
                      <div className={`
                        flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                        ${isCurrentTest 
                          ? `${SKILL_COLORS[skill]} border-2` 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {test.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            Section {test.section_number} • {test.total_questions} questions
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {test.status === 'completed' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {test.status === 'in_progress' && (
                            <PlayCircle className="h-4 w-4 text-blue-600" />
                          )}
                          {test.status === 'not_started' && (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          
                          {test.score !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                              {test.score}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <BookOpen className="h-3 w-3 mr-2" />
            Review Instructions
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <Clock className="h-3 w-3 mr-2" />
            Time Remaining
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <PauseCircle className="h-3 w-3 mr-2" />
            Save & Exit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}