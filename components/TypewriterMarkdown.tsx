'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import remarkGfm from 'remark-gfm'

// Dynamically import react-markdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

interface TypewriterMarkdownProps {
  text: string
  speed?: number
}

export function TypewriterMarkdown({ text, speed = 30 }: TypewriterMarkdownProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  
  // Reset when text changes
  useEffect(() => {
    setCurrentIndex(0)
    setIsTyping(true)
  }, [text])
  
  // Typewriter effect
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, speed)
      
      return () => clearTimeout(timeout)
    } else {
      setIsTyping(false)
    }
  }, [currentIndex, text, speed])
  
  // Always render the markdown, but only show the portion that's been "typed"
  const visibleText = text.slice(0, currentIndex)
  
  return (
    <div className="markdown-content relative">
      <div className={isTyping ? 'opacity-0 absolute' : 'opacity-100'}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text as any}</ReactMarkdown>
      </div>
      
      {isTyping && (
        <div className="relative">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{visibleText as any}</ReactMarkdown>
          <span className="animate-pulse inline-block ml-1">|</span>
        </div>
      )}
    </div>
  )
}
