
// Import functions with the correct names from persistentCache.ts
import { getPersistentCachedLegislator, setPersistentCachedLegislator } from "./persistentCache.ts";

// In-memory cache with improved structure and TTL - used as a first-level cache
const legislatorCache = new Map();
const MEMORY_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for in-memory cache

// Multi-level cache strategy: check memory first, then database
export async function getCachedLegislator(cacheKey: string): Promise<any | null> {
  // First level: Check memory cache (fastest)
  if (legislatorCache.has(cacheKey)) {
    const { data, timestamp } = legislatorCache.get(cacheKey);
    const now = Date.now();
    
    if (now - timestamp < MEMORY_CACHE_TTL) {
      console.log(`Memory cache hit for: ${cacheKey}`);
      return data;
    } else {
      // Remove expired cache entry
      legislatorCache.delete(cacheKey);
    }
  }
  
  // Second level: Check persistent database cache
  const dbCachedData = await getPersistentCachedLegislator(cacheKey);
  if (dbCachedData) {
    // Update memory cache with the DB result
    legislatorCache.set(cacheKey, {
      data: dbCachedData,
      timestamp: Date.now()
    });
    return dbCachedData;
  }
  
  return null;
}

// Set cache entry in both memory and persistent storage
export async function setCachedLegislator(cacheKey: string, data: any): Promise<void> {
  // Update memory cache
  legislatorCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Update persistent cache
  await setPersistentCachedLegislator(cacheKey, data);
}
