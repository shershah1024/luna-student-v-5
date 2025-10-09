/**
 * Pronunciation Dashboard API
 * Fetches all pronunciation practice data for a user:
 * - Word-level pronunciation scores
 * - Practice session statistics
 * - Progress over time by theme/difficulty
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

    // Fetch pronunciation scores
    const { data: pronunciationScores, error: scoresError } = await supabase
      .from('pronunciation_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (scoresError) {
      console.error('Error fetching pronunciation scores:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch pronunciation scores' },
        { status: 500 }
      )
    }

    if (!pronunciationScores || pronunciationScores.length === 0) {
      return NextResponse.json({
        stats: {
          totalSessions: 0,
          totalWords: 0,
          averageScore: 0,
          lastPracticeDate: null
        },
        practiceSessions: [],
        themeStats: [],
        success: true
      })
    }

    // Get unique task IDs
    const taskIds = [...new Set(pronunciationScores.map(score => score.task_id))]

    // Fetch task details
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, task_type, language, level')
      .in('id', taskIds)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    }

    // Fetch pronunciation task details
    const { data: pronunciationTasks, error: pronunciationTasksError } = await supabase
      .from('pronunciation_tasks')
      .select('task_id, content, settings')
      .in('task_id', taskIds)

    if (pronunciationTasksError) {
      console.error('Error fetching pronunciation tasks:', pronunciationTasksError)
    }

    // Create task details map
    const taskDetailsMap: Record<string, any> = {}
    tasks?.forEach(task => {
      const pronunciationTask = pronunciationTasks?.find(pt => pt.task_id === task.id)
      taskDetailsMap[task.id] = {
        ...task,
        content: pronunciationTask?.content || {},
        settings: pronunciationTask?.settings || {}
      }
    })

    // Group scores by task_id and attempt_id to create practice sessions
    const sessionMap: Record<string, any[]> = {}
    pronunciationScores.forEach(score => {
      const key = `${score.task_id}-${score.attempt_id}`
      if (!sessionMap[key]) {
        sessionMap[key] = []
      }
      sessionMap[key].push(score)
    })

    // Build practice session objects
    const practiceSessions = Object.entries(sessionMap).map(([key, scores]) => {
      const [taskId, attemptId] = key.split('-')
      const taskDetails = taskDetailsMap[taskId] || {}

      // Calculate statistics for this session
      const totalWords = scores.length
      const averageScore = totalWords > 0
        ? scores.reduce((sum, s) => sum + (Number(s.pronunciation_score) || 0), 0) / totalWords
        : 0

      // Get session date (use first score's created_at)
      const sessionDate = scores[0]?.created_at

      return {
        task_id: taskId,
        attempt_id: attemptId,
        task_title: taskDetails.title || 'Untitled Practice',
        theme: taskDetails.settings?.theme || taskDetails.content?.theme || 'General',
        language: taskDetails.settings?.language || taskDetails.language,
        level: taskDetails.settings?.difficulty_level || taskDetails.level,
        total_words: totalWords,
        average_score: averageScore,
        session_date: sessionDate,
        words: scores.sort((a, b) => {
          // Sort by word if available, otherwise by created_at
          if (a.word && b.word) {
            return a.word.localeCompare(b.word)
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      }
    }).sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())

    // Calculate overall statistics
    const totalSessions = practiceSessions.length
    const totalWords = pronunciationScores.length
    const averageScore = pronunciationScores.length > 0
      ? pronunciationScores.reduce((sum, s) => sum + (Number(s.pronunciation_score) || 0), 0) / pronunciationScores.length
      : 0
    const lastPracticeDate = practiceSessions.length > 0 ? practiceSessions[0].session_date : null

    // Analyze by theme
    const themeStatsMap: Record<string, any> = {}

    practiceSessions.forEach(session => {
      const theme = session.theme
      if (!themeStatsMap[theme]) {
        themeStatsMap[theme] = {
          theme,
          session_count: 0,
          total_words: 0,
          average_score: 0,
          scores_sum: 0,
          last_practiced: session.session_date
        }
      }
      themeStatsMap[theme].session_count += 1
      themeStatsMap[theme].total_words += session.total_words
      themeStatsMap[theme].scores_sum += session.average_score * session.total_words
    })

    // Calculate average score for each theme
    Object.keys(themeStatsMap).forEach(theme => {
      const stat = themeStatsMap[theme]
      stat.average_score = stat.total_words > 0
        ? stat.scores_sum / stat.total_words
        : 0
      delete stat.scores_sum // Remove temporary field
    })

    const themeStats = Object.values(themeStatsMap).sort((a: any, b: any) =>
      b.session_count - a.session_count
    )

    return NextResponse.json({
      stats: {
        totalSessions,
        totalWords,
        averageScore,
        lastPracticeDate
      },
      practiceSessions,
      themeStats,
      success: true
    })
  } catch (error) {
    console.error('Error in pronunciation dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
