
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo, LegislatorSearchOptions } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { formatLegislatorFromDbRecord } from '../utils';

/**
 * Search for legislators by name
 */
export async function searchLegislators(
  query: string,
  options: LegislatorSearchOptions = {}
): Promise<LegislatorInfo[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const cleanQuery = query.trim();
  
  try {
    // Check cache first unless force refresh requested
    if (!options.forceRefresh) {
      const cached = getCachedLegislator(`search:${cleanQuery}`);
      if (cached && Array.isArray(cached)) return cached as any;
    }
    
    // Search by name with wildcard
    const { data, error } = await supabase
      .from('IL_legislators')
      .select('*')
      .or(`name.ilike.%${cleanQuery}%,given_name.ilike.%${cleanQuery}%,family_name.ilike.%${cleanQuery}%`)
      .limit(10);
      
    if (error) {
      console.warn(`Error searching legislators: ${error.message}`);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Format and return results
    const legislators = data.map(formatLegislatorFromDbRecord);
    
    // Cache search results
    cacheLegislator(`search:${cleanQuery}`, legislators as any);
    
    return legislators;
  } catch (error) {
    console.error("Error in searchLegislators:", error);
    return [];
  }
}
