
import { LegislatorInfo } from './types';

// Global cache to store legislator data across the application
export const legislatorCache = new Map<string, { data: LegislatorInfo; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

/**
 * Check if legislator exists in cache and is not expired
 * @param cacheKey The key to check in cache
 * @param forceRefresh Whether to ignore the cache and force a refresh
 */
export function getCachedLegislator(cacheKey: string, forceRefresh = false): LegislatorInfo | null {
  // If forceRefresh is true, skip cache lookup
  if (forceRefresh) {
    console.log(`Force refresh requested for: ${cacheKey}`);
    return null;
  }
  
  const cached = legislatorCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`Using cached legislator data for: ${cacheKey}`);
    return cached.data;
  }
  return null;
}

/**
 * Store legislator in cache
 */
export function cacheLegislator(cacheKey: string, data: LegislatorInfo): void {
  legislatorCache.set(cacheKey, { 
    data, 
    timestamp: Date.now() 
  });
}

/**
 * Clear specific entry or entire cache
 * @param cacheKey Optional key to clear. If not provided, entire cache is cleared
 */
export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    legislatorCache.delete(cacheKey);
    console.log(`Cleared cache for: ${cacheKey}`);
  } else {
    legislatorCache.clear();
    console.log('Cleared entire legislator cache');
  }
}
