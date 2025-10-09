/**
 * Sentence Detection and Buffering for Streaming Text
 * Detects complete sentences for optimal TTS generation
 */

export class SentenceDetector {
  private buffer: string = '';
  private sentenceEndRegex = /[.!?;]+\s+|[.!?;]+$/g;
  private abbreviations = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.', 'Ph.D', 'M.D', 'B.A', 'M.A', 'B.S', 'M.S'];
  
  /**
   * Add text chunk to buffer and extract complete sentences
   */
  addChunk(chunk: string): string[] {
    this.buffer += chunk;
    return this.extractCompleteSentences();
  }
  
  /**
   * Extract complete sentences from buffer
   */
  private extractCompleteSentences(): string[] {
    const sentences: string[] = [];
    
    // Find sentence boundaries
    let lastIndex = 0;
    const matches = Array.from(this.buffer.matchAll(this.sentenceEndRegex));
    
    for (const match of matches) {
      const endIndex = match.index! + match[0].length;
      const sentence = this.buffer.substring(lastIndex, endIndex).trim();
      
      // Check if it's not an abbreviation
      if (sentence && !this.isAbbreviation(sentence)) {
        sentences.push(sentence);
        lastIndex = endIndex;
      }
    }
    
    // Update buffer to keep incomplete sentence
    if (lastIndex > 0) {
      this.buffer = this.buffer.substring(lastIndex);
    }
    
    return sentences;
  }
  
  /**
   * Check if sentence ends with an abbreviation
   */
  private isAbbreviation(sentence: string): boolean {
    return this.abbreviations.some(abbr => sentence.endsWith(abbr));
  }
  
  /**
   * Get remaining buffer content (incomplete sentence)
   */
  getRemaining(): string {
    return this.buffer.trim();
  }
  
  /**
   * Force flush the buffer (for end of stream)
   */
  flush(): string {
    const remaining = this.buffer.trim();
    this.buffer = '';
    return remaining;
  }
  
  /**
   * Reset the detector
   */
  reset(): void {
    this.buffer = '';
  }
}

/**
 * TTS Queue for managing sentence-level TTS generation
 */
export class TTSQueue {
  private queue: string[] = [];
  private isProcessing: boolean = false;
  private onProcess?: (text: string) => Promise<void>;
  
  constructor(onProcess?: (text: string) => Promise<void>) {
    this.onProcess = onProcess;
  }
  
  /**
   * Add sentence to queue
   */
  enqueue(sentence: string): void {
    if (!sentence.trim()) return;
    this.queue.push(sentence);
    this.processNext();
  }
  
  /**
   * Process next sentence in queue
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const sentence = this.queue.shift()!;
    
    try {
      if (this.onProcess) {
        await this.onProcess(sentence);
      }
    } catch (error) {
      console.error('[TTSQueue] Processing error:', error);
    } finally {
      this.isProcessing = false;
      // Process next sentence if available
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }
  
  /**
   * Get queue length
   */
  getLength(): number {
    return this.queue.length;
  }
  
  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }
  
  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}