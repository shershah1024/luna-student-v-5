import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withCircuitBreaker, circuitBreakers } from "./circuit-breaker";

// Import rate limiters conditionally based on runtime
let rateLimitModule: any = null;
let edgeRateLimitModule: any = null;

// Detect runtime environment and import appropriate rate limiter
if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  try {
    rateLimitModule = require("./rate-limiter");
  } catch (error) {
    console.warn("Node.js rate limiter not available, using edge version");
  }
}

if (!rateLimitModule) {
  edgeRateLimitModule = require("./edge-rate-limiter");
}

// Note: Rate limiting decorator removed due to Edge Runtime compatibility
// Use withRateLimitWrapper or withProtection instead

// Wrapper function for rate limiting (alternative to decorator)
export async function withRateLimitWrapper<T>(
  request: NextRequest,
  limiterType: string,
  operation: () => Promise<T>,
): Promise<T | Response> {
  try {
    // Get user ID or fall back to IP
    const { userId } = await auth();

    let identifier: string;
    let rateLimitResult: any;

    if (rateLimitModule) {
      // Use Node.js rate limiter
      identifier = userId || rateLimitModule.getClientIP(request);
      rateLimitResult = await rateLimitModule.applyRateLimit(
        identifier,
        limiterType,
      );

      if (!rateLimitResult.allowed) {
        return rateLimitModule.createRateLimitResponse(rateLimitResult);
      }
    } else if (edgeRateLimitModule) {
      // Use Edge Runtime rate limiter
      identifier = userId || edgeRateLimitModule.getEdgeClientIP(request);
      rateLimitResult = edgeRateLimitModule.applyEdgeRateLimit(
        identifier,
        limiterType,
      );

      if (!rateLimitResult.allowed) {
        return edgeRateLimitModule.createEdgeRateLimitResponse(rateLimitResult);
      }
    }

    // Execute the operation
    const result = await operation();

    // Add rate limit headers if result is a Response and we have rate limit data
    if (result instanceof NextResponse && rateLimitResult) {
      result.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString(),
      );
      result.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.resetTime.toString(),
      );
    }

    return result;
  } catch (error) {
    console.error("Rate limiting wrapper error:", error);
    // Fail open - continue with operation
    return operation();
  }
}

// Combined middleware for rate limiting + circuit breaking
export async function withProtection<T>(
  request: NextRequest,
  options: {
    rateLimitType?: string;
    circuitBreakerType?: keyof typeof circuitBreakers;
  },
  operation: () => Promise<T>,
): Promise<T | Response> {
  const { rateLimitType = "general", circuitBreakerType } = options;

  // Apply rate limiting first
  const rateLimitResult = await withRateLimitWrapper(
    request,
    rateLimitType,
    async () => {
      // Apply circuit breaker if specified
      if (circuitBreakerType) {
        return withCircuitBreaker(circuitBreakerType, operation);
      }
      return operation();
    },
  );

  return rateLimitResult;
}

// Exponential backoff utility for retries
export class ExponentialBackoff {
  private baseDelay: number;
  private maxDelay: number;
  private maxRetries: number;

  constructor(baseDelay = 1000, maxDelay = 30000, maxRetries = 3) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.maxRetries = maxRetries;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === this.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff + jitter
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay,
        );
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = delay + jitter;

        console.log(
          `Operation failed (attempt ${attempt + 1}), retrying in ${Math.round(totalDelay)}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }

    throw lastError;
  }
}

// Global error handler for API routes
export function handleApiError(error: any): NextResponse {
  console.error("API Error:", error);

  // Circuit breaker errors
  if (error.code === "CIRCUIT_BREAKER_OPEN") {
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        message:
          "External service is experiencing issues. Please try again shortly.",
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  // Rate limit errors (shouldn't reach here, but safety net)
  if (error.message?.includes("rate limit")) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: "Too many requests. Please slow down.",
        code: "RATE_LIMITED",
      },
      { status: 429 },
    );
  }

  // Timeout errors
  if (error.name === "TimeoutError" || error.code === "ETIMEDOUT") {
    return NextResponse.json(
      {
        error: "Request timeout",
        message: "The request took too long to process. Please try again.",
        code: "TIMEOUT",
      },
      { status: 504 },
    );
  }

  // Database connection errors
  if (
    error.message?.includes("connection") ||
    error.code?.includes("CONNECT")
  ) {
    return NextResponse.json(
      {
        error: "Database connection error",
        message: "Unable to connect to database. Please try again.",
        code: "DATABASE_ERROR",
      },
      { status: 503 },
    );
  }

  // Generic server error
  return NextResponse.json(
    {
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}
