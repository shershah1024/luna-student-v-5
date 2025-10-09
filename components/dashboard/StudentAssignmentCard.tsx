/**
 * StudentAssignmentCard Component
 * Displays a single assignment with task info, progress, and action button
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  MessageSquare,
  Mic,
  FileText,
  Headphones,
  BookMarked,
  Volume2
} from 'lucide-react'

interface StudentAssignment {
  id: string
  user_id: string
  task_id: string
  title: string
  task_type: string | null
  status: 'started' | 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  last_accessed_at: string
  completed_at: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface StudentAssignmentCardProps {
  assignment: StudentAssignment
}

// Map task types to icons
const taskTypeIcons = {
  chatbot: MessageSquare,
  speaking: Mic,
  writing: FileText,
  reading: BookOpen,
  listening: Headphones,
  grammar: BookMarked,
  pronunciation: Volume2,
  debate: MessageSquare,
  storytelling: MessageSquare,
  vocabulary: BookMarked,
  worksheet: FileText,
}

// Map task types to colors
const taskTypeColors = {
  chatbot: 'bg-blue-100 text-blue-700 border-blue-300',
  speaking: 'bg-purple-100 text-purple-700 border-purple-300',
  writing: 'bg-green-100 text-green-700 border-green-300',
  reading: 'bg-orange-100 text-orange-700 border-orange-300',
  listening: 'bg-pink-100 text-pink-700 border-pink-300',
  grammar: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  pronunciation: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  debate: 'bg-red-100 text-red-700 border-red-300',
  storytelling: 'bg-teal-100 text-teal-700 border-teal-300',
  vocabulary: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  worksheet: 'bg-slate-100 text-slate-700 border-slate-300',
}

// Map status to badge colors
const statusColors = {
  started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  abandoned: 'bg-red-100 text-red-700',
}

export function StudentAssignmentCard({ assignment }: StudentAssignmentCardProps) {
  const taskType = assignment.task_type || 'unknown'
  const Icon = taskTypeIcons[taskType as keyof typeof taskTypeIcons] || BookOpen
  const typeColor = taskTypeColors[taskType as keyof typeof taskTypeColors] || 'bg-gray-100 text-gray-700'
  const statusColor = statusColors[assignment.status]

  // Calculate progress from metadata (default 0 if not set)
  const progress = assignment.metadata?.progress || 0

  // Format last accessed date
  const lastAccessed = new Date(assignment.last_accessed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  // Generate task URL based on task type and ID
  const getTaskUrl = () => {
    const baseUrl = `/lessons/${taskType}`
    return `${baseUrl}/${assignment.task_id}`
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{assignment.title}</CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">
                Last accessed: {lastAccessed}
              </CardDescription>
            </div>
          </div>
          <Badge className={statusColor}>
            {assignment.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress Bar */}
          {assignment.status !== 'started' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Task Details */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{taskType}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">ID:</span>
              <span className="font-mono text-xs">{assignment.task_id.slice(0, 8)}...</span>
            </div>
          </div>

          {/* Action Button */}
          <Link href={getTaskUrl()}>
            <Button className="w-full" variant={assignment.status === 'completed' ? 'outline' : 'default'}>
              {assignment.status === 'completed' ? 'Review' : 'Continue'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
