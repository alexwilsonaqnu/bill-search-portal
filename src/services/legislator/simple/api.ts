
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo, LegislatorSearchOptions } from './types';
import { getCachedLegislator, cacheLegislator } from './cache';
import { formatLegislatorFromDbRecord, createBasicLegislator } from './utils';

/**
 * Fetch a single legislator by ID or name
 */
export async function fetchLegislator(
  legislatorId?: string,
  sponsorName?: string,
  options: LegislatorSearchOptions = {}
): Promise<LegislatorInfo | null> {
  try {
    // Need at least one identifier
    if (!legislatorId && !sponsorName) {
      console.log("Missing legislator ID and name");
      return null;
    }
    
    // Create cache key based on available identifiers
    const cacheKey = legislatorId ? `id:${legislatorId}` : `name:${sponsorName}`;
    
    // Check cache first unless force refresh requested
    if (!options.forceRefresh) {
      const cached = getCachedLegislator(cacheKey);
      if (cached) return cached;
    }
    
    console.log(`Fetching legislator info for ID: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);
    
    // First try by ID if available
    if (legislatorId) {
      const { data, error } = await supabase
        .from('IL_legislators')
        .select('*')
        .eq('id', legislatorId)
        .limit(1);
        
      if (!error && data && data.length > 0) {
        console.log(`Found legislator by ID: ${legislatorId}`);
        const legislator = formatLegislatorFromDbRecord(data[0]);
        cacheLegislator(cacheKey, legislator);
        return legislator;
      }
      
      // Log error or no results
      if (error) {
        console.warn(`Error querying by ID: ${error.message}`);
      } else {
        console.log(`No legislator found with ID: ${legislatorId}`);
      }
    }
    
    // Try by name if available
    if (sponsorName) {
      const cleanedName = sponsorName.trim();
      
      // First try exact match
      const { data: exactData, error: exactError } = await supabase
        .from('IL_legislators')
        .select('*')
        .ilike('name', cleanedName)
        .limit(1);
        
      if (!exactError && exactData && exactData.length > 0) {
        console.log(`Found legislator by name: ${cleanedName}`);
        const legislator = formatLegislatorFromDbRecord(exactData[0]);
        cacheLegislator(cacheKey, legislator);
        return legislator;
      }
      
      // If exact match fails, try with name parts
      const nameParts = cleanedName.split(' ');
      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        
        const { data: namePartsData, error: namePartsError } = await supabase
          .from('IL_legislators')
          .select('*')
          .ilike('given_name', `%${firstName}%`)
          .ilike('family_name', `%${lastName}%`)
          .limit(1);
          
        if (!namePartsError && namePartsData && namePartsData.length > 0) {
          console.log(`Found legislator by name parts: ${firstName} ${lastName}`);
          const legislator = formatLegislatorFromDbRecord(namePartsData[0]);
          cacheLegislator(cacheKey, legislator);
          return legislator;
        }
      }
      
      // If no match found, create basic info from name
      console.log(`Creating basic legislator info for: ${cleanedName}`);
      const fallback = createBasicLegislator(cleanedName);
      cacheLegislator(cacheKey, fallback);
      return fallback;
    }
    
    return null;
  } catch (error) {
    console.error("Error in fetchLegislator:", error);
    
    // If we have a name, create fallback
    if (sponsorName) {
      return createBasicLegislator(sponsorName);
    }
    
    return null;
  }
}

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

/**
 * Preload legislator data for a list of sponsors
 */
export function preloadLegislatorData(sponsors: any[]): void {
  if (!sponsors || sponsors.length === 0) return;
  
  // Extract IDs where possible
  const sponsorData = sponsors.map(sponsor => ({
    id: sponsor?.people_id || sponsor?.id || sponsor?.legislator_id,
    name: typeof sponsor === 'string' ? sponsor : sponsor?.name || sponsor?.full_name
  }));
  
  // Fetch in the background without awaiting
  setTimeout(() => {
    sponsorData.forEach(async (sponsor) => {
      if (sponsor.id) {
        fetchLegislator(sponsor.id);
      } else if (sponsor.name) {
        fetchLegislator(undefined, sponsor.name);
      }
    });
  }, 0);
}

/**
 * Clear the legislator cache
 */
export function clearLegislatorCache(cacheKey?: string): void {
  clearCache(cacheKey);
}

// Create a debounced version of the search function
export const searchLegislatorDebounced = debounce(
  (name: string, options?: LegislatorSearchOptions) => fetchLegislator(undefined, name, options),
  300
);

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        resolve(func(...args));
      }, delay);
    });
  };
}
