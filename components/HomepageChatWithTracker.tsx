"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Upload, X, Check, RefreshCw, Send, MessageSquare, Sparkles, BookOpen, Globe, Music, Stars, Plus, Youtube, ClipboardList, Mic } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { processFileWithGemini } from '@/app/utils/geminiAi';
import { supabase } from '@/app/utils/supabaseClient';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@clerk/nextjs';

// Types
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'luna';
  isNew?: boolean;
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadItem {
  id: string;
  file: File | null;
  status: UploadStatus;
  error?: string;
  content?: string;
}

// TypewriterText component
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

// Add PreparingIndicator component after TypewriterText
const PreparingIndicator = () => {
  const [dots, setDots] = useState(0);
  const phrases = ['crafting response', 'thinking', 'processing'];
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);

    const phraseInterval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 2000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(phraseInterval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 p-3 bg-[#EFEAE6] rounded-lg">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '-0.3s' }}></span>
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '-0.15s' }}></span>
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
      </div>
      <span className="text-sm text-gray-600 font-medium">{phrases[currentPhrase]}{'.'.repeat(dots)}</span>
    </div>
  );
};

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

// Add after Message component
const UploadProgress = ({ item, onCancel, onFileUpload }: { 
  item: UploadItem | null, 
  onCancel: () => void,
  onFileUpload: (file: File) => void 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileUpload(file);
    }
  };

  const getStageText = (status: UploadStatus) => {
    switch (status) {
      case 'idle': return 'Select a file to begin...';
      case 'uploading': return 'Uploading file...';
      case 'processing': return 'Processing content...';
      case 'success': return 'Upload complete!';
      case 'error': return 'Upload failed';
      default: return 'Select a file to begin...';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#2D3748]">Upload Document</h3>
        <button 
          onClick={onCancel}
          className="text-[#4A5568] hover:text-[#2D3748]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {(!item || item.status === 'idle') ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed border-[#E8E4E1] rounded-lg">
          <Upload className="w-12 h-12 text-[#4A5568]" />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#2D3748] text-white rounded-lg hover:bg-[#1F2937] transition-colors"
          >
            Choose File
          </button>
          <p className="text-sm text-[#4A5568]">
            Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-[#4A5568]">
            <span className="flex items-center gap-2">
              {item.status === 'uploading' && <RefreshCw className="w-4 h-4 animate-spin" />}
              {item.status === 'processing' && <RefreshCw className="w-4 h-4 animate-spin" />}
              {item.status === 'success' && <Check className="w-4 h-4 text-green-500" />}
              {item.status === 'error' && <X className="w-4 h-4 text-red-500" />}
              {getStageText(item.status)}
            </span>
            {item.file && <span>{item.file.name}</span>}
          </div>
          
          {item.status !== 'error' && item.status !== 'success' && (
            <div className="w-full bg-[#E8E4E1] rounded-full h-2">
              <div 
                className="bg-[#2D3748] h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${item.status === 'uploading' ? '40' : 
                          item.status === 'processing' ? '80' : 
                          item.status === 'success' ? '100' : '0'}%` 
                }}
              />
            </div>
          )}

          {item.error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {item.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HomepageChatWithTracker = () => {
  const { user, isSignedIn } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'guest@example.com';
  
  // State for overlay button
  const [showOverlay, setShowOverlay] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: "Hi! I'm Luna, your AI teaching assistant. What kind of assignment would you like to create for your students?", 
      sender: 'luna' 
    },
    {
      id: 2,
      text: "I need a speaking exercise for my A2 German class about daily routines",
      sender: 'user'
    },
    {
      id: 3,
      text: `Perfect! I'll create an engaging speaking exercise for your A2 German students about daily routines. Here's what I've prepared:

**Exercise: Mein Tagesablauf (My Daily Routine)**

**Objectives:**
* Practice present tense verbs for daily activities
* Use time expressions correctly
* Build confidence in describing personal routines

**Part 1: Warm-up Questions (5 minutes)**
Students answer in pairs:
* Um wie viel Uhr stehst du auf? (What time do you get up?)
* Was isst du zum Frühstück? (What do you eat for breakfast?)
* Wie kommst du zur Schule? (How do you get to school?)

**Part 2: Picture Description (10 minutes)**
Students receive cards showing different daily activities and must:
* Describe what they see
* Say when they typically do this activity
* Use at least 3 time expressions (morgens, nachmittags, abends)

**Part 3: Interview Role-play (15 minutes)**
Students interview each other about their ideal day:
* Partner A is a journalist
* Partner B is a celebrity describing their perfect day
* Switch roles after 7 minutes

**Assessment Criteria:**
✓ Pronunciation and fluency (30%)
✓ Vocabulary usage (25%)
✓ Grammar accuracy (25%)
✓ Task completion (20%)

Would you like me to add vocabulary support or modify the difficulty level?`,
      sender: 'luna'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showIndicator, setShowIndicator] = useState(false);
  
  // UI state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Audio state
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const [uploadItem, setUploadItem] = useState<UploadItem | null>(null);

  const [urlInput, setUrlInput] = useState('');
  const [urlProcessingStatus, setUrlProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [urlError, setUrlError] = useState<string | null>(null);

  const [videoInput, setVideoInput] = useState('');
  const [videoProcessingStatus, setVideoProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);

  // Scroll to bottom function with smooth scrolling
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  };

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll on initial load
  useEffect(() => {
    scrollToBottom('instant');
  }, []);

  // Scroll when messages change size (e.g., when markdown renders)
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const observer = new ResizeObserver(() => {
      scrollToBottom();
    });

    const messages = scrollAreaRef.current.querySelectorAll('.message');
    messages.forEach(message => observer.observe(message));

    return () => observer.disconnect();
  }, [messages]);

  // Functions
  const sendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        isNew: true
      };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      
      // Delay showing the indicator by 500ms
      setTimeout(() => {
        setShowIndicator(true);
      }, 500);

      // Send to Azure Chat
      try {
        await sendToAzureChat(newMessage);
      } finally {
        setShowIndicator(false);
      }
    }
  };

  const sendToAzureChat = async (messageText: string, extractedContent?: string, contentInfo?: any) => {
    try {
      const response = await fetch('/api/azure-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: 'user',
              content: messageText
            }
          ],
          user_email: userEmail,
          session_id: uuidv4(),
          instructions: `Use this email for all tool calls: ${userEmail}. Always include this email in the tool_args when making tool calls.`,
          defaultToolArgs: {
            user_email: userEmail
          },
          extractedContent,
          contentInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Azure Chat');
      }

      const data = await response.json();
      
      if (data.error || !data.result) {
        console.error('Azure Chat Error:', data.error || 'No result in response');
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "I encountered an error processing your request. Please try again.",
          sender: 'luna',
          isNew: true
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      const responseText = data.result.text;
      
      const lunaResponse: Message = {
        id: messages.length + 2,
        text: responseText || "I'm having trouble understanding. Could you please try rephrasing your request?",
        sender: 'luna',
        isNew: true
      };
      setMessages(prev => [...prev, lunaResponse]);

    } catch (error) {
      console.error('Error in Azure Chat:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "I'm having trouble processing your request. Please try again in a moment! 🌟",
        sender: 'luna',
        isNew: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await handleAudioSubmit(audioBlob);
        setAudioChunks([]);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && audioStream) {
      mediaRecorder.stop();
      audioStream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
      setAudioStream(null);
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { text } = await response.json();
      if (text) {
        setNewMessage(text);
      }
    } catch (error) {
      console.error('Error submitting audio:', error);
    }
  };

  const handleFileButtonClick = () => {
    setShowUploadModal(true);
    setUploadItem({
      id: uuidv4(),
      file: null,
      status: 'idle'
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !isSignedIn) return;
    
    setUploadItem(prev => prev ? { ...prev, file, status: 'uploading' } : null);

    try {
      // Upload to Supabase
      const fileName = `${uuidv4()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('course_files')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      setUploadItem(prev => prev ? { ...prev, status: 'processing' } : null);

      // Get public URL and process file
      const { data: publicUrlData } = supabase.storage
        .from('course_files')
        .getPublicUrl(fileName);
      const fileUrl = publicUrlData.publicUrl;

      // Extract content
      let extractedContent = '';
      if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name)) {
        const response = await fetch('/api/extract-document-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fileUrl }),
        });
        if (!response.ok) throw new Error('Failed to extract text');
        const { extractedText } = await response.json();
        extractedContent = extractedText;
      } else {
        extractedContent = await processFileWithGemini(file, fileUrl, uuidv4(), "Extract the content from this file");
      }

      setUploadItem(prev => prev ? { ...prev, status: 'success' } : null);

      // Keep modal open briefly to show success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close modal
      setShowUploadModal(false);
      setUploadItem(null);

      // Add messages
      const userMessage: Message = {
        id: messages.length + 1,
        text: `Uploaded: ${file.name}`,
        sender: 'user',
        isNew: true
      };
      setMessages(prev => [...prev, userMessage]);

      // Prepare file info
      const fileInfo = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        url: fileUrl,
        mime_type: file.type || 'application/octet-stream'
      };

      // Process with Azure Chat including file info
      await sendToAzureChat(
        `I've uploaded a document titled "${file.name}". Here's what it contains:\n\n${extractedContent}\n\nWhat kind of learning activity would you like to create with this content?`,
        extractedContent,
        fileInfo
      );

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadItem(prev => prev ? { 
        ...prev, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process file'
      } : null);

      // Add error message to chat
      const errorMessage: Message = {
        id: messages.length + 1,
        text: `Sorry, I encountered an error processing your file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'luna',
        isNew: true
      };
      setMessages(prev => [...prev, errorMessage]);

      // Wait a bit before closing the modal on error
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadItem(null);
      }, 3000);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setUrlProcessingStatus('processing');
    setUrlError(null);

    try {
      // Extract and summarize URL content
      const response = await fetch('/api/extract-url-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to process URL');
      }

      const { extractedText, summary, metadata } = await response.json();

      // Close modal
      setShowUrlModal(false);
      setUrlProcessingStatus('success');

      // Add messages
      const userMessage: Message = {
        id: messages.length + 1,
        text: `Shared URL: ${urlInput}`,
        sender: 'user',
        isNew: true
      };
      setMessages(prev => [...prev, userMessage]);

      // Prepare URL info
      const urlInfo = {
        url: urlInput,
        type: 'url',
        extracted_length: metadata.contentLength,
        timestamp: metadata.timestamp
      };

      // Process with Azure Chat including URL info
      await sendToAzureChat(
        `I've shared this URL: "${urlInput}". Here's what it contains:\n\n${extractedText}\n\nWhat kind of learning activity would you like to create with this content?`,
        extractedText,
        urlInfo
      );

    } catch (error) {
      console.error('Error processing URL:', error);
      setUrlProcessingStatus('error');
      setUrlError(error instanceof Error ? error.message : 'Failed to process URL');

      // Add error message to chat if modal is closed with error
      const errorMessage: Message = {
        id: messages.length + 1,
        text: `Sorry, I encountered an error processing your URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'luna',
        isNew: true
      };
      setMessages(prev => [...prev, errorMessage]);

      // Wait a bit before closing the modal on error
      setTimeout(() => {
        setShowUrlModal(false);
        setUrlInput('');
        setUrlProcessingStatus('idle');
      }, 3000);
    }
  };

  const handleVideoSubmit = async () => {
    if (!videoInput.trim()) return;

    setVideoProcessingStatus('processing');
    setVideoError(null);

    try {
      // Extract video content using ytube-transcribe
      const response = await fetch('/api/ytube-transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to process video URL: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('No transcription text received from the API');
      }

      const transcriptionText = data.response.trim();

      // Close modal
      setShowVideoModal(false);
      setVideoProcessingStatus('success');

      // Add messages
      const userMessage: Message = {
        id: messages.length + 1,
        text: `Shared video: ${videoInput}`,
        sender: 'user',
        isNew: true
      };
      setMessages(prev => [...prev, userMessage]);

      // Prepare video info
      const videoInfo = {
        url: videoInput,
        type: 'video',
        extracted_length: transcriptionText.length,
        timestamp: new Date().toISOString()
      };

      // Process with Azure Chat including video info
      await sendToAzureChat(
        `I've shared this video: "${videoInput}". Here's what it contains:\n\n${transcriptionText}\n\nWhat kind of learning activity would you like to create with this content?`,
        transcriptionText,
        videoInfo
      );

    } catch (error) {
      console.error('Error processing video:', error);
      setVideoProcessingStatus('error');
      setVideoError(error instanceof Error ? error.message : 'Failed to process video');

      // Add error message to chat if modal is closed with error
      const errorMessage: Message = {
        id: messages.length + 1,
        text: `Sorry, I encountered an error processing your video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'luna',
        isNew: true
      };
      setMessages(prev => [...prev, errorMessage]);

      // Wait a bit before closing the modal on error
      setTimeout(() => {
        setShowVideoModal(false);
        setVideoInput('');
        setVideoProcessingStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Overlay Button */}
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[2px] z-10 rounded-lg">
          <button
            onClick={() => setShowOverlay(false)}
            className="px-6 py-3 bg-[#2D3748] text-white rounded-lg hover:bg-[#1F2937] transition-all transform hover:scale-105 shadow-lg font-medium animate-pulse hover:animate-none"
          >
            Create with Luna
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E4E1] bg-white rounded-t-lg">
        <h2 className="text-[#2D3748] font-medium">Chat with Luna</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="message">
              <Message message={message} />
            </div>
          ))}
          {showIndicator && messages.length > 0 && messages[messages.length - 1]?.sender === 'user' && (
            <div className="flex justify-start mt-4" key="preparing-indicator">
              <PreparingIndicator />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E8E4E1] p-4 bg-white rounded-b-lg">
        {/* Content Addition Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleFileButtonClick}
            className="p-2 rounded-lg hover:bg-[#EFEAE6] text-[#4A5568] transition-colors"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowUrlModal(true)}
            className="p-2 rounded-lg hover:bg-[#EFEAE6] text-[#4A5568] transition-colors"
          >
            <Globe className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="p-2 rounded-lg hover:bg-[#EFEAE6] text-[#4A5568] transition-colors"
          >
            <Youtube className="w-5 h-5" />
          </button>
        </div>

        {/* Message Input */}
        <div className="flex items-center gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
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
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg border border-[#E8E4E1] focus:outline-none focus:border-[#2D3748] text-[#2D3748] placeholder-[#4A5568] bg-white"
          />
          <button
            onClick={sendMessage}
            className="p-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#1F2937] transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <UploadProgress 
              item={uploadItem}
              onCancel={() => {
                setShowUploadModal(false);
                setUploadItem(null);
              }}
              onFileUpload={handleFileUpload}
            />
          </div>
        </div>
      )}

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#2D3748]">Add URL</h3>
              <button 
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlInput('');
                  setUrlProcessingStatus('idle');
                  setUrlError(null);
                }} 
                className="text-[#4A5568] hover:text-[#2D3748]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL"
                className="w-full px-4 py-2 border border-[#E8E4E1] rounded-lg"
                disabled={urlProcessingStatus === 'processing'}
              />

              {urlError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {urlError}
                </div>
              )}

              <button
                onClick={handleUrlSubmit}
                disabled={urlProcessingStatus === 'processing' || !urlInput.trim()}
                className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center ${
                  urlProcessingStatus === 'processing'
                    ? 'bg-[#E8E4E1] cursor-not-allowed'
                    : 'bg-[#2D3748] text-white hover:bg-[#1F2937]'
                }`}
              >
                {urlProcessingStatus === 'processing' ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Add URL'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#2D3748]">Add Video</h3>
              <button 
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoInput('');
                  setVideoProcessingStatus('idle');
                  setVideoError(null);
                }} 
                className="text-[#4A5568] hover:text-[#2D3748]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="url"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="Enter YouTube URL"
                className="w-full px-4 py-2 border border-[#E8E4E1] rounded-lg"
                disabled={videoProcessingStatus === 'processing'}
              />

              {videoError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {videoError}
                </div>
              )}

              <button
                onClick={handleVideoSubmit}
                disabled={videoProcessingStatus === 'processing' || !videoInput.trim()}
                className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center ${
                  videoProcessingStatus === 'processing'
                    ? 'bg-[#E8E4E1] cursor-not-allowed'
                    : 'bg-[#2D3748] text-white hover:bg-[#1F2937]'
                }`}
              >
                {videoProcessingStatus === 'processing' ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Add Video'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomepageChatWithTracker;
