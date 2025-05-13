
// In-memory cache with improved structure and TTL
const legislatorCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Check cache first before making API request
export function getCachedLegislator(cacheKey: string): any | null {
  if (legislatorCache.has(cacheKey)) {
    const { data, timestamp } = legislatorCache.get(cacheKey);
    const now = Date.now();
    
    if (now - timestamp < CACHE_TTL) {
      console.log(`Cache hit for: ${cacheKey}`);
      return data;
    } else {
      // Remove expired cache entry
      legislatorCache.delete(cacheKey);
    }
  }
  return null;
}

// Set cache for legislator data
export function setCachedLegislator(cacheKey: string, data: any): void {
  legislatorCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached legislator: ${cacheKey}`);
}
