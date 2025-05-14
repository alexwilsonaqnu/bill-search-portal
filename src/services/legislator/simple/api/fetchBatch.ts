
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo, LegislatorSearchOptions } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { formatLegislatorFromDbRecord, createBasicLegislator } from '../utils';
import { fetchLegislator } from './fetchSingle';

/**
 * Fetch multiple legislators by ID in a single request
 */
export async function fetchMultipleLegislators(
  legislatorIds: string[],
  options: LegislatorSearchOptions = {}
): Promise<(LegislatorInfo | null)[]> {
  if (!legislatorIds || legislatorIds.length === 0) {
    return [];
  }
  
  // Remove duplicates
  const uniqueIds = [...new Set(legislatorIds)];
  
  // Check cache first for each ID
  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      // Try cache first unless force refresh requested
      if (!options.forceRefresh) {
        const cached = getCachedLegislator(`id:${id}`);
        if (cached) return cached;
      }
      
      // Fetch individually if not cached
      return await fetchLegislator(id, undefined, options);
    })
  );
  
  return results;
}
