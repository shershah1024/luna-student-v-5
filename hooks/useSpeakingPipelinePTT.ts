/**
 * Speech Pipeline Hook with Push-to-Talk - TTS/LLM/STT for Speaking Exercises
 * Hold button/key to speak, release to process
 * Provides clear control over when speech is captured
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface SpeakingConfig {
  language?: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
  topic?: string;
  difficulty?: string;
  pushToTalkKey?: string; // Keyboard key for PTT (default: spacebar)
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function useSpeakingPipelinePTT(config: SpeakingConfig = {}) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);
  const hasPermissionRef = useRef<boolean>(false);
  
  /**
   * Initialize speech recognition
   */
  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return false;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.language || 'en-US';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Process all results from the beginning
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update accumulated transcript
      accumulatedTranscriptRef.current = finalTranscript + interimTranscript;
      setCurrentTranscript(accumulatedTranscriptRef.current);
    };
    
    recognition.onerror = (event: any) => {
      console.error('[PTT Speech Recognition] Error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Expected when stopping - ignore
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
    };
    
    recognition.onend = () => {
      console.log('[PTT Speech Recognition] Ended');
      isListeningRef.current = false;
    };
    
    recognitionRef.current = recognition;
    return true;
  }, [config.language]);
  
  /**
   * Request microphone permission
   */
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      hasPermissionRef.current = true;
      
      // Initialize speech recognition
      return initializeSpeechRecognition();
    } catch (err) {
      console.error('[PTT] Error getting microphone permission:', err);
      setError('Microphone permission denied');
      return false;
    }
  }, [initializeSpeechRecognition]);
  
  /**
   * Start recording (push)
   */
  const startRecording = useCallback(async () => {
    // Don't start if already processing or speaking
    if (isProcessing || isSpeaking) {
      console.log('[PTT] Cannot start - processing or speaking');
      return;
    }
    
    // Get permission if needed
    if (!hasPermissionRef.current) {
      const success = await requestMicrophonePermission();
      if (!success) return;
    }
    
    // Clear previous transcript
    setCurrentTranscript('');
    accumulatedTranscriptRef.current = '';
    setError(null);
    
    // Start speech recognition
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsRecording(true);
        setIsPushToTalkActive(true);
        console.log('[PTT] Started recording');
      } catch (err) {
        console.error('[PTT] Error starting recognition:', err);
        setError('Failed to start recording');
      }
    }
  }, [isProcessing, isSpeaking, requestMicrophonePermission]);
  
  /**
   * Stop recording and process (release)
   */
  const stopRecording = useCallback(() => {
    if (!isListeningRef.current) return;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
    }
    
    setIsRecording(false);
    setIsPushToTalkActive(false);
    console.log('[PTT] Stopped recording');
    
    // Process the accumulated transcript
    const finalTranscript = accumulatedTranscriptRef.current.trim();
    if (finalTranscript) {
      console.log('[PTT] Processing transcript:', finalTranscript);
      processUserInput(finalTranscript);
    } else {
      console.log('[PTT] No transcript to process');
    }
    
    // Clear transcript
    setCurrentTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);
  
  /**
   * Process user input with LLM
   */
  const processUserInput = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: transcript,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);
      
      // Prepare messages for LLM
      const systemPrompt = `You are a language tutor helping with ${config.difficulty || 'A1'} level speaking practice about ${config.topic}. ${config.instructions || 'Engage in natural conversation, ask follow-up questions, and provide gentle corrections. Keep responses concise and conversational.'}`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: transcript }
      ];
      
      // Call Azure OpenAI
      const response = await fetch('/api/chat/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: 150,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      const aiResponse = data.content;
      
      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, aiMessage]);
      
      // Speak the response
      await speakText(aiResponse);
      
    } catch (err) {
      console.error('[PTT Process Input] Error:', err);
      setError('Failed to process input');
    } finally {
      setIsProcessing(false);
    }
  }, [conversation, config]);
  
  /**
   * Convert text to speech using Azure TTS
   */
  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsSpeaking(true);
    
    try {
      // Call Azure TTS API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: config.voice || 'alloy',
          language: config.language || 'en-US',
        }),
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (err) {
      console.error('[PTT TTS] Error:', err);
      setIsSpeaking(false);
      setError('Text-to-speech failed');
    }
  }, [config.voice, config.language]);
  
  /**
   * Send text directly (for testing)
   */
  const sendText = useCallback((text: string) => {
    processUserInput(text);
  }, [processUserInput]);
  
  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setConversation([]);
    setCurrentTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);
  
  /**
   * Initialize microphone permission on mount
   */
  const initialize = useCallback(async () => {
    await requestMicrophonePermission();
  }, [requestMicrophonePermission]);
  
  // Set up keyboard shortcuts for PTT
  useEffect(() => {
    const pushKey = config.pushToTalkKey || ' '; // Default to spacebar
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === pushKey && !e.repeat) {
        e.preventDefault();
        startRecording();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === pushKey) {
        e.preventDefault();
        stopRecording();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config.pushToTalkKey, startRecording, stopRecording]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return {
    // State
    isRecording,
    isSpeaking,
    isProcessing,
    conversation,
    currentTranscript,
    error,
    isPushToTalkActive,
    
    // Actions
    startRecording,
    stopRecording,
    sendText,
    clearConversation,
    speakText,
    initialize,
  };
}