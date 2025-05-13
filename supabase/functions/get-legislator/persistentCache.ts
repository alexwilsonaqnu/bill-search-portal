
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Create Supabase client for persistent storage
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache time-to-live (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000; 

// Initialize cache table if it doesn't exist
export async function initializeCache() {
  try {
    // Check if the table exists
    const { error } = await supabase.from('legislator_cache').select('key', { count: 'exact', head: true });
    
    if (error && error.message.includes("does not exist")) {
      console.log("Legislator cache table doesn't exist. Please create it via SQL migration");
    } else {
      console.log("Connected to legislator cache table");
      // Periodic cleanup of expired entries
      setInterval(cleanupExpiredEntries, 60 * 60 * 1000); // Run cleanup hourly
    }
  } catch (err) {
    console.error("Error initializing cache:", err);
  }
}

// Get cached legislator from persistent storage
export async function getPersistentCachedLegislator(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('legislator_cache')
      .select('data, created_at')
      .eq('key', key)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if cache is still valid
    const createdAt = new Date(data.created_at).getTime();
    const now = Date.now();
    if (now - createdAt > CACHE_TTL) {
      // Cache expired - will be cleaned up by periodic job
      return null;
    }
    
    console.log(`DB cache hit for: ${key}`);
    return data.data;
  } catch (err) {
    console.error("Error accessing cached legislator:", err);
    return null;
  }
}

// Store legislator in persistent cache
export async function setPersistentCachedLegislator(key: string, data: any): Promise<void> {
  try {
    // Using upsert to handle both insert and update cases
    const { error } = await supabase
      .from('legislator_cache')
      .upsert({ 
        key, 
        data, 
        created_at: new Date().toISOString() 
      });
    
    if (error) {
      console.error("Error storing legislator cache:", error);
    } else {
      console.log(`Cached legislator in DB: ${key}`);
    }
  } catch (err) {
    console.error("Error setting cached legislator:", err);
  }
}

// Periodically clean up expired entries
async function cleanupExpiredEntries() {
  try {
    const cutoffDate = new Date(Date.now() - CACHE_TTL).toISOString();
    
    const { error, count } = await supabase
      .from('legislator_cache')
      .delete()
      .lt('created_at', cutoffDate);
    
    if (error) {
      console.error("Error cleaning up expired cache entries:", error);
    } else if (count) {
      console.log(`Removed ${count} expired cache entries`);
    }
  } catch (err) {
    console.error("Error in cache cleanup:", err);
  }
}
