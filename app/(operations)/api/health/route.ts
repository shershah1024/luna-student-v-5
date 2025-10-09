import { NextRequest, NextResponse } from "next/server";
import { getCircuitBreakerHealth } from "@/lib/circuit-breaker";
import { cacheService } from "@/lib/redis-cache";
import { getSupabasePool } from "@/lib/supabase-pool";
import { azureOpenAI } from "@/lib/azure-openai-protected";

export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: {
      status: "up" | "down";
      connectionPool?: {
        total: number;
        inUse: number;
        available: number;
      };
      latency?: number;
      error?: string;
    };
    cache: {
      status: "up" | "down";
      type: "redis" | "in-memory";
      error?: string;
    };
    azureOpenAI: {
      status: "up" | "down";
      latency?: number;
      error?: string;
    };
    circuitBreakers: any[];
  };
  uptime: number;
  environment: string;
}

const startTime = Date.now();

export async function GET(
  request: NextRequest,
): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Check database/connection pool
  let databaseStatus = { status: "down" as const, error: "Unknown error" };
  try {
    const pool = getSupabasePool();
    const stats = pool.getPoolStats();
    const start = Date.now();

    // Simple health check query
    await pool.getConnection().then(async (client) => {
      await client.from("user_lesson_progress_clean").select("id").limit(1);
      pool.releaseConnection(client);
    });

    databaseStatus = {
      status: "up" as const,
      connectionPool: {
        total: stats.totalConnections,
        inUse: stats.inUseConnections,
        available: stats.availableConnections,
      },
      latency: Date.now() - start,
    };
  } catch (error) {
    databaseStatus = {
      status: "down" as const,
      error: error.message,
    };
    overallStatus = "unhealthy";
  }

  // Check cache
  let cacheStatus = { status: "down" as const, type: "in-memory" as const };
  try {
    const cacheHealth = await cacheService.healthCheck();
    cacheStatus = {
      status: "up" as const,
      type: cacheHealth.redis ? "redis" : "in-memory",
    };
  } catch (error) {
    cacheStatus = {
      status: "down" as const,
      type: "in-memory" as const,
      error: error.message,
    };
    if (overallStatus === "healthy") overallStatus = "degraded";
  }

  // Check Azure OpenAI
  let azureStatus = { status: "down" as const, error: "Unknown error" };
  try {
    const aiHealth = await azureOpenAI.healthCheck();
    azureStatus = aiHealth.healthy
      ? { status: "up" as const, latency: aiHealth.latency }
      : { status: "down" as const, error: aiHealth.error };

    if (!aiHealth.healthy && overallStatus === "healthy") {
      overallStatus = "degraded";
    }
  } catch (error) {
    azureStatus = {
      status: "down" as const,
      error: error.message,
    };
    if (overallStatus === "healthy") overallStatus = "degraded";
  }

  // Check circuit breakers
  const circuitBreakerHealth = await getCircuitBreakerHealth();
  if (!circuitBreakerHealth.healthy && overallStatus === "healthy") {
    overallStatus = "degraded";
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp,
    services: {
      database: databaseStatus,
      cache: cacheStatus,
      azureOpenAI: azureStatus,
      circuitBreakers: circuitBreakerHealth.circuitBreakers,
    },
    uptime: Date.now() - startTime,
    environment: process.env.NODE_ENV || "development",
  };

  // Set appropriate HTTP status code
  const httpStatus =
    overallStatus === "healthy"
      ? 200
      : overallStatus === "degraded"
        ? 200
        : 503;

  return NextResponse.json(healthStatus, { status: httpStatus });
}

// Simple liveness probe (minimal checks)
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Just check if the server is responding
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
