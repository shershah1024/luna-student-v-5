/**
 * Listening Dashboard API
 * Fetches all listening test data for a user:
 * - Listening test attempts with accuracy scores
 * - Question-level performance
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

    // Fetch listening scores (all question answers)
    const { data: listeningScores, error: scoresError } = await supabase
      .from('listening_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (scoresError) {
      console.error('Error fetching listening scores:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch listening scores' },
        { status: 500 }
      )
    }

    if (!listeningScores || listeningScores.length === 0) {
      return NextResponse.json({
        stats: {
          totalTests: 0,
          totalQuestions: 0,
          overallAccuracy: 0,
          averageScore: 0,
          lastTestDate: null
        },
        testAttempts: [],
        taskStats: [],
        success: true
      })
    }

    // Get unique task IDs
    const taskIds = [...new Set(listeningScores.map(score => score.task_id))]

    // Fetch task details
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, task_type, language, level')
      .in('id', taskIds)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    }

    // Fetch listening task details
    const { data: listeningTasks, error: listeningTasksError } = await supabase
      .from('listening_tasks')
      .select('task_id, content, settings, audio_url, transcript')
      .in('task_id', taskIds)

    if (listeningTasksError) {
      console.error('Error fetching listening tasks:', listeningTasksError)
    }

    // Create task details map
    const taskDetailsMap: Record<string, any> = {}
    tasks?.forEach(task => {
      const listeningTask = listeningTasks?.find(lt => lt.task_id === task.id)
      taskDetailsMap[task.id] = {
        ...task,
        content: listeningTask?.content || {},
        settings: listeningTask?.settings || {},
        audio_url: listeningTask?.audio_url || null,
        transcript: listeningTask?.transcript || null
      }
    })

    // Group scores by task_id and attempt_number to create test attempts
    const attemptMap: Record<string, any[]> = {}
    listeningScores.forEach(score => {
      const key = `${score.task_id}-${score.attempt_number}`
      if (!attemptMap[key]) {
        attemptMap[key] = []
      }
      attemptMap[key].push(score)
    })

    // Build test attempt objects
    const testAttempts = Object.entries(attemptMap).map(([key, scores]) => {
      const [taskId, attemptNumber] = key.split('-')
      const taskDetails = taskDetailsMap[taskId] || {}

      // Calculate statistics for this attempt
      const totalQuestions = scores.length
      const correctAnswers = scores.filter(s => s.is_correct).length
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
      const totalPoints = scores.reduce((sum, s) => sum + (Number(s.points_earned) || 0), 0)
      const maxPoints = scores.reduce((sum, s) => sum + (Number(s.max_points) || 0), 0)
      const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0

      // Get first score's created_at as test date
      const testDate = scores[0]?.created_at

      return {
        task_id: taskId,
        attempt_number: Number(attemptNumber),
        task_title: taskDetails.title || 'Untitled Test',
        topic: taskDetails.content?.title || 'Unknown',
        language: taskDetails.content?.metadata?.language || taskDetails.language,
        level: taskDetails.settings?.listening_instructions?.level || taskDetails.level,
        audio_url: taskDetails.audio_url,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        incorrect_answers: totalQuestions - correctAnswers,
        accuracy: accuracy,
        total_points: totalPoints,
        max_points: maxPoints,
        percentage: percentage,
        test_date: testDate,
        questions: scores.sort((a, b) => a.question_number - b.question_number)
      }
    }).sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())

    // Calculate overall statistics
    const totalTests = testAttempts.length
    const totalQuestions = listeningScores.length
    const totalCorrect = listeningScores.filter(s => s.is_correct).length
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0
    const averageScore = testAttempts.length > 0
      ? testAttempts.reduce((sum, t) => sum + t.percentage, 0) / testAttempts.length
      : 0
    const lastTestDate = testAttempts.length > 0 ? testAttempts[0].test_date : null

    // Group by task for task statistics
    const taskStatsMap: Record<string, any> = {}
    testAttempts.forEach(attempt => {
      if (!taskStatsMap[attempt.task_id]) {
        taskStatsMap[attempt.task_id] = {
          task_id: attempt.task_id,
          title: attempt.task_title,
          topic: attempt.topic,
          language: attempt.language,
          level: attempt.level,
          attempt_count: 0,
          total_questions: 0,
          total_correct: 0,
          average_accuracy: 0,
          last_attempt: attempt.test_date
        }
      }
      taskStatsMap[attempt.task_id].attempt_count += 1
      taskStatsMap[attempt.task_id].total_questions += attempt.total_questions
      taskStatsMap[attempt.task_id].total_correct += attempt.correct_answers
    })

    // Calculate average accuracy for each task
    Object.keys(taskStatsMap).forEach(taskId => {
      const stat = taskStatsMap[taskId]
      stat.average_accuracy = stat.total_questions > 0
        ? (stat.total_correct / stat.total_questions) * 100
        : 0
    })

    const taskStats = Object.values(taskStatsMap).sort((a: any, b: any) =>
      b.attempt_count - a.attempt_count
    )

    return NextResponse.json({
      stats: {
        totalTests,
        totalQuestions,
        overallAccuracy,
        averageScore,
        lastTestDate
      },
      testAttempts,
      taskStats,
      success: true
    })
  } catch (error) {
    console.error('Error in listening dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
