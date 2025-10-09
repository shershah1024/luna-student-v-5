/**
 * Chatbot Dashboard API
 * Fetches all chatbot conversation data for a user:
 * - Conversation logs grouped by conversation_id
 * - Task details (topic, language, level)
 * - Statistics and activity metrics
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ConversationLog {
  id: string
  task_id: string
  user_id: string
  conversation_id: string
  turn_index: number
  role: string
  message: string
  payload: any
  created_at: string
}

interface TaskDetails {
  task_id: string
  title: string
  task_type: string
  language: string
  level: string
  content: any
  settings: any
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all conversation logs for the user
    const { data: conversationLogs, error: logsError } = await supabase
      .from('task_conversation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching conversation logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch conversation logs' },
        { status: 500 }
      )
    }

    // Get unique task IDs
    const taskIds = [...new Set(conversationLogs?.map(log => log.task_id) || [])]

    if (taskIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalConversations: 0,
          totalMessages: 0,
          averageMessagesPerConversation: 0,
          uniqueTopics: 0,
          lastConversationDate: null
        },
        conversations: [],
        taskStats: [],
        success: true
      })
    }

    // Fetch task details
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, task_type, language, level')
      .in('id', taskIds)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    }

    // Fetch chatbot task details
    const { data: chatbotTasks, error: chatbotError } = await supabase
      .from('chatbot_tasks')
      .select('task_id, content, settings')
      .in('task_id', taskIds)

    if (chatbotError) {
      console.error('Error fetching chatbot tasks:', chatbotError)
    }

    // Create a map of task details
    const taskDetailsMap: Record<string, any> = {}
    tasks?.forEach(task => {
      const chatbotTask = chatbotTasks?.find(ct => ct.task_id === task.id)
      taskDetailsMap[task.id] = {
        ...task,
        content: chatbotTask?.content || {},
        settings: chatbotTask?.settings || {}
      }
    })

    // Group logs by conversation_id
    const conversationMap: Record<string, ConversationLog[]> = {}
    conversationLogs?.forEach(log => {
      if (!conversationMap[log.conversation_id]) {
        conversationMap[log.conversation_id] = []
      }
      conversationMap[log.conversation_id].push(log)
    })

    // Build conversation objects
    const conversations = Object.entries(conversationMap).map(([conversationId, logs]) => {
      // Sort logs by turn_index
      const sortedLogs = logs.sort((a, b) => (a.turn_index || 0) - (b.turn_index || 0))
      const firstLog = sortedLogs[0]
      const lastLog = sortedLogs[sortedLogs.length - 1]
      const taskDetails = taskDetailsMap[firstLog.task_id] || {}

      return {
        conversation_id: conversationId,
        task_id: firstLog.task_id,
        task_title: taskDetails.title || 'Untitled',
        topic: taskDetails.content?.topic || taskDetails.settings?.topic || 'Unknown',
        language: taskDetails.content?.language || taskDetails.settings?.language || taskDetails.language,
        level: taskDetails.content?.cefr_level || taskDetails.settings?.difficulty_level || taskDetails.level,
        message_count: sortedLogs.length,
        messages: sortedLogs.map(log => ({
          id: log.id,
          role: log.role,
          message: log.message,
          turn_index: log.turn_index,
          created_at: log.created_at
        })),
        started_at: firstLog.created_at,
        last_message_at: lastLog.created_at
      }
    }).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

    // Calculate statistics
    const totalConversations = conversations.length
    const totalMessages = conversationLogs?.length || 0
    const averageMessagesPerConversation = totalConversations > 0
      ? Math.round(totalMessages / totalConversations)
      : 0

    const uniqueTopics = new Set(conversations.map(c => c.topic)).size
    const lastConversationDate = conversations.length > 0 ? conversations[0].started_at : null

    // Group by task for task stats
    const taskStatsMap: Record<string, any> = {}
    conversations.forEach(conv => {
      if (!taskStatsMap[conv.task_id]) {
        taskStatsMap[conv.task_id] = {
          task_id: conv.task_id,
          title: conv.task_title,
          topic: conv.topic,
          language: conv.language,
          level: conv.level,
          conversation_count: 0,
          total_messages: 0,
          last_conversation: conv.started_at
        }
      }
      taskStatsMap[conv.task_id].conversation_count += 1
      taskStatsMap[conv.task_id].total_messages += conv.message_count
    })

    const taskStats = Object.values(taskStatsMap).sort((a: any, b: any) =>
      b.conversation_count - a.conversation_count
    )

    return NextResponse.json({
      stats: {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation,
        uniqueTopics,
        lastConversationDate
      },
      conversations,
      taskStats,
      success: true
    })
  } catch (error) {
    console.error('Error in chatbot dashboard API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
