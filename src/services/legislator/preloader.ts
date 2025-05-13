
import { fetchLegislatorInfo } from './api';
import { getLegislatorId, getSponsorName } from './utils';
import { getCachedLegislator } from './cache';

/**
 * Preloads legislator data for multiple sponsors
 */
export function preloadLegislatorData(sponsors: any[]) {
  if (!sponsors || sponsors.length === 0) return;
  
  // Process in the background after a short delay
  setTimeout(() => {
    // Limit preloading to first 3 sponsors to avoid too many requests
    const limitedSponsors = sponsors.slice(0, 3);
    
    // Add a delay between each preload request
    limitedSponsors.forEach((sponsor, index) => {
      setTimeout(() => {
        // Get either ID or name
        const id = getLegislatorId(sponsor);
        const name = getSponsorName(sponsor);
        
        // Skip if we already have this in cache
        const cacheKey = id ? `id:${id}` : `name:${name}`;
        const cached = getCachedLegislator(cacheKey);
        if (cached) {
          return;
        }
        
        // Preload in the background without awaiting
        fetchLegislatorInfo(id, name).catch(() => {
          // Silently fail on preload errors
        });
      }, index * 2000); // 2 second delay between each preload
    });
  }, 1000); // Initial delay before starting preloads
}
