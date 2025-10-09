/**
 * Ultra-Optimized Speech Pipeline Hook with Push-to-Talk
 * Uses streaming for both LLM and TTS with sentence-level processing
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { SentenceDetector, TTSQueue } from '@/lib/streaming/sentenceDetector';

export interface SpeakingConfig {
  language?: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
  topic?: string;
  difficulty?: string;
  pushToTalkKey?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function useSpeakingPipelinePTTStream(config: SpeakingConfig = {}) {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  
  // Refs
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasPermissionRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentenceDetectorRef = useRef<SentenceDetector>(new SentenceDetector());
  const ttsQueueRef = useRef<TTSQueue | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const audioBufferRef = useRef<{ audio: HTMLAudioElement; sentence: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  
  /**
   * Play audio queue sequentially
   */
  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || audioBufferRef.current.length === 0) return;
    
    const { audio, sentence } = audioBufferRef.current.shift()!;
    isPlayingRef.current = true;
    setIsSpeaking(true);
    currentAudioRef.current = audio;
    
    console.log(`[Stream PTT] Playing audio for: "${sentence.substring(0, 50)}..."`);
    
    audio.onended = () => {
      isPlayingRef.current = false;
      if (audioBufferRef.current.length > 0) {
        playNextAudio();
      } else {
        setIsSpeaking(false);
      }
    };
    
    audio.onerror = () => {
      console.error('[Stream PTT] Audio playback error');
      isPlayingRef.current = false;
      playNextAudio();
    };
    
    audio.play().catch(err => {
      console.error('[Stream PTT] Play error:', err);
      isPlayingRef.current = false;
      playNextAudio();
    });
  }, []);
  
  /**
   * Generate TTS for a sentence and add to queue
   */
  const generateTTSForSentence = useCallback(async (sentence: string) => {
    if (!sentence.trim()) return;
    
    const ttsStartTime = Date.now();
    console.log(`[Stream PTT] Generating TTS for: "${sentence.substring(0, 50)}..."`);
    
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentence,
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
      audio.preload = 'auto';
      
      console.log(`[Stream PTT] TTS generated in ${Date.now() - ttsStartTime}ms`);
      
      // Add to audio buffer
      audioBufferRef.current.push({ audio, sentence });
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextAudio();
      }
      
    } catch (err) {
      console.error('[Stream PTT] TTS error:', err);
    }
  }, [config.voice, config.language, playNextAudio]);
  
  /**
   * Initialize TTS queue
   */
  useEffect(() => {
    ttsQueueRef.current = new TTSQueue(generateTTSForSentence);
  }, [generateTTSForSentence]);
  
  /**
   * Request microphone permission
   */
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      streamRef.current = stream;
      hasPermissionRef.current = true;
      return true;
    } catch (err) {
      console.error('[Stream PTT] Microphone permission error:', err);
      setError('Microphone permission denied');
      return false;
    }
  }, []);
  
  /**
   * Initialize Web Speech API for streaming transcription
   */
  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.language || 'en-US';
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update transcript refs
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        interimTranscriptRef.current = ''; // Clear interim when we get final
      } else {
        interimTranscriptRef.current = interimTranscript;
      }
      
      // Show real-time transcript (final + interim)
      const fullTranscript = finalTranscriptRef.current + interimTranscriptRef.current;
      if (fullTranscript) {
        setCurrentTranscript(fullTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('[Stream PTT] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
      }
    };
    
    recognition.onend = () => {
      console.log('[Stream PTT] Speech recognition ended');
    };
    
    recognitionRef.current = recognition;
  }, [config.language]);
  
  /**
   * Stop all audio playback
   */
  const stopAllAudio = useCallback(() => {
    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Clear audio buffer
    audioBufferRef.current.forEach(({ audio }) => {
      audio.pause();
      URL.revokeObjectURL(audio.src);
    });
    audioBufferRef.current = [];
    
    // Reset playing state
    isPlayingRef.current = false;
    setIsSpeaking(false);
    
    // Clear TTS queue
    ttsQueueRef.current?.clear();
    
    console.log('[Stream PTT] Stopped all audio playback');
  }, []);
  
  /**
   * Start recording (push)
   */
  const startRecording = useCallback(async () => {
    // If speaking, interrupt and stop audio
    if (isSpeaking) {
      console.log('[Stream PTT] Interrupting Luna...');
      stopAllAudio();
      // Small delay to ensure audio is stopped
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Don't start if still processing previous request
    if (isProcessing) {
      console.log('[Stream PTT] Cannot start - still processing');
      return;
    }
    
    if (!hasPermissionRef.current) {
      const success = await requestMicrophonePermission();
      if (!success) return;
    }
    
    // Clear all state for fresh start
    setCurrentTranscript('');
    setStreamingResponse('');
    setError(null);
    audioChunksRef.current = [];
    sentenceDetectorRef.current.reset();
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    
    // Cancel any ongoing LLM requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Initialize speech recognition if needed
    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }
    
    // Start Web Speech API for real-time transcription
    if (recognitionRef.current) {
      try {
        // Stop if already running, then restart
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore if not running
        }
        
        // Small delay before restarting
        await new Promise(resolve => setTimeout(resolve, 50));
        
        recognitionRef.current.start();
        console.log('[Stream PTT] Started fresh speech recognition session');
      } catch (err) {
        console.error('[Stream PTT] Failed to start speech recognition:', err);
      }
    }
    
    // Create MediaRecorder for audio recording (for fallback or verification)
    if (streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setIsPushToTalkActive(true);
      console.log('[Stream PTT] Started recording');
    }
  }, [isProcessing, isSpeaking, requestMicrophonePermission, initializeSpeechRecognition, stopAllAudio]);
  
  /**
   * Stop recording and process with streaming
   */
  const stopRecording = useCallback(async () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log('[Stream PTT] Stopped speech recognition');
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPushToTalkActive(false);
    console.log('[Stream PTT] Stopped recording');
    
    // Wait a bit for any final results to come in
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use final transcript, or fallback to final + interim if no final
    const finalText = finalTranscriptRef.current.trim();
    const interimText = interimTranscriptRef.current.trim();
    const transcript = finalText || interimText;
    
    if (!transcript) {
      console.log('[Stream PTT] No transcript captured');
      return;
    }
    
    console.log('[Stream PTT] Using transcript:', { 
      final: finalText, 
      interim: interimText,
      using: transcript 
    });
    
    // If we only have interim, set it as the current transcript
    if (!finalText && interimText) {
      setCurrentTranscript(interimText);
    }
    
    await processTranscriptWithStreaming(transcript);
  }, []);
  
  /**
   * Process transcript with streaming LLM and TTS
   */
  const processTranscriptWithStreaming = useCallback(async (transcript: string) => {
    setIsProcessing(true);
    setError(null);
    
    const startTime = Date.now();
    console.log('[Stream PTT] Starting streaming pipeline with transcript:', transcript);
    
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Transcript already available from Web Speech API
      console.log(`[Stream PTT] Using Web Speech API transcript (instant)`);
      
      // Add user message
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: transcript,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);
      
      // Step 2: Stream LLM response with sentence detection
      const llmStartTime = Date.now();
      
      const systemPrompt = `You are a language tutor helping with ${config.difficulty || 'A1'} level speaking practice about ${config.topic}. ${config.instructions || 'Engage in natural conversation, ask follow-up questions, and provide gentle corrections. Keep responses concise and conversational.'}`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: transcript }
      ];
      
      const llmResponse = await fetch('/api/chat/completion-stream', {
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
      
      console.log(`[Stream PTT] LLM stream started in ${Date.now() - llmStartTime}ms`);
      
      // Process SSE stream
      const reader = llmResponse.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let firstSentenceTime: number | null = null;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Process any remaining text
                const remaining = sentenceDetectorRef.current.flush();
                if (remaining) {
                  ttsQueueRef.current?.enqueue(remaining);
                }
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.content;
                
                if (content) {
                  fullResponse += content;
                  setStreamingResponse(fullResponse);
                  
                  // Detect complete sentences
                  const sentences = sentenceDetectorRef.current.addChunk(content);
                  
                  for (const sentence of sentences) {
                    if (!firstSentenceTime) {
                      firstSentenceTime = Date.now();
                      console.log(`[Stream PTT] First sentence ready in ${firstSentenceTime - llmStartTime}ms`);
                    }
                    // Queue sentence for TTS
                    ttsQueueRef.current?.enqueue(sentence);
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
      
      // Add complete AI response to conversation
      const aiMessage: ConversationMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, aiMessage]);
      setStreamingResponse('');
      
      const totalTime = Date.now() - startTime;
      console.log(`[Stream PTT] Total pipeline completed in ${totalTime}ms`);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Stream PTT] Request aborted (interrupted by user)');
        // Don't show error for user interruptions
      } else {
        console.error('[Stream PTT] Pipeline error:', err);
        setError('Failed to process speech');
      }
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
    }
  }, [conversation, config, generateTTSForSentence]);
  
  /**
   * Convert text to speech
   */
  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    
    // Split into sentences and process
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    for (const sentence of sentences) {
      await generateTTSForSentence(sentence);
    }
  }, [generateTTSForSentence]);
  
  /**
   * Send text directly
   */
  const sendText = useCallback(async (text: string) => {
    // Process as text input with streaming
    if (!text) return;
    await processTranscriptWithStreaming(text);
  }, [processTranscriptWithStreaming]);
  
  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setConversation([]);
    setCurrentTranscript('');
    setStreamingResponse('');
    audioChunksRef.current = [];
    audioBufferRef.current = [];
    sentenceDetectorRef.current.reset();
    ttsQueueRef.current?.clear();
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
  }, []);
  
  /**
   * Initialize
   */
  const initialize = useCallback(async () => {
    await requestMicrophonePermission();
    initializeSpeechRecognition();
  }, [requestMicrophonePermission, initializeSpeechRecognition]);
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const pushKey = config.pushToTalkKey || ' ';
    
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
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      audioBufferRef.current.forEach(({ audio }) => {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      });
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
    streamingResponse,
    error,
    isPushToTalkActive,
    
    // Actions
    startRecording,
    stopRecording,
    sendText,
    clearConversation,
    speakText,
    initialize,
    stopAllAudio,
  };
}