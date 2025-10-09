import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Connection pool configuration
const POOL_SIZE = 10;
const MAX_IDLE_TIME = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds

interface PooledConnection {
  client: SupabaseClient;
  lastUsed: number;
  inUse: boolean;
}

class SupabaseConnectionPool {
  private pool: PooledConnection[] = [];
  private waitingQueue: Array<(client: SupabaseClient) => void> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize the connection pool
    this.initializePool();

    // Start cleanup process for idle connections
    this.startCleanupProcess();
  }

  private initializePool() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create initial pool connections
    for (let i = 0; i < POOL_SIZE; i++) {
      const client = createClient(supabaseUrl, supabaseKey, {
        db: {
          schema: "public",
        },
        auth: {
          persistSession: false, // Important for server-side usage
        },
        realtime: {
          params: {
            eventsPerSecond: 2, // Reduce realtime overhead
          },
        },
      });

      this.pool.push({
        client,
        lastUsed: Date.now(),
        inUse: false,
      });
    }
  }

  private startCleanupProcess() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, MAX_IDLE_TIME);
  }

  private cleanupIdleConnections() {
    const now = Date.now();
    this.pool = this.pool.filter((conn) => {
      if (!conn.inUse && now - conn.lastUsed > MAX_IDLE_TIME) {
        // Remove idle connection
        return false;
      }
      return true;
    });

    // Maintain minimum pool size
    while (this.pool.length < Math.min(3, POOL_SIZE)) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const client = createClient(supabaseUrl, supabaseKey, {
        db: { schema: "public" },
        auth: { persistSession: false },
      });

      this.pool.push({
        client,
        lastUsed: Date.now(),
        inUse: false,
      });
    }
  }

  async getConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, CONNECTION_TIMEOUT);

      // Find available connection
      const availableConnection = this.pool.find((conn) => !conn.inUse);

      if (availableConnection) {
        clearTimeout(timeout);
        availableConnection.inUse = true;
        availableConnection.lastUsed = Date.now();
        resolve(availableConnection.client);
      } else if (this.pool.length < POOL_SIZE) {
        // Create new connection if pool not at capacity
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const client = createClient(supabaseUrl, supabaseKey, {
          db: { schema: "public" },
          auth: { persistSession: false },
        });

        const newConnection: PooledConnection = {
          client,
          lastUsed: Date.now(),
          inUse: true,
        };

        this.pool.push(newConnection);
        clearTimeout(timeout);
        resolve(client);
      } else {
        // Add to waiting queue
        this.waitingQueue.push((client) => {
          clearTimeout(timeout);
          resolve(client);
        });
      }
    });
  }

  releaseConnection(client: SupabaseClient) {
    const connection = this.pool.find((conn) => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();

      // Process waiting queue
      if (this.waitingQueue.length > 0) {
        const nextResolver = this.waitingQueue.shift();
        if (nextResolver) {
          connection.inUse = true;
          nextResolver(client);
        }
      }
    }
  }

  getPoolStats() {
    return {
      totalConnections: this.pool.length,
      inUseConnections: this.pool.filter((conn) => conn.inUse).length,
      availableConnections: this.pool.filter((conn) => !conn.inUse).length,
      queueLength: this.waitingQueue.length,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.pool = [];
    this.waitingQueue = [];
  }
}

// Global singleton instance
let poolInstance: SupabaseConnectionPool | null = null;

export function getSupabasePool(): SupabaseConnectionPool {
  if (!poolInstance) {
    poolInstance = new SupabaseConnectionPool();
  }
  return poolInstance;
}

// Convenience function for getting a pooled connection
export async function getPooledSupabaseClient(): Promise<SupabaseClient> {
  const pool = getSupabasePool();
  return pool.getConnection();
}

// Convenience function for releasing a pooled connection
export function releaseSupabaseClient(client: SupabaseClient) {
  const pool = getSupabasePool();
  pool.releaseConnection(client);
}

// Helper function for using a pooled connection with automatic cleanup
export async function withPooledSupabase<T>(
  operation: (client: SupabaseClient) => Promise<T>,
): Promise<T> {
  const client = await getPooledSupabaseClient();
  try {
    return await operation(client);
  } finally {
    releaseSupabaseClient(client);
  }
}
