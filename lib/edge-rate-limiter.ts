// Edge Runtime compatible rate limiter using in-memory cache only
// This is a simpler version for Edge Runtime compatibility

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

// In-memory cache for Edge Runtime
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Cleanup function to prevent memory leaks
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetTime) {
      rateLimitCache.delete(key);
    }
  }
}

// Run cleanup periodically (1% chance on each call)
function maybeCleanup() {
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
}

export class EdgeRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  checkLimit(identifier: string): RateLimitResult {
    maybeCleanup();

    const now = Date.now();
    const windowStart =
      Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const key = `${identifier}:${windowStart}`;
    const resetTime = windowStart + this.config.windowMs;

    const existing = rateLimitCache.get(key);
    const currentCount = existing ? existing.count : 0;
    const newCount = currentCount + 1;

    if (newCount > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        totalHits: currentCount,
      };
    }

    // Update cache
    rateLimitCache.set(key, {
      count: newCount,
      resetTime,
    });

    return {
      allowed: true,
      remaining: this.config.maxRequests - newCount,
      resetTime,
      totalHits: newCount,
    };
  }
}

// Edge-compatible rate limiters
export const edgeRateLimiters = {
  general: new EdgeRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  aiOperations: new EdgeRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  }),

  databaseWrites: new EdgeRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
  }),

  bulkOperations: new EdgeRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
  }),
};

// Helper function for Edge Runtime
export function applyEdgeRateLimit(
  identifier: string,
  limiterType: keyof typeof edgeRateLimiters = "general",
): RateLimitResult {
  const limiter = edgeRateLimiters[limiterType];
  return limiter.checkLimit(identifier);
}

// Create rate limit response
export function createEdgeRateLimitResponse(result: RateLimitResult) {
  const headers = {
    "X-RateLimit-Limit": "100", // Default limit
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

// Utility to get client IP (Edge Runtime compatible)
export function getEdgeClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const headers = request.headers;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}
