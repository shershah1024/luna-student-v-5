// Conditional Redis import for Node.js runtime only
let Redis: any = null;
let redis: any = null;

// Only import Redis in Node.js environment (not Edge Runtime)
if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  try {
    Redis = require("ioredis");
  } catch (error) {
    console.warn("Redis not available, using in-memory cache only");
  }
}
const inMemoryCache = new Map<string, { data: any; expires: number }>();

// Initialize Redis connection
function initRedis() {
  if (!redis && Redis && process.env.REDIS_URL) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 5000,
      });

      redis.on("error", (err) => {
        console.warn(
          "Redis connection error, falling back to in-memory cache:",
          err.message,
        );
        redis = null;
      });

      redis.on("ready", () => {
        console.log("Redis connection established");
      });
    } catch (error) {
      console.warn("Failed to initialize Redis, using in-memory cache:", error);
      redis = null;
    }
  }
}

// Initialize on module load
initRedis();

export class CacheService {
  private static instance: CacheService;
  private readonly TTL_DEFAULT = 900; // 15 minutes
  private readonly TTL_SHORT = 300; // 5 minutes
  private readonly TTL_LONG = 3600; // 1 hour

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private generateKey(namespace: string, key: string): string {
    return `goethe:${namespace}:${key}`;
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const fullKey = this.generateKey(namespace, key);

    try {
      if (redis) {
        const cached = await redis.get(fullKey);
        return cached ? JSON.parse(cached) : null;
      } else {
        // Fallback to in-memory cache
        const cached = inMemoryCache.get(fullKey);
        if (cached && cached.expires > Date.now()) {
          return cached.data;
        } else if (cached) {
          inMemoryCache.delete(fullKey);
        }
        return null;
      }
    } catch (error) {
      console.warn("Cache get error:", error);
      return null;
    }
  }

  async set<T>(
    namespace: string,
    key: string,
    data: T,
    ttlSeconds?: number,
  ): Promise<void> {
    const fullKey = this.generateKey(namespace, key);
    const ttl = ttlSeconds || this.TTL_DEFAULT;

    try {
      if (redis) {
        await redis.setex(fullKey, ttl, JSON.stringify(data));
      } else {
        // Fallback to in-memory cache
        inMemoryCache.set(fullKey, {
          data,
          expires: Date.now() + ttl * 1000,
        });

        // Simple cleanup of expired entries (run occasionally)
        if (Math.random() < 0.01) {
          // 1% chance
          this.cleanupInMemoryCache();
        }
      }
    } catch (error) {
      console.warn("Cache set error:", error);
    }
  }

  async delete(namespace: string, key: string): Promise<void> {
    const fullKey = this.generateKey(namespace, key);

    try {
      if (redis) {
        await redis.del(fullKey);
      } else {
        inMemoryCache.delete(fullKey);
      }
    } catch (error) {
      console.warn("Cache delete error:", error);
    }
  }

  async deletePattern(namespace: string, pattern: string): Promise<void> {
    const fullPattern = this.generateKey(namespace, pattern);

    try {
      if (redis) {
        const keys = await redis.keys(fullPattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // In-memory cache pattern deletion
        const prefix = this.generateKey(namespace, "");
        for (const key of inMemoryCache.keys()) {
          if (
            key.startsWith(prefix) &&
            key.includes(pattern.replace("*", ""))
          ) {
            inMemoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.warn("Cache delete pattern error:", error);
    }
  }

  private cleanupInMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of inMemoryCache.entries()) {
      if (value.expires <= now) {
        inMemoryCache.delete(key);
      }
    }
  }

  // Dashboard-specific caching methods
  async getDashboard(userId: string, courseId: string) {
    return this.get<any>("dashboard", `${userId}:${courseId}`);
  }

  async setDashboard(userId: string, courseId: string, data: any) {
    return this.set(
      "dashboard",
      `${userId}:${courseId}`,
      data,
      this.TTL_DEFAULT,
    );
  }

  async invalidateDashboard(userId: string, courseId?: string) {
    if (courseId) {
      await this.delete("dashboard", `${userId}:${courseId}`);
    } else {
      await this.deletePattern("dashboard", `${userId}:*`);
    }
  }

  // User progress caching
  async getUserProgress(userId: string) {
    return this.get<any>("progress", userId);
  }

  async setUserProgress(userId: string, data: any) {
    return this.set("progress", userId, data, this.TTL_SHORT);
  }

  async invalidateUserProgress(userId: string) {
    await this.delete("progress", userId);
  }

  // Scores caching
  async getUserScores(userId: string, courseId: string) {
    return this.get<any>("scores", `${userId}:${courseId}`);
  }

  async setUserScores(userId: string, courseId: string, data: any) {
    return this.set("scores", `${userId}:${courseId}`, data, this.TTL_LONG);
  }

  async invalidateUserScores(userId: string, courseId?: string) {
    if (courseId) {
      await this.delete("scores", `${userId}:${courseId}`);
    } else {
      await this.deletePattern("scores", `${userId}:*`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ redis: boolean; inMemory: boolean }> {
    try {
      if (redis) {
        await redis.ping();
        return { redis: true, inMemory: false };
      } else {
        return { redis: false, inMemory: true };
      }
    } catch (error) {
      return { redis: false, inMemory: true };
    }
  }

  // Get cache stats
  getCacheStats() {
    return {
      redis: !!redis,
      inMemorySize: inMemoryCache.size,
      type: redis ? "redis" : "in-memory",
    };
  }
}

export const cacheService = CacheService.getInstance();
