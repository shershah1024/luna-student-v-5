// Simplified database-only cache service
import { createClient } from "@supabase/supabase-js";

// Get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export class DatabaseCacheService {
  private static instance: DatabaseCacheService;

  static getInstance(): DatabaseCacheService {
    if (!DatabaseCacheService.instance) {
      DatabaseCacheService.instance = new DatabaseCacheService();
    }
    return DatabaseCacheService.instance;
  }

  // Dashboard cache operations
  async getDashboard(userId: string, courseId: string): Promise<any | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("get_dashboard_data_hybrid", {
        p_user_id: userId,
        p_course_id: courseId,
        p_force_refresh: false
      });

      if (error) {
        console.error("Error fetching dashboard from cache:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Dashboard cache error:", error);
      return null;
    }
  }

  async setDashboard(userId: string, courseId: string, data: any): Promise<void> {
    // Dashboard is automatically updated via database triggers
    // This method is kept for compatibility but doesn't need to do anything
    console.log("Dashboard cache is automatically updated via triggers");
  }

  async invalidateDashboard(userId: string, courseId?: string): Promise<void> {
    try {
      const supabase = getSupabaseClient();
      await supabase.rpc("invalidate_dashboard_cache", {
        p_user_id: userId,
        p_course_id: courseId || null
      });
    } catch (error) {
      console.error("Error invalidating dashboard cache:", error);
    }
  }

  // User progress cache operations
  async getUserProgress(userId: string): Promise<any | null> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("user_progress_summary")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user progress:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("User progress cache error:", error);
      return null;
    }
  }

  async invalidateUserProgress(userId: string): Promise<void> {
    // Mark materialized view for refresh
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from("materialized_view_refresh_log")
        .update({ needs_refresh: true })
        .eq("view_name", "user_progress_summary");
    } catch (error) {
      console.error("Error marking progress for refresh:", error);
    }
  }

  // Generic cache operations (for backward compatibility)
  async get<T>(namespace: string, key: string): Promise<T | null> {
    if (namespace === "dashboard") {
      return this.getDashboard(key.split(":")[0], key.split(":")[1]) as Promise<T | null>;
    } else if (namespace === "user-progress") {
      return this.getUserProgress(key) as Promise<T | null>;
    }
    return null;
  }

  async set<T>(namespace: string, key: string, data: T, ttlSeconds?: number): Promise<void> {
    // Data is automatically cached via database triggers
    console.log(`Cache set called for ${namespace}:${key}, but using automatic database caching`);
  }

  async invalidate(namespace: string, key: string): Promise<void> {
    if (namespace === "dashboard") {
      const [userId, courseId] = key.split(":");
      await this.invalidateDashboard(userId, courseId);
    } else if (namespace === "user-progress") {
      await this.invalidateUserProgress(key);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // For pattern-based invalidation, we'll need to parse the pattern
    const parts = pattern.split(":");
    if (parts[1] === "dashboard" && parts[2] === "*") {
      await this.invalidateDashboard(parts[0]);
    }
  }
}

export const cacheService = DatabaseCacheService.getInstance();