/**
 * Audio utilities for OpenAI Realtime API
 * Handles audio capture, streaming, and playback
 */

/**
 * Converts Float32Array audio to base64-encoded PCM16 for OpenAI
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Converts base64-encoded PCM16 from OpenAI to Float32Array for playback
 */
export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataView = new DataView(bytes.buffer);
  const float32Array = new Float32Array(bytes.length / 2);
  
  for (let i = 0; i < float32Array.length; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32Array[i] = int16 / (int16 < 0 ? 0x8000 : 0x7fff);
  }
  
  return float32Array;
}

/**
 * Audio recorder class for capturing microphone input
 */
export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recording = false;
  private audioChunks: Float32Array[] = [];
  
  constructor(
    private onAudioData?: (data: Float32Array) => void,
    private sampleRate = 24000 // OpenAI Realtime API uses 24kHz
  ) {}

  /**
   * Start recording from microphone
   */
  async start(): Promise<void> {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Create audio context with specific sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate
      });

      // Create source from microphone
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create processor for capturing audio data
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.recording) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const float32Data = new Float32Array(inputData);
        
        // Store for later retrieval if needed
        this.audioChunks.push(float32Data);
        
        // Send to callback if provided
        if (this.onAudioData) {
          this.onAudioData(float32Data);
        }
      };

      // Connect nodes
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.recording = true;
      console.log('[AudioRecorder] Started recording');
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stop(): Float32Array {
    this.recording = false;

    // Disconnect nodes
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Combine all audio chunks into single array
    const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedAudio = new Float32Array(totalLength);
    let offset = 0;
    
    for (const chunk of this.audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('[AudioRecorder] Stopped recording, total samples:', totalLength);
    
    // Clear chunks for next recording
    const result = combinedAudio;
    this.audioChunks = [];
    
    return result;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording;
  }
}

/**
 * Audio player class for playing back audio from OpenAI
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  
  constructor(private sampleRate = 24000) {}

  /**
   * Initialize audio context
   */
  private async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.sampleRate
      });
    }
  }

  /**
   * Add audio data to playback queue
   */
  async addAudioData(data: Float32Array): Promise<void> {
    await this.init();
    this.audioQueue.push(data);
    
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Play next audio chunk from queue
   */
  private async playNext(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.audioQueue.shift()!;
    
    if (!this.audioContext) return;

    // Create audio buffer
    const audioBuffer = this.audioContext.createBuffer(1, audioData.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);

    // Create and play source
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.playNext();
    };
    
    source.start();
  }

  /**
   * Clear audio queue
   */
  clear(): void {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Close audio context
   */
  async close(): Promise<void> {
    this.clear();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Merge multiple audio chunks into a single Float32Array
 */
export function mergeAudioChunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  
  return merged;
}

/**
 * Convert Float32Array to WAV file blob for saving
 */
export function audioToWav(audioData: Float32Array, sampleRate = 24000): Blob {
  const length = audioData.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}