/**
 * Writing Dashboard API
 * Fetches all writing-related data for a user:
 * - Writing submissions with multi-dimensional scores
 * - Grammar errors from writing
 * - Statistics and trends
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch writing scores
    const { data: writingScores, error: scoresError } = await supabase
      .from('writing_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (scoresError) {
      console.error('Error fetching writing scores:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch writing scores' },
        { status: 500 }
      )
    }

    // Get unique task IDs
    const taskIds = [...new Set(writingScores?.map(score => score.task_id) || [])]

    // Fetch task details
    let taskDetailsMap: Record<string, any> = {}
    if (taskIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, task_type, language, level')
        .in('id', taskIds)

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
      }

      // Fetch writing task details
      const { data: writingTasks, error: writingTasksError } = await supabase
        .from('writing_tasks')
        .select('task_id, content, settings')
        .in('task_id', taskIds)

      if (writingTasksError) {
        console.error('Error fetching writing tasks:', writingTasksError)
      }

      // Create task details map
      tasks?.forEach(task => {
        const writingTask = writingTasks?.find(wt => wt.task_id === task.id)
        taskDetailsMap[task.id] = {
          ...task,
          content: writingTask?.content || {},
          settings: writingTask?.settings || {}
        }
      })
    }

    // Attach task details to writing scores
    const submissions = writingScores?.map(score => ({
      ...score,
      task_details: taskDetailsMap[score.task_id] || null
    })) || []

    // Fetch grammar errors from writing
    const { data: grammarErrors, error: errorsError } = await supabase
      .from('grammar_errors')
      .select('*')
      .eq('user_id', userId)
      .eq('source_type', 'writing')
      .order('created_at', { ascending: false })

    if (errorsError) {
      console.error('Error fetching grammar errors:', errorsError)
    }

    // Calculate statistics
    const totalSubmissions = submissions.length
    const averageTotalScore = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.total_score) || 0), 0) / submissions.length
      : 0

    const averageTaskCompletion = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.task_completion_score) || 0), 0) / submissions.length
      : 0

    const averageCoherenceCohesion = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.coherence_cohesion_score) || 0), 0) / submissions.length
      : 0

    const averageVocabulary = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.vocabulary_score) || 0), 0) / submissions.length
      : 0

    const averageGrammarAccuracy = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.grammar_accuracy_score) || 0), 0) / submissions.length
      : 0

    const averageFormat = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (Number(s.format_score) || 0), 0) / submissions.length
      : 0

    const averageWordCount = submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (Number(s.word_count) || 0), 0) / submissions.length)
      : 0

    const totalGrammarErrors = submissions.reduce((sum, s) => sum + (Number(s.grammar_error_count) || 0), 0)

    const lastSubmissionDate = submissions.length > 0 ? submissions[0].created_at : null

    // Calculate trend (recent 3 vs previous 3)
    const recentAverageScore = submissions.slice(0, 3).length > 0
      ? submissions.slice(0, 3).reduce((sum, s) => sum + (Number(s.total_score) || 0), 0) / submissions.slice(0, 3).length
      : 0

    const previousAverageScore = submissions.slice(3, 6).length > 0
      ? submissions.slice(3, 6).reduce((sum, s) => sum + (Number(s.total_score) || 0), 0) / submissions.slice(3, 6).length
      : 0

    const trendDirection = recentAverageScore > previousAverageScore ? 'up' :
                          recentAverageScore < previousAverageScore ? 'down' : 'stable'

    const trendPercentage = previousAverageScore > 0
      ? ((recentAverageScore - previousAverageScore) / previousAverageScore * 100)
      : 0

    // Group submissions by task
    const taskStatsMap: Record<string, any> = {}
    submissions.forEach(submission => {
      const taskId = submission.task_id
      if (!taskStatsMap[taskId]) {
        const taskDetails = submission.task_details || {}
        taskStatsMap[taskId] = {
          task_id: taskId,
          title: taskDetails.title || 'Untitled',
          topic: taskDetails.content?.topic || 'Unknown',
          language: taskDetails.content?.language || taskDetails.language,
          level: taskDetails.content?.cefr_level || taskDetails.level,
          submission_count: 0,
          average_score: 0,
          total_word_count: 0,
          last_submission: submission.created_at
        }
      }
      taskStatsMap[taskId].submission_count += 1
      taskStatsMap[taskId].total_word_count += Number(submission.word_count) || 0
    })

    // Calculate average scores for each task
    Object.keys(taskStatsMap).forEach(taskId => {
      const taskSubmissions = submissions.filter(s => s.task_id === taskId)
      taskStatsMap[taskId].average_score = taskSubmissions.reduce((sum, s) =>
        sum + (Number(s.total_score) || 0), 0) / taskSubmissions.length
    })

    const taskStats = Object.values(taskStatsMap).sort((a: any, b: any) =>
      b.submission_count - a.submission_count
    )

    // Analyze grammar error patterns
    const errorsByCategory: Record<string, number> = {}
    grammarErrors?.forEach(error => {
      const category = error.grammar_category || 'Other'
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1
    })

    const errorPatterns = Object.entries(errorsByCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      stats: {
        totalSubmissions,
        averageTotalScore,
        averageTaskCompletion,
        averageCoherenceCohesion,
        averageVocabulary,
        averageGrammarAccuracy,
        averageFormat,
        averageWordCount,
        totalGrammarErrors,
        lastSubmissionDate,
        trend: {
          direction: trendDirection,
          percentage: Math.abs(Math.round(trendPercentage))
        }
      },
      submissions,
      grammarErrors: grammarErrors || [],
      taskStats,
      errorPatterns,
      success: true
    })
  } catch (error) {
    console.error('Error in writing dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
