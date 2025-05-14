
// Simple implementation for persistent cache
// This could be enhanced to use KV or another storage mechanism

const persistentCache = new Map<string, { data: any; timestamp: number }>();
const PERSISTENT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Initialize the cache
export async function initializeCache(): Promise<void> {
  console.log("Initializing persistent cache for legislators");
  // This is where you would load persisted data if needed
}

// Get cached legislator from persistent storage
export async function getPersistentCachedLegislator(cacheKey: string): Promise<any | null> {
  if (persistentCache.has(cacheKey)) {
    const { data, timestamp } = persistentCache.get(cacheKey)!;
    
    // Check if cache entry is still valid
    if (Date.now() - timestamp < PERSISTENT_CACHE_TTL) {
      console.log(`Persistent cache hit for: ${cacheKey}`);
      return data;
    } else {
      // Clean up expired entry
      persistentCache.delete(cacheKey);
      console.log(`Expired persistent cache entry removed for: ${cacheKey}`);
    }
  }
  
  return null;
}

// Set cached legislator in persistent storage
export async function setPersistentCachedLegislator(cacheKey: string, data: any): Promise<void> {
  persistentCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`Saved to persistent cache: ${cacheKey}`);
}
