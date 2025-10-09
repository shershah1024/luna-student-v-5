/**
 * Speaking Dashboard API
 * Fetches all speaking-related data for a user:
 * - Speaking evaluations with scores
 * - Pronunciation scores
 * - Conversation history
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

    // Fetch speaking evaluations
    const { data: speakingScores, error: speakingError } = await supabase
      .from('lesson_speaking_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (speakingError) {
      console.error('Error fetching speaking scores:', speakingError)
      return NextResponse.json(
        { error: 'Failed to fetch speaking scores' },
        { status: 500 }
      )
    }

    // Fetch task instructions separately
    const taskIds = speakingScores?.map(s => s.task_id) || []
    const { data: taskInstructions, error: taskError } = await supabase
      .from('lesson_speaking_instructions')
      .select('*')
      .in('task_id', taskIds)

    if (taskError) {
      console.error('Error fetching task instructions:', taskError)
    }

    // Create a map of task instructions by task_id
    const taskInstructionsMap: Record<string, any> = {}
    taskInstructions?.forEach(task => {
      taskInstructionsMap[task.task_id] = task
    })

    // Attach task instructions to speaking scores
    const scoresWithInstructions = speakingScores?.map(score => ({
      ...score,
      task_instructions: taskInstructionsMap[score.task_id] || null
    }))

    // Fetch pronunciation scores
    const { data: pronunciationScores, error: pronError } = await supabase
      .from('pronunciation_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (pronError) {
      console.error('Error fetching pronunciation scores:', pronError)
    }

    // Fetch speaking conversation logs
    const { data: speakingLogs, error: logsError } = await supabase
      .from('speaking_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (logsError) {
      console.error('Error fetching speaking logs:', logsError)
    }

    // Calculate statistics
    const scores = scoresWithInstructions || []
    const pronunciation = pronunciationScores || []

    const stats = {
      totalConversations: scores.length,
      totalPronunciationAttempts: pronunciation.length,

      // Speaking scores
      averageTotalScore: scores.length > 0
        ? scores.reduce((sum, s) => sum + (Number(s.total_score) || 0), 0) / scores.length
        : 0,
      averageGrammarVocabScore: scores.length > 0
        ? scores.reduce((sum, s) => sum + (Number(s.grammar_vocabulary_score) || 0), 0) / scores.length
        : 0,
      averageCommunicationScore: scores.length > 0
        ? scores.reduce((sum, s) => sum + (Number(s.communication_score) || 0), 0) / scores.length
        : 0,

      // Pronunciation
      averagePronunciationScore: pronunciation.length > 0
        ? pronunciation.reduce((sum, p) => sum + (Number(p.pronunciation_score) || 0), 0) / pronunciation.length
        : 0,

      // Recent activity
      lastConversationDate: scores.length > 0 ? scores[0].created_at : null,

      // Trends (compare last 5 vs previous 5)
      recentAverageScore: scores.slice(0, 5).length > 0
        ? scores.slice(0, 5).reduce((sum, s) => sum + (Number(s.total_score) || 0), 0) / scores.slice(0, 5).length
        : 0,
      previousAverageScore: scores.slice(5, 10).length > 0
        ? scores.slice(5, 10).reduce((sum, s) => sum + (Number(s.total_score) || 0), 0) / scores.slice(5, 10).length
        : 0,
    }

    // Calculate trend direction
    const trendDirection = stats.recentAverageScore > stats.previousAverageScore ? 'up' :
                          stats.recentAverageScore < stats.previousAverageScore ? 'down' : 'stable'

    const trendPercentage = stats.previousAverageScore > 0
      ? ((stats.recentAverageScore - stats.previousAverageScore) / stats.previousAverageScore * 100)
      : 0

    // Group conversations by task
    const conversationsByTask: Record<string, any[]> = {}
    scores.forEach(score => {
      const taskId = score.task_id
      if (!conversationsByTask[taskId]) {
        conversationsByTask[taskId] = []
      }
      conversationsByTask[taskId].push(score)
    })

    const taskStats = Object.entries(conversationsByTask).map(([taskId, conversations]) => {
      const taskInfo = conversations[0].task_instructions || {}
      return {
        taskId,
        title: taskInfo.lesson_title || 'Untitled',
        topic: taskInfo.topic,
        level: taskInfo.level,
        conversationCount: conversations.length,
        averageScore: conversations.reduce((sum, c) => sum + (Number(c.total_score) || 0), 0) / conversations.length,
        lastAttempt: conversations[0].created_at,
      }
    }).sort((a, b) => b.conversationCount - a.conversationCount)

    return NextResponse.json({
      stats: {
        ...stats,
        trend: {
          direction: trendDirection,
          percentage: Math.abs(Math.round(trendPercentage))
        }
      },
      evaluations: scores,
      pronunciationScores: pronunciation,
      conversationLogs: speakingLogs || [],
      taskStats,
      success: true
    })
  } catch (error) {
    console.error('Error in speaking dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
