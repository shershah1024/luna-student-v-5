import { cacheService } from "./redis-cache";

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Circuit is open, rejecting requests
  HALF_OPEN = "HALF_OPEN", // Testing if service is back
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time before attempting to close (ms)
  monitoringPeriod: number; // Period to monitor failures (ms)
  successThreshold: number; // Successes needed to close from half-open
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class CircuitBreaker {
  private serviceName: string;
  private config: CircuitBreakerConfig;
  private fallbackFunction?: () => Promise<any>;

  constructor(
    serviceName: string,
    config: CircuitBreakerConfig,
    fallbackFunction?: () => Promise<any>,
  ) {
    this.serviceName = serviceName;
    this.config = config;
    this.fallbackFunction = fallbackFunction;
  }

  private async getState(): Promise<CircuitBreakerState> {
    const defaultState: CircuitBreakerState = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };

    try {
      const cached = await cacheService.get<CircuitBreakerState>(
        "circuit_breaker",
        this.serviceName,
      );
      return cached || defaultState;
    } catch (error) {
      console.warn(
        `Circuit breaker state retrieval failed for ${this.serviceName}:`,
        error,
      );
      return defaultState;
    }
  }

  private async setState(state: CircuitBreakerState): Promise<void> {
    try {
      // Cache for longer than reset timeout to persist state
      const ttlSeconds = Math.ceil(this.config.resetTimeout / 1000) + 300;
      await cacheService.set(
        "circuit_breaker",
        this.serviceName,
        state,
        ttlSeconds,
      );
    } catch (error) {
      console.warn(
        `Circuit breaker state update failed for ${this.serviceName}:`,
        error,
      );
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const state = await this.getState();
    const now = Date.now();

    // Check if we should transition from OPEN to HALF_OPEN
    if (state.state === CircuitState.OPEN && now >= state.nextAttemptTime) {
      state.state = CircuitState.HALF_OPEN;
      state.successCount = 0;
      await this.setState(state);
    }

    // Reject request if circuit is OPEN
    if (state.state === CircuitState.OPEN) {
      const error = new Error(
        `Circuit breaker is OPEN for ${this.serviceName}. Service is currently unavailable.`,
      );
      (error as any).code = "CIRCUIT_BREAKER_OPEN";

      if (this.fallbackFunction) {
        console.log(
          `Circuit breaker OPEN for ${this.serviceName}, using fallback`,
        );
        return this.fallbackFunction();
      }

      throw error;
    }

    try {
      // Execute the operation
      const result = await operation();

      // Record success
      await this.onSuccess(state);
      return result;
    } catch (error) {
      // Record failure
      await this.onFailure(state, error);
      throw error;
    }
  }

  private async onSuccess(state: CircuitBreakerState): Promise<void> {
    const now = Date.now();

    if (state.state === CircuitState.HALF_OPEN) {
      state.successCount++;

      // If we have enough successes, close the circuit
      if (state.successCount >= this.config.successThreshold) {
        state.state = CircuitState.CLOSED;
        state.failureCount = 0;
        state.successCount = 0;
        console.log(
          `Circuit breaker CLOSED for ${this.serviceName} - service recovered`,
        );
      }
    } else if (state.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      state.failureCount = 0;
    }

    await this.setState(state);
  }

  private async onFailure(
    state: CircuitBreakerState,
    error: any,
  ): Promise<void> {
    const now = Date.now();

    // Only count failures within the monitoring period
    if (now - state.lastFailureTime > this.config.monitoringPeriod) {
      state.failureCount = 1;
    } else {
      state.failureCount++;
    }

    state.lastFailureTime = now;
    state.successCount = 0;

    // Open circuit if failure threshold exceeded
    if (state.failureCount >= this.config.failureThreshold) {
      state.state = CircuitState.OPEN;
      state.nextAttemptTime = now + this.config.resetTimeout;
      console.warn(
        `Circuit breaker OPENED for ${this.serviceName} - failure threshold exceeded`,
      );
    }

    await this.setState(state);
  }

  // Get current circuit state for monitoring
  async getStatus(): Promise<{
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttemptTime?: number;
  }> {
    const state = await this.getState();
    return {
      state: state.state,
      failureCount: state.failureCount,
      successCount: state.successCount,
      ...(state.state === CircuitState.OPEN && {
        nextAttemptTime: state.nextAttemptTime,
      }),
    };
  }

  // Manual reset for admin purposes
  async reset(): Promise<void> {
    const resetState: CircuitBreakerState = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
    await this.setState(resetState);
    console.log(`Circuit breaker manually reset for ${this.serviceName}`);
  }
}

// Pre-configured circuit breakers for your services
export const circuitBreakers = {
  azureOpenAI: new CircuitBreaker(
    "azure-openai",
    {
      failureThreshold: 5, // 5 failures
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute window
      successThreshold: 3, // 3 successes to close
    },
    // Fallback for AI operations
    async () => {
      return {
        error: "AI service temporarily unavailable",
        fallback: true,
        message: "Please try again in a few moments",
      };
    },
  ),

  supabase: new CircuitBreaker(
    "supabase",
    {
      failureThreshold: 10, // 10 failures (database is more critical)
      resetTimeout: 15000, // 15 seconds
      monitoringPeriod: 60000, // 1 minute window
      successThreshold: 5, // 5 successes to close
    },
    // Fallback for database operations
    async () => {
      return {
        error: "Database temporarily unavailable",
        fallback: true,
        message: "Your request is being processed. Please check back shortly.",
      };
    },
  ),

  // Generic circuit breaker for other external services
  external: new CircuitBreaker("external-service", {
    failureThreshold: 3, // 3 failures
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 120000, // 2 minute window
    successThreshold: 2, // 2 successes to close
  }),
};

// Utility function to wrap operations with circuit breaker
export async function withCircuitBreaker<T>(
  breakerName: keyof typeof circuitBreakers,
  operation: () => Promise<T>,
): Promise<T> {
  const breaker = circuitBreakers[breakerName];
  return breaker.execute(operation);
}

// Health check endpoint helper
export async function getCircuitBreakerHealth() {
  const health = await Promise.all([
    circuitBreakers.azureOpenAI
      .getStatus()
      .then((status) => ({ service: "azure-openai", ...status })),
    circuitBreakers.supabase
      .getStatus()
      .then((status) => ({ service: "supabase", ...status })),
    circuitBreakers.external
      .getStatus()
      .then((status) => ({ service: "external", ...status })),
  ]);

  return {
    circuitBreakers: health,
    healthy: health.every((cb) => cb.state === CircuitState.CLOSED),
    timestamp: new Date().toISOString(),
  };
}
