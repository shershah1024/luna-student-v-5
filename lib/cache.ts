// Simple in-memory cache for dashboard data
// This provides immediate performance improvements without external dependencies

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 1000; // Prevent memory leaks
  private prefetchQueue = new Set<string>();

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 minutes default
    // Clean old entries if cache is getting large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 300000
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 300000
  ): Promise<void> {
    // Avoid duplicate prefetch requests
    if (this.prefetchQueue.has(key) || this.has(key)) {
      return;
    }

    this.prefetchQueue.add(key);

    try {
      const data = await fetcher();
      this.set(key, data, ttlMs);
    } catch (error) {
      console.error(`Failed to prefetch ${key}:`, error);
    } finally {
      this.prefetchQueue.delete(key);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.maxSize / 2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Helper function to generate cache keys
export function generateCacheKey(userId: string, endpoint: string, params?: Record<string, any>): string {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${userId}:${endpoint}:${paramsStr}`;
}