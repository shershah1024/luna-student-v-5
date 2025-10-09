/**
 * Chatbot/Roleplay Dashboard
 * Shows all chatbot conversations and practice activity
 */

'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Calendar,
  ChevronRight,
  User,
  Bot,
  Globe,
  Target
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface ChatbotStats {
  totalConversations: number
  totalMessages: number
  averageMessagesPerConversation: number
  uniqueTopics: number
  lastConversationDate: string | null
}

interface Message {
  id: string
  role: string
  message: string
  turn_index: number
  created_at: string
}

interface Conversation {
  conversation_id: string
  task_id: string
  task_title: string
  topic: string
  language: string
  level: string
  message_count: number
  messages: Message[]
  started_at: string
  last_message_at: string
}

interface TaskStats {
  task_id: string
  title: string
  topic: string
  language: string
  level: string
  conversation_count: number
  total_messages: number
  last_conversation: string
}

export default function ChatbotDashboard() {
  const { isLoaded, isSignedIn } = useUser()
  const [data, setData] = useState<{
    stats: ChatbotStats
    conversations: Conversation[]
    taskStats: TaskStats[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    fetchDashboardData()
  }, [isLoaded, isSignedIn])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/chatbot')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      setData({
        stats: result.stats,
        conversations: result.conversations,
        taskStats: result.taskStats
      })
    } catch (err) {
      console.error('Error fetching chatbot dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your conversations...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f5f2e8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || 'Failed to load data'}</p>
        </div>
      </div>
    )
  }

  const { stats, conversations, taskStats } = data

  return (
    <div className="min-h-screen bg-[#f5f2e8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chatbot Conversations</h1>
          <p className="text-gray-600">Track your chatbot practice sessions and conversations</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Conversations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Conversations</CardTitle>
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
            </CardContent>
          </Card>

          {/* Total Messages */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
            </CardContent>
          </Card>

          {/* Avg Messages */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg per Conversation</CardTitle>
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.averageMessagesPerConversation}</p>
            </CardContent>
          </Card>

          {/* Unique Topics */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Unique Topics</CardTitle>
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.uniqueTopics}</p>
            </CardContent>
          </Card>
        </div>

        {/* Most Practiced Topics */}
        {taskStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Practiced Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskStats.slice(0, 6).map((task) => (
                <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{task.topic}</p>
                      </div>
                      <Badge variant="outline">{task.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{task.conversation_count} conversations</p>
                        <p className="text-sm text-gray-500">{task.total_messages} total messages</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        {task.language}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Conversations */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Conversations</h2>

          {conversations.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 mb-6">
                Start a chatbot conversation to see your practice sessions here!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const formattedDate = new Date(conversation.started_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                // Get first user and assistant messages for preview
                const firstUserMessage = conversation.messages.find(m => m.role === 'user')
                const firstAssistantMessage = conversation.messages.find(m => m.role === 'assistant')

                return (
                  <Card key={conversation.conversation_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Date */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {conversation.task_title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {conversation.level}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                              {conversation.language}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{conversation.topic}</span>
                            <span>•</span>
                            <span>{conversation.message_count} messages</span>
                          </div>

                          {/* Conversation Preview */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                            {firstAssistantMessage && (
                              <div className="flex gap-2 items-start">
                                <Bot className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                <p className="text-sm text-gray-700 line-clamp-1">
                                  {firstAssistantMessage.message}
                                </p>
                              </div>
                            )}
                            {firstUserMessage && (
                              <div className="flex gap-2 items-start">
                                <User className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                                <p className="text-sm text-gray-700 line-clamp-1">
                                  {firstUserMessage.message}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConversation(conversation)}
                            className="mt-2"
                          >
                            View Full Conversation
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Conversation Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="max-w-4xl w-full my-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedConversation.task_title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedConversation.started_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedConversation.level}</Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                        {selectedConversation.language}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {selectedConversation.topic}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedConversation.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 max-w-[70%] ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
