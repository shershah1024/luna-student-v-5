'use client'

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, PenLine } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChatBoxProps {
  className?: string
  height?: string
  assignmentId?: string
}

type Message = {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'draft' | 'response'
  created_at?: string
}

interface TypewriterTextProps {
  text: string
  scrollRef: React.RefObject<HTMLDivElement>
  onTypingComplete?: () => void
}

function TypewriterText({ text, scrollRef, onTypingComplete }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      } else {
        clearInterval(timer)
        onTypingComplete?.()
      }
    }, 20)

    return () => clearInterval(timer)
  }, [text, onTypingComplete])

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>
        {displayText || ' '}
      </ReactMarkdown>
    </div>
  )
}

export default function Component({ 
  className = "", 
  height = "h-[600px]",
  assignmentId
}: ChatBoxProps) {
  const [messages, setMessages] = useState<(Message & { isNew?: boolean })[]>([])
  const [sessionId] = useState(() => uuidv4())
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAutoScrollEnabled = useRef(true)
  const lastScrollPosition = useRef(0)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      const isScrolledToBottom = scrollHeight - (scrollTop + clientHeight) < 100
      isAutoScrollEnabled.current = isScrolledToBottom
      lastScrollPosition.current = scrollTop
    }
  }

  useEffect(() => {
    if (!assignmentId) {
      console.warn('No assignmentId provided to ChatBox');
      setMessages([{
        id: uuidv4(),
        role: 'system',
        content: 'Chat not available: Missing assignment configuration.',
        isNew: false
      }]);
      return;
    }
    
    // Set default welcome message from Luna
    setMessages([
      {
        id: uuidv4(),
        role: 'assistant',
        content: "Hallo! Ich bin Luna, deine Schreib Tutorin. 😊 Lass uns mit deiner Schreibaufgabe beginnen! Lies dir die Anweisungen für dieses Assignment durch und teile dann deinen ersten Entwurf oder deine Gedanken mit mir. Ich bin hier, um dir zu helfen.",
        type: 'response',
        created_at: new Date().toISOString(),
        isNew: false
      }
    ]);
  }, [assignmentId])

  const handleSubmit = async (userMessage: string) => {
    if (!userMessage.trim() || !assignmentId) return
    
    const newMessage: Message & { isNew: boolean } = {
      role: 'user',
      content: userMessage,
      type: userMessage.length > 100 ? 'draft' : 'response',
      created_at: new Date().toISOString(),
      isNew: true
    }
    
    setMessages(prev => [...prev, newMessage])
    setInput('')
    
    try {
      console.group('Writing Tutor Interaction')
      
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        type: msg.type,
        created_at: msg.created_at
      }))

      const response = await fetch('/api/writing-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...conversationHistory, {
            role: newMessage.role,
            content: newMessage.content,
            type: newMessage.type,
            created_at: newMessage.created_at
          }],
          assignmentId,
        }),
      })

      if (!response.ok) throw new Error('API request failed')

      const data = await response.json()
      
      const assistantMessage: Message & { isNew: boolean } = {
        role: 'assistant',
        content: data.text,
        type: 'response',
        created_at: new Date().toISOString(),
        isNew: true
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(true)
      
      for (let i = 0; i <= assistantMessage.content.length; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10))
      }
      
      setIsTyping(false)
      scrollToBottom()

    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Sorry, there was an error processing your message.',
        type: 'response',
        isNew: false
      }])
    } finally {
      console.groupEnd()
    }
  }

  useEffect(() => {
    const scrollElement = scrollAreaRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollAreaRef.current
    if (!scrollElement) return

    const observer = new MutationObserver(() => {
      if (isAutoScrollEnabled.current) {
        scrollToBottom()
      }
    })

    observer.observe(scrollElement, {
      childList: true,
      subtree: true,
      characterData: true
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    scrollToBottom('instant' as ScrollBehavior)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(input)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className={`rounded-xl border-2 border-primary/10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 shadow-lg ${className} ${height} flex flex-col overflow-hidden relative w-full`}>
      <div className="absolute inset-0 bg-[url('/chat-pattern.svg')] opacity-5 pointer-events-none" />
      
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 sm:p-4 flex items-center justify-between">
        <h2 className="text-md sm:text-lg font-bold text-white font-display flex items-center gap-2">
          <PenLine className="h-5 w-5 sm:h-6 sm:w-6" />
          Writing with Luna
        </h2>
        <Sparkles className="text-yellow-300 h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />
      </header>
  
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-2 sm:p-3" onScroll={handleScroll}>
        <div className="space-y-3 sm:space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start space-x-1 sm:space-x-2 mb-3 sm:mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500">
                    <AvatarImage src="/luna-avatar.png" alt="Luna" />
                    <AvatarFallback>F</AvatarFallback>
                  </Avatar>
                )}
                
                <motion.div
                  layout
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={`max-w-[80%] sm:max-w-[85%] rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-md ${
                    message.role === 'user'
                      ? message.type === 'draft'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.role === 'assistant' && message.isNew ? (
                    <TypewriterText 
                      text={message.content} 
                      scrollRef={scrollAreaRef}
                      onTypingComplete={() => scrollToBottom()}
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
    
                {message.role === 'user' && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
  
      <div className="border-t border-primary/10 p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-end space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your draft or respond..."
            className="flex-1 min-h-[48px] sm:min-h-[60px] max-h-[120px] sm:max-h-[180px] resize-none bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-primary/20 focus:border-primary text-sm sm:text-base p-2 sm:p-2.5 rounded-lg sm:rounded-md"
            rows={1}
            disabled={isTyping || !assignmentId}
          />
          <Button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || isTyping || !assignmentId}
            size="icon"
            className="rounded-full h-9 w-9 sm:h-10 sm:w-10 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
