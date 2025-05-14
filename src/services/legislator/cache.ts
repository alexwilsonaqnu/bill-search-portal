
import { LegislatorInfo } from './types';

// Global cache to store legislator data across the application
export const legislatorCache = new Map<string, { data: LegislatorInfo; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

/**
 * Check if legislator exists in cache and is not expired
 */
export function getCachedLegislator(cacheKey: string): LegislatorInfo | null {
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
