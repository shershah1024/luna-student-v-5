/**
 * Hook for fetching teacher assignments
 * This is a minimal stub for compatibility - learners view and complete assignments
 * but don't create them
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AssignmentData {
  id: string
  assignment_type: string
  exercise_type?: string
  parameters?: Record<string, any>
  debate_topic?: string
  student_position?: string
  ai_position?: string
  difficulty_level?: string
  [key: string]: any
}

interface UseTeacherAssignmentReturn {
  data: AssignmentData | null
  isLoading: boolean
  error: Error | string | null
}

/**
 * Fetch a teacher assignment by task ID
 * Used by learners to view and complete their assigned tasks
 *
 * @param taskId - The ID of the assignment/task
 * @returns Object containing assignment data, loading state, and error
 */
export function useTeacherAssignment(taskId: string): UseTeacherAssignmentReturn {
  const [data, setData] = useState<AssignmentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | string | null>(null)

  useEffect(() => {
    async function fetchAssignment() {
      if (!taskId) {
        setError('No task ID provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch from teacher_assignments table
        const { data: assignment, error: fetchError } = await supabase
          .from('teacher_assignments')
          .select('*')
          .eq('id', taskId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (!assignment) {
          throw new Error('Assignment not found')
        }

        setData(assignment)
      } catch (err) {
        console.error('[useTeacherAssignment] Error fetching assignment:', err)
        setError(err instanceof Error ? err : String(err))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignment()
  }, [taskId])

  return { data, isLoading, error }
}

/**
 * Hook for fetching pronunciation-specific assignments
 * Alias of useTeacherAssignment for pronunciation exercises
 */
export function usePronunciationAssignment(taskId: string): UseTeacherAssignmentReturn {
  return useTeacherAssignment(taskId)
}
