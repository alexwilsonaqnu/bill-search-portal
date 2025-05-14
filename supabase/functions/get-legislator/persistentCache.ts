
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
  const cached = persistentCache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache entry has expired
  if (Date.now() - cached.timestamp > PERSISTENT_CACHE_TTL) {
    persistentCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

// Set cached legislator in persistent storage
export async function setPersistentCachedLegislator(cacheKey: string, data: any): Promise<void> {
  persistentCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// Initialize the cache when this module is imported
initializeCache().catch(error => {
  console.error("Failed to initialize persistent cache:", error);
});
