
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { transformDbRecordToLegislatorInfo } from './transformers';
import { createBasicLegislatorFromName } from './fallbacks';

/**
 * Fetch multiple legislators in a single request
 * @param legislatorIds Array of legislator IDs to fetch
 * @param forceRefresh Flag to bypass cache
 */
export async function fetchMultipleLegislators(
  legislatorIds: string[],
  forceRefresh = false
): Promise<(LegislatorInfo | null)[]> {
  try {
    if (!legislatorIds || legislatorIds.length === 0) {
      console.log('fetchMultipleLegislators called with empty ID array');
      return [];
    }

    console.log(`Fetching ${legislatorIds.length} legislators, forceRefresh: ${forceRefresh}`);
    
    // Create a new array with unique IDs to avoid duplicates
    const uniqueIds = [...new Set(legislatorIds)];
    console.log(`Fetching ${uniqueIds.length} unique legislator IDs`);
    
    // Create a map to track which IDs we've already processed
    const results: (LegislatorInfo | null)[] = [];
    const processedIds = new Set<string>();
    
    // First check cache for each ID
    for (const id of uniqueIds) {
      const cacheKey = `id:${id}`;
      const cached = getCachedLegislator(cacheKey, forceRefresh);
      
      if (cached) {
        console.log(`Using cached data for legislator ID: ${id}`);
        results.push(cached);
        processedIds.add(id);
      }
    }
    
    // If all IDs were found in cache, return early
    if (processedIds.size === uniqueIds.length) {
      console.log('All legislators found in cache');
      return results;
    }
    
    // Get remaining IDs that weren't in the cache
    const remainingIds = uniqueIds.filter(id => !processedIds.has(id));
    console.log(`Fetching ${remainingIds.length} remaining legislators from database`);
    
    // Fetch the remaining IDs from the database in a single query
    const { data, error } = await supabase
      .from('IL_legislators')
      .select('*')
      .in('id', remainingIds);
      
    if (error) {
      console.error(`Error fetching legislators: ${error.message}`);
    }
    
    // Process the database results
    if (data && data.length > 0) {
      console.log(`Found ${data.length} legislators in database`);
      
      // Create a map of ID to database record for fast lookups
      const legislatorMap = new Map();
      for (const record of data) {
        if (record.id) {
          legislatorMap.set(record.id, record);
        }
      }
      
      // Now add database results and fallbacks in the same order as the input array
      for (const id of uniqueIds) {
        if (processedIds.has(id)) {
          // Skip IDs we already processed from cache
          continue;
        }
        
        const record = legislatorMap.get(id);
        if (record) {
          const legislatorInfo = transformDbRecordToLegislatorInfo(record);
          cacheLegislator(`id:${id}`, legislatorInfo);
          results.push(legislatorInfo);
        } else {
          // Create a fallback for IDs not found in database
          console.log(`No data found for legislator ID: ${id}`);
          const fallback = createBasicLegislatorFromName(`Legislator ${id}`);
          cacheLegislator(`id:${id}`, fallback);
          results.push(fallback);
        }
      }
    } else {
      console.warn('No legislators found in database');
      
      // Add fallbacks for all remaining IDs
      for (const id of remainingIds) {
        const fallback = createBasicLegislatorFromName(`Legislator ${id}`);
        cacheLegislator(`id:${id}`, fallback);
        results.push(fallback);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in fetchMultipleLegislators:', error);
    
    // Return fallbacks for all IDs
    return legislatorIds.map(id => {
      const fallback = createBasicLegislatorFromName(`Legislator ${id}`);
      return fallback;
    });
  }
}
