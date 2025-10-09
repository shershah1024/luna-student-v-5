/**
 * Optimized Speech Pipeline Hook with Push-to-Talk
 * Uses streaming transcription and parallel processing for lowest latency
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

export function useSpeakingPipelinePTTOptimized(config: SpeakingConfig = {}) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasPermissionRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * Request microphone permission
   */
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for Whisper
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;
      hasPermissionRef.current = true;
      return true;
    } catch (err) {
      console.error('[PTT Optimized] Error getting microphone permission:', err);
      setError('Microphone permission denied');
      return false;
    }
  }, []);
  
  /**
   * Start recording (push)
   */
  const startRecording = useCallback(async () => {
    // Don't start if already processing or speaking
    if (isProcessing || isSpeaking) {
      console.log('[PTT Optimized] Cannot start - processing or speaking');
      return;
    }
    
    // Get permission if needed
    if (!hasPermissionRef.current) {
      const success = await requestMicrophonePermission();
      if (!success) return;
    }
    
    // Clear previous state
    setCurrentTranscript('');
    setError(null);
    audioChunksRef.current = [];
    
    // Create MediaRecorder for capturing audio
    if (streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms for streaming
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setIsPushToTalkActive(true);
      console.log('[PTT Optimized] Started recording');
    }
  }, [isProcessing, isSpeaking, requestMicrophonePermission]);
  
  /**
   * Stop recording and process with optimized pipeline
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    
    // Stop recording
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPushToTalkActive(false);
    console.log('[PTT Optimized] Stopped recording');
    
    // Wait for final data
    await new Promise(resolve => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = resolve;
      } else {
        resolve(undefined);
      }
    });
    
    // Create audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (audioBlob.size === 0) {
      console.log('[PTT Optimized] No audio recorded');
      return;
    }
    
    // Process with optimized pipeline
    await processAudioOptimized(audioBlob);
  }, []);
  
  /**
   * Process audio with parallel transcription and LLM processing
   */
  const processAudioOptimized = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    
    const startTime = Date.now();
    console.log('[PTT Optimized] Starting optimized processing pipeline');
    
    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      // Step 1: Start transcription (streaming)
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', config.language || 'en');
      
      const transcriptionPromise = fetch('/api/transcribe-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      }).then(res => res.json());
      
      // Wait for transcription
      const transcriptionResult = await transcriptionPromise;
      const transcript = transcriptionResult.transcript;
      
      if (!transcript) {
        throw new Error('No transcript received');
      }
      
      console.log(`[PTT Optimized] Transcription completed in ${Date.now() - startTime}ms`);
      setCurrentTranscript(transcript);
      
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: transcript,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);
      
      // Step 2: Process with LLM (while user sees their transcript)
      const llmStartTime = Date.now();
      
      const systemPrompt = `You are a language tutor helping with ${config.difficulty || 'A1'} level speaking practice about ${config.topic}. ${config.instructions || 'Engage in natural conversation, ask follow-up questions, and provide gentle corrections. Keep responses concise and conversational.'}`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: transcript }
      ];
      
      const llmResponse = await fetch('/api/chat/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: 150,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!llmResponse.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const llmData = await llmResponse.json();
      const aiResponse = llmData.content;
      
      console.log(`[PTT Optimized] LLM completed in ${Date.now() - llmStartTime}ms`);
      
      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, aiMessage]);
      
      // Step 3: Generate TTS (could potentially stream this too)
      const ttsStartTime = Date.now();
      
      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiResponse,
          voice: config.voice || 'alloy',
          language: config.language || 'en-US',
          speed: 1.1, // Slightly faster speech
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!ttsResponse.ok) {
        throw new Error('TTS request failed');
      }
      
      console.log(`[PTT Optimized] TTS completed in ${Date.now() - ttsStartTime}ms`);
      
      // Play audio
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Pre-load audio for faster playback
      audio.preload = 'auto';
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
      };
      
      setIsSpeaking(true);
      await audio.play();
      
      const totalTime = Date.now() - startTime;
      console.log(`[PTT Optimized] Total pipeline completed in ${totalTime}ms`);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[PTT Optimized] Request aborted');
      } else {
        console.error('[PTT Optimized] Pipeline error:', err);
        setError('Failed to process speech');
      }
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  }, [conversation, config]);
  
  /**
   * Convert text to speech using Azure TTS
   */
  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsSpeaking(true);
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: config.voice || 'alloy',
          language: config.language || 'en-US',
          speed: 1.1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.preload = 'auto';
      
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
      console.error('[PTT Optimized TTS] Error:', err);
      setIsSpeaking(false);
      setError('Text-to-speech failed');
    }
  }, [config.voice, config.language]);
  
  /**
   * Send text directly (for testing)
   */
  const sendText = useCallback(async (text: string) => {
    const blob = new Blob([], { type: 'audio/webm' });
    setCurrentTranscript(text);
    
    // Process as if it was speech
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, userMessage]);
    
    // Continue with LLM processing
    setIsProcessing(true);
    try {
      const systemPrompt = `You are a language tutor helping with ${config.difficulty || 'A1'} level speaking practice about ${config.topic}. ${config.instructions || 'Engage in natural conversation, ask follow-up questions, and provide gentle corrections. Keep responses concise and conversational.'}`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: text }
      ];
      
      const response = await fetch('/api/chat/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: 150,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get AI response');
      
      const data = await response.json();
      const aiResponse = data.content;
      
      const aiMessage: ConversationMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, aiMessage]);
      
      await speakText(aiResponse);
    } catch (err) {
      console.error('[PTT Optimized] Error processing text:', err);
      setError('Failed to process text');
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  }, [conversation, config, speakText]);
  
  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setConversation([]);
    setCurrentTranscript('');
    audioChunksRef.current = [];
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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