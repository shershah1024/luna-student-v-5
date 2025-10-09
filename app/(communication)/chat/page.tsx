'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart } from 'ai';
import { Send, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'luna';
  isNew?: boolean;
}

const TypewriterText = ({ text, isUserMessage }: { text: string, isUserMessage?: boolean }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 20)

      return () => clearTimeout(timeout)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, text])

  if (isComplete) {
    return (
      <div className={`prose max-w-none prose-sm ${
          isUserMessage
            ? 'prose-invert !text-white prose-p:!text-white prose-a:!text-white prose-headings:!text-white prose-strong:!text-white prose-code:!text-white'
            : 'text-[#2D3748]'
        } prose-p:leading-relaxed prose-pre:p-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0`}>
        <ReactMarkdown>
          {text}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <span className={isUserMessage ? 'text-white' : 'text-[#2D3748]'}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

const Message = ({ message }: { message: Message }) => {
  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          message.sender === 'user' 
            ? 'bg-[#2D3748] text-white' 
            : 'bg-[#EFEAE6] text-[#2D3748]'
        }`}
      >
        {message.isNew ? (
          <TypewriterText text={message.text} isUserMessage={message.sender === 'user'} />
        ) : (
          <div className={`prose max-w-none prose-sm ${
              message.sender === 'user'
                ? 'prose-invert !text-white prose-p:!text-white prose-a:!text-white prose-headings:!text-white prose-strong:!text-white prose-code:!text-white'
                : 'text-[#2D3748]'
            } prose-p:leading-relaxed prose-pre:bg-transparent prose-p:my-1 prose-ul:my-1 prose-li:my-0.5`}>
            <ReactMarkdown>
              {message.text}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

function ChatPageContent() {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignment_id');
  const { user } = useUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  
  // Use the new AI SDK 5 useChat hook - must be called before any conditional returns
  const chatId = assignmentId || uuidv4();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    initialMessages: [
      {
        id: uuidv4(),
        role: 'assistant',
        parts: [{ type: 'text', text: "Hi! I'm ready to help with your assignment. Let's get started!" }]
      }
    ],
  });


  // Manual input state management (required in AI SDK 5.0)
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Convert AI messages to display messages
  const displayMessages: Message[] = messages.map((msg, index) => {
    let text = '';
    if (msg.parts) {
      // Extract text from parts array
      text = msg.parts
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('');
    } else if (msg.content) {
      // Fallback for content field
      text = msg.content;
    }
    
    return {
      id: index + 1,
      text,
      sender: msg.role === 'user' ? 'user' : 'luna',
      isNew: false
    };
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [displayMessages]);

  // Redirect to sign in if not authenticated (this page requires auth for assignment access)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center pt-20">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#2D3748] mb-4">Authentication Required</h1>
          <p className="text-[#4A5568] mb-6">Please sign in to access assignment chats.</p>
          <SignInButton>
            <button className="bg-[#2D3748] text-white px-4 py-2 rounded-lg hover:bg-[#1F2937] transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input && input.trim()) {
      const message = input.trim();
      setInput('');
      try {
        await sendMessage({ text: message });
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && input && input.trim()) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col pt-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E4E1] bg-white">
        <h1 className="text-[#2D3748] font-medium text-xl">Chat Session</h1>
        {assignmentId && (
          <p className="text-[#4A5568] text-sm">Assignment ID: {assignmentId}</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth" ref={scrollAreaRef}>
        <div className="max-w-4xl mx-auto space-y-4">
          {displayMessages.map((message) => (
            <div key={message.id} className="message">
              <Message message={message} />
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E8E4E1] p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => console.log('Recording not yet implemented')}
                className={`p-2 rounded-lg ${
                  isRecording 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'hover:bg-[#EFEAE6] text-[#4A5568]'
                } transition-colors`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-lg border border-[#E8E4E1] focus:outline-none focus:border-[#2D3748] text-[#2D3748] placeholder-[#4A5568] bg-white"
              />
              <button
                type="submit"
                disabled={status === 'streaming' || !input.trim()}
                className="p-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#1F2937] transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3748] mx-auto mb-4"></div>
          <p className="text-[#4A5568]">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}