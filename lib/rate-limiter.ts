import { cacheService } from "./redis-cache";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart =
      Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const key = `rate_limit:${identifier}:${windowStart}`;

    try {
      // Get current count from cache
      const currentCount =
        (await cacheService.get<number>("rate_limit", key)) || 0;
      const newCount = currentCount + 1;

      // Calculate reset time
      const resetTime = windowStart + this.config.windowMs;

      if (newCount > this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits: currentCount,
        };
      }

      // Update count in cache
      const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
      await cacheService.set("rate_limit", key, newCount, ttlSeconds);

      return {
        allowed: true,
        remaining: this.config.maxRequests - newCount,
        resetTime,
        totalHits: newCount,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        totalHits: 1,
      };
    }
  }
}

// Predefined rate limiters for different API types
export const rateLimiters = {
  // General API protection - per user
  general: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute per user
  }),

  // AI/Heavy operations - more restrictive
  aiOperations: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 AI requests per minute per user
  }),

  // Bulk operations - very restrictive
  bulkOperations: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 bulk operations per 5 minutes per user
  }),

  // Database writes - moderate protection
  databaseWrites: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 write operations per minute per user
  }),

  // Global rate limit (per IP)
  global: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute per IP
  }),
};

// Utility function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

// Rate limiting middleware function
export async function applyRateLimit(
  identifier: string,
  limiterType: keyof typeof rateLimiters = "general",
): Promise<RateLimitResult> {
  const limiter = rateLimiters[limiterType];
  return limiter.checkLimit(identifier);
}

// Helper to create rate limit response
export function createRateLimitResponse(result: RateLimitResult) {
  const headers = {
    "X-RateLimit-Limit": rateLimiters.general.config.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
    "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
  };

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    },
  );
}
