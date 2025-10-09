/**
 * Speech Pipeline Hook with VAD - TTS/LLM/STT for Speaking Exercises
 * Uses @ricky0123/vad-react for accurate voice activity detection
 * Automatically processes speech when user stops talking
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';
import { toast } from 'sonner';

export interface SpeakingConfig {
  language?: string;
  voice?: string;
  instructions?: string;
  temperature?: number;
  topic?: string;
  difficulty?: string;
  onSpeechEnd?: (audio: Float32Array) => void;
  onSpeechStart?: () => void;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export function useSpeakingPipelineVAD(config: SpeakingConfig = {}) {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  
  // VAD configuration
  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechStart: () => {
      console.log('[VAD] Speech started');
      accumulatedTranscriptRef.current = '';
      config.onSpeechStart?.();
    },
    onSpeechEnd: (audio) => {
      console.log('[VAD] Speech ended, processing...');
      
      // Stop recognition to get final transcript
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
        
        // Process the accumulated transcript
        const finalTranscript = accumulatedTranscriptRef.current.trim();
        if (finalTranscript) {
          console.log('[VAD] Processing transcript:', finalTranscript);
          processUserInput(finalTranscript);
        }
        
        // Clear current transcript
        setCurrentTranscript('');
        accumulatedTranscriptRef.current = '';
        
        // Restart recognition for next speech
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              isRecognitionActiveRef.current = true;
            } catch (e) {
              console.error('[VAD] Error restarting recognition:', e);
            }
          }
        }, 100);
      }
      
      config.onSpeechEnd?.(audio);
    },
    positiveSpeechThreshold: 0.9,  // High confidence threshold
    negativeSpeechThreshold: 0.75, // Lower threshold to stop
    minSpeechFrames: 3,            // Minimum frames to confirm speech
    redemptionFrames: 5,           // Frames to wait before ending
    preSpeechPadFrames: 10,        // Pre-speech padding
    submitUserSpeechOnPause: true, // Submit when user pauses
  });
  
  /**
   * Initialize speech recognition
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
      if (finalTranscript) {
        accumulatedTranscriptRef.current = finalTranscript;
      }
      
      // Update current display transcript
      const displayTranscript = finalTranscript || accumulatedTranscriptRef.current + interimTranscript;
      setCurrentTranscript(displayTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('[Speech Recognition] Error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Ignore these errors - they're expected when we stop/restart
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      console.log('[Speech Recognition] Ended');
      isRecognitionActiveRef.current = false;
      // Don't restart here - VAD will handle it
    };
    
    recognitionRef.current = recognition;
  }, [config.language]);
  
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
      console.error('[Process Input] Error:', err);
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
      console.error('[TTS] Error:', err);
      setIsSpeaking(false);
      setError('Text-to-speech failed');
    }
  }, [config.voice, config.language]);
  
  /**
   * Start listening with VAD
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setCurrentTranscript('');
      accumulatedTranscriptRef.current = '';
      
      // Initialize speech recognition
      initializeSpeechRecognition();
      
      // Start VAD
      await vad.start();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        isRecognitionActiveRef.current = true;
        setIsListening(true);
      }
      
    } catch (err) {
      console.error('[Start Listening] Error:', err);
      setError('Failed to start listening');
    }
  }, [vad, initializeSpeechRecognition]);
  
  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    // Stop VAD
    vad.pause();
    
    // Stop speech recognition
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      recognitionRef.current.stop();
      isRecognitionActiveRef.current = false;
    }
    
    setIsListening(false);
    setCurrentTranscript('');
    accumulatedTranscriptRef.current = '';
  }, [vad]);
  
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      vad.pause();
    };
  }, [vad]);
  
  return {
    // State
    isListening,
    isSpeaking,
    isProcessing,
    conversation,
    currentTranscript,
    error,
    
    // VAD state
    userSpeaking: vad.userSpeaking,
    loading: vad.loading,
    
    // Actions
    startListening,
    stopListening,
    sendText,
    clearConversation,
    speakText,
  };
}