
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { transformDbRecordToLegislatorInfo } from './transformers';

/**
 * Batch fetch multiple legislators at once
 */
export async function fetchMultipleLegislators(legislatorIds: string[]): Promise<(LegislatorInfo | null)[]> {
  if (!legislatorIds || legislatorIds.length === 0) {
    return [];
  }
  
  // Filter out any duplicates
  const uniqueIds = [...new Set(legislatorIds)];
  
  // Check how many we can get from cache first
  const cachedResults = uniqueIds.map(id => {
    const cacheKey = `id:${id}`;
    return { 
      id, 
      cached: getCachedLegislator(cacheKey) 
    };
  });
  
  // Separate cached from uncached
  const cachedIds = cachedResults.filter(r => r.cached).map(r => r.id);
  const uncachedIds = cachedResults.filter(r => !r.cached).map(r => r.id);
  
  console.log(`Batch legislator fetch: ${cachedIds.length} from cache, ${uncachedIds.length} need fetching`);
  
  // If we have uncached IDs that need fetching, fetch from Supabase table
  let databaseResults: {id: string, data: LegislatorInfo}[] = [];
  
  if (uncachedIds.length > 0) {
    databaseResults = await fetchUncachedLegislators(uncachedIds);
  }
  
  // Combine cached and fresh results in original order
  return uniqueIds.map(id => {
    // First check if we have it cached
    const cacheKey = `id:${id}`;
    const cached = getCachedLegislator(cacheKey);
    if (cached) return cached;
    
    // Then check if we got it fresh from the database
    const fresh = databaseResults.find(r => r.id === id);
    return fresh ? fresh.data : null;
  });
}

async function fetchUncachedLegislators(uncachedIds: string[]): Promise<{id: string, data: LegislatorInfo}[]> {
  try {
    console.log("Fetching legislators with IDs:", uncachedIds);

    // Fetch all uncached legislators in one query
    const { data, error } = await supabase
      .from('IL_legislators')
      .select('*')
      .in('id', uncachedIds);
    
    console.log('Batch DB query results:', { data, error });
    
    if (error) {
      console.error("Error in batch legislator fetch:", error);
      return [];
    } else if (data) {
      // Transform and cache each result
      return data.map(record => {
        const info = transformDbRecordToLegislatorInfo(record);
        const id = record.id;
        
        if (id) {
          const cacheKey = `id:${id}`;
          cacheLegislator(cacheKey, info);
        }
        
        return { id: record.id || '', data: info };
      });
    }
    
    return [];
  } catch (err) {
    console.error("Exception in batch legislator fetch:", err);
    return [];
  }
}
