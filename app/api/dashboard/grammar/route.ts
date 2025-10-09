/**
 * Grammar Dashboard API
 * Fetches all grammar quiz data for a user:
 * - Grammar quiz attempts with accuracy scores
 * - Question-level performance
 * - Statistics and trends by grammar topic
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

    // Fetch grammar scores (all question answers)
    const { data: grammarScores, error: scoresError } = await supabase
      .from('grammar_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (scoresError) {
      console.error('Error fetching grammar scores:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch grammar scores' },
        { status: 500 }
      )
    }

    if (!grammarScores || grammarScores.length === 0) {
      return NextResponse.json({
        stats: {
          totalQuizzes: 0,
          totalQuestions: 0,
          overallAccuracy: 0,
          averageScore: 0,
          lastQuizDate: null
        },
        quizAttempts: [],
        topicStats: [],
        success: true
      })
    }

    // Get unique task IDs
    const taskIds = [...new Set(grammarScores.map(score => score.task_id))]

    // Fetch task details
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, task_type, language, level')
      .in('id', taskIds)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    }

    // Fetch grammar task details
    const { data: grammarTasks, error: grammarTasksError } = await supabase
      .from('grammar_tasks')
      .select('task_id, content, settings')
      .in('task_id', taskIds)

    if (grammarTasksError) {
      console.error('Error fetching grammar tasks:', grammarTasksError)
    }

    // Create task details map
    const taskDetailsMap: Record<string, any> = {}
    tasks?.forEach(task => {
      const grammarTask = grammarTasks?.find(gt => gt.task_id === task.id)
      taskDetailsMap[task.id] = {
        ...task,
        content: grammarTask?.content || {},
        settings: grammarTask?.settings || {}
      }
    })

    // Group scores by task_id and attempt_number to create quiz attempts
    const attemptMap: Record<string, any[]> = {}
    grammarScores.forEach(score => {
      const key = `${score.task_id}-${score.attempt_number}`
      if (!attemptMap[key]) {
        attemptMap[key] = []
      }
      attemptMap[key].push(score)
    })

    // Build quiz attempt objects
    const quizAttempts = Object.entries(attemptMap).map(([key, scores]) => {
      const [taskId, attemptNumber] = key.split('-')
      const taskDetails = taskDetailsMap[taskId] || {}

      // Calculate statistics for this attempt
      const totalQuestions = scores.length
      const correctAnswers = scores.filter(s => s.is_correct).length
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
      const totalPoints = scores.reduce((sum, s) => sum + (Number(s.points_earned) || 0), 0)
      const maxPoints = scores.reduce((sum, s) => sum + (Number(s.max_points) || 0), 0)
      const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0

      // Get first score's created_at as quiz date
      const quizDate = scores[0]?.created_at

      return {
        task_id: taskId,
        attempt_number: Number(attemptNumber),
        task_title: taskDetails.title || 'Untitled Quiz',
        grammar_topics: taskDetails.settings?.grammar_topics || [],
        language: taskDetails.settings?.language || taskDetails.language,
        level: taskDetails.settings?.level || taskDetails.level,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        incorrect_answers: totalQuestions - correctAnswers,
        accuracy: accuracy,
        total_points: totalPoints,
        max_points: maxPoints,
        percentage: percentage,
        quiz_date: quizDate,
        questions: scores.sort((a, b) => a.question_number - b.question_number)
      }
    }).sort((a, b) => new Date(b.quiz_date).getTime() - new Date(a.quiz_date).getTime())

    // Calculate overall statistics
    const totalQuizzes = quizAttempts.length
    const totalQuestions = grammarScores.length
    const totalCorrect = grammarScores.filter(s => s.is_correct).length
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0
    const averageScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, q) => sum + q.percentage, 0) / quizAttempts.length
      : 0
    const lastQuizDate = quizAttempts.length > 0 ? quizAttempts[0].quiz_date : null

    // Analyze by grammar topic
    const topicStatsMap: Record<string, any> = {}

    quizAttempts.forEach(attempt => {
      attempt.grammar_topics.forEach((topic: string) => {
        if (!topicStatsMap[topic]) {
          topicStatsMap[topic] = {
            topic,
            quiz_count: 0,
            total_questions: 0,
            total_correct: 0,
            average_accuracy: 0,
            last_practiced: attempt.quiz_date
          }
        }
        topicStatsMap[topic].quiz_count += 1
        topicStatsMap[topic].total_questions += attempt.total_questions
        topicStatsMap[topic].total_correct += attempt.correct_answers
      })
    })

    // Calculate average accuracy for each topic
    Object.keys(topicStatsMap).forEach(topic => {
      const stat = topicStatsMap[topic]
      stat.average_accuracy = stat.total_questions > 0
        ? (stat.total_correct / stat.total_questions) * 100
        : 0
    })

    const topicStats = Object.values(topicStatsMap).sort((a: any, b: any) =>
      b.quiz_count - a.quiz_count
    )

    return NextResponse.json({
      stats: {
        totalQuizzes,
        totalQuestions,
        overallAccuracy,
        averageScore,
        lastQuizDate
      },
      quizAttempts,
      topicStats,
      success: true
    })
  } catch (error) {
    console.error('Error in grammar dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
