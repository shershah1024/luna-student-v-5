/**
 * Speech Pipeline Hook - TTS/LLM/STT for Speaking Exercises
 * Uses Azure Speech Services for STT/TTS and Azure OpenAI for LLM
 * This provides a more reliable alternative to the Realtime API
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
  vadSilenceThreshold?: number;     // Silence duration in ms before considering speech ended (default: 1500)
  vadNoiseThreshold?: number;       // Volume threshold for detecting speech (0-1, default: 0.01)
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audio?: Blob;
}

export function useSpeakingPipeline(config: SpeakingConfig = {}) {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const hasSpokenRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  
  /**
   * Initialize speech recognition (browser-based for simplicity)
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
      console.log('[Speech Recognition] onresult event:', {
        results: event.results,
        resultIndex: event.resultIndex,
        length: event.results.length
      });
      
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
      
      // Log what we're setting
      console.log('[Speech Recognition] Transcripts:', {
        final: finalTranscript,
        interim: interimTranscript,
        combined: finalTranscript + interimTranscript
      });
      
      // Update current transcript with final + interim
      if (finalTranscript || interimTranscript) {
        setCurrentTranscript(finalTranscript + interimTranscript);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Ignore no-speech errors
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (isListening) {
        // Restart if still supposed to be listening
        recognition.start();
      }
    };
    
    recognitionRef.current = recognition;
  }, [config.language, isListening]);
  
  /**
   * Start listening
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setCurrentTranscript('');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Initialize speech recognition
      initializeSpeechRecognition();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      }
      
    } catch (err) {
      console.error('Error starting listening:', err);
      setError('Failed to access microphone');
    }
  }, [initializeSpeechRecognition]);
  
  /**
   * Convert text to speech using Azure TTS
   */
  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsSpeaking(true);
    
    try {
      // Call Azure TTS API
      // Azure OpenAI TTS supports: alloy, echo, fable, onyx, nova, shimmer
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: config.voice || 'alloy', // Use 'alloy' as default voice for Azure OpenAI TTS
          language: config.language || 'en-US',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      
      // Get audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play audio
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();
      
    } catch (err) {
      console.error('Error speaking text:', err);
      setError('Failed to generate speech');
      setIsSpeaking(false);
    }
  }, [config.voice, config.language]);
  
  /**
   * Stop listening and process the speech
   */
  const stopListening = useCallback(async () => {
    setIsListening(false);
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Process the transcript if available after a small delay
    // This allows the UI to show the final transcript before processing
    const finalTranscript = currentTranscript.trim();
    if (finalTranscript) {
      // We'll process this after the component re-renders
      // to avoid the circular dependency
      setTimeout(async () => {
        // Process the user input directly here
        setIsProcessing(true);
        setError(null);
        setCurrentTranscript(''); // Clear current transcript after processing
        
        try {
          // Add user message to conversation
          const userMessage: ConversationMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: finalTranscript,
            timestamp: new Date(),
          };
          setConversation(prev => [...prev, userMessage]);
          
          // Prepare messages for LLM
          const systemPrompt = `You are a language tutor helping with ${config.difficulty || 'A1'} level speaking practice about ${config.topic}. ${config.instructions || 'Engage in natural conversation, ask follow-up questions, and provide gentle corrections. Keep responses concise and conversational.'}`;
          
          const messages = [
            { role: 'system', content: systemPrompt },
            ...conversation.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: finalTranscript }
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
          const aiResponse = data.content || data.choices?.[0]?.message?.content;
          
          if (aiResponse) {
            // Add AI message to conversation
            const aiMessage: ConversationMessage = {
              id: `assistant_${Date.now()}`,
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date(),
            };
            setConversation(prev => [...prev, aiMessage]);
            
            // Convert to speech using the speakText function defined above
            // Now we can safely reference it since it's defined before stopListening
            await speakText(aiResponse);
          }
          
        } catch (err) {
          console.error('Error processing input:', err);
          setError('Failed to process your speech');
        } finally {
          setIsProcessing(false);
        }
      }, 500);
    }
  }, [currentTranscript, conversation, config, speakText]);
  
  
  /**
   * Send a text message directly
   */
  const sendText = useCallback(async (text: string) => {
    if (!text) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);
      
      // Prepare messages for LLM
      const systemPrompt = `You are a language tutor helping with ${config.difficulty || 'A1'} level speaking practice about ${config.topic}. ${config.instructions || 'Engage in natural conversation, ask follow-up questions, and provide gentle corrections. Keep responses concise and conversational.'}`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: text }
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
      const aiResponse = data.content || data.choices?.[0]?.message?.content;
      
      if (aiResponse) {
        // Add AI message to conversation
        const aiMessage: ConversationMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, aiMessage]);
        
        // Convert to speech
        await speakText(aiResponse);
      }
      
    } catch (err) {
      console.error('Error processing input:', err);
      setError('Failed to process message');
    } finally {
      setIsProcessing(false);
    }
  }, [conversation, config, speakText]);
  
  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setConversation([]);
    setCurrentTranscript('');
    setError(null);
  }, []);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    initializeSpeechRecognition();
  }, [initializeSpeechRecognition]);
  
  return {
    // State
    isListening,
    isSpeaking,
    isProcessing,
    conversation,
    currentTranscript,
    error,
    
    // Actions
    startListening,
    stopListening,
    sendText,
    clearConversation,
    speakText,
  };
}