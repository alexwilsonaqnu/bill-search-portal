
import { LegislatorInfo } from './types';

/**
 * Simple in-memory cache for legislator data
 */
const legislatorCache = new Map<string, { data: LegislatorInfo; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes cache lifetime

/**
 * Get cached legislator data if available and not expired
 */
export function getCachedLegislator(cacheKey: string, forceRefresh = false): LegislatorInfo | null {
  if (forceRefresh) {
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
 * Store legislator data in cache
 */
export function cacheLegislator(cacheKey: string, data: LegislatorInfo): void {
  legislatorCache.set(cacheKey, { 
    data, 
    timestamp: Date.now() 
  });
  console.log(`Cached legislator data for: ${cacheKey}`);
}

/**
 * Clear specific entry or entire legislator cache
 */
export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    legislatorCache.delete(cacheKey);
    console.log(`Cleared legislator cache for: ${cacheKey}`);
  } else {
    legislatorCache.clear();
    console.log('Cleared entire legislator cache');
  }
}
