
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LegislatorInfo } from './types';
import { getCachedLegislator, cacheLegislator, legislatorCache } from './cache';

/**
 * Fetches legislator information with optimized caching
 */
export async function fetchLegislatorInfo(
  legislatorId?: string, 
  sponsorName?: string
): Promise<LegislatorInfo | null> {
  try {
    if (!legislatorId && !sponsorName) {
      console.warn("Missing both legislator ID and name");
      return null;
    }
    
    // Create cache key based on available identifiers
    const cacheKey = legislatorId ? `id:${legislatorId}` : `name:${sponsorName}`;
    
    // Check cache first
    const cached = getCachedLegislator(cacheKey);
    if (cached) {
      return cached;
    }
    
    console.log(`Fetching legislator info for ID: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);
    
    // Track API call start time for analytics
    const startTime = Date.now();
    
    // Fetch from Supabase IL_Legislators table instead of using the edge function
    let query = supabase.from('IL_legislators').select();
    
    if (legislatorId) {
      // If we have an ID, use it as the primary lookup
      query = query.filter('id', 'eq', legislatorId);
    } else if (sponsorName) {
      // If we only have a name, try to find match
      // First try exact match
      query = query.filter('name', 'eq', sponsorName);
    }
    
    let { data, error } = await query.limit(1);
    
    // If exact match fails and we're searching by name, try a more flexible search
    if ((!data || data.length === 0 || error) && sponsorName && !legislatorId) {
      // Try a more flexible search with ilike
      const { data: flexData, error: flexError } = await supabase
        .from('IL_legislators')
        .select()
        .filter('name', 'ilike', `%${sponsorName}%`)
        .limit(1);
        
      if (flexData && flexData.length > 0 && !flexError) {
        data = flexData;
        error = null;
      }
    }
    
    // Log database query duration
    const duration = Date.now() - startTime;
    console.log(`Legislator DB query took ${duration}ms`);
    
    if (error) {
      console.error("Error fetching legislator info:", error);
      
      // Create a basic fallback when no match found but we have a name
      if (sponsorName) {
        const fallbackLegislator = createBasicLegislatorFromName(sponsorName);
        cacheLegislator(cacheKey, fallbackLegislator);
        return fallbackLegislator;
      }
      
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log("No legislator found in database");
      
      if (sponsorName) {
        const fallbackLegislator = createBasicLegislatorFromName(sponsorName);
        cacheLegislator(cacheKey, fallbackLegislator);
        return fallbackLegislator;
      }
      
      return null;
    }
    
    // Transform database record to LegislatorInfo format
    const legislatorInfo = transformDbRecordToLegislatorInfo(data[0]);
    
    // Store in cache
    cacheLegislator(cacheKey, legislatorInfo);
    
    return legislatorInfo;
  } catch (error) {
    console.error("Error in fetchLegislatorInfo:", error);
    // Don't show toast for every error to avoid overwhelming the user
    if (!error.message?.includes("PGRST116") && legislatorCache.size < 50) {
      toast.error("Error loading legislator information", { 
        description: "Try again later",
        duration: 3000,
        id: "legislator-error" // Prevent duplicate toasts
      });
    }
    
    // Return fallback if we have a name
    if (sponsorName) {
      return createBasicLegislatorFromName(sponsorName);
    }
    
    return null;
  }
}

/**
 * Transform Supabase database record to LegislatorInfo format
 */
function transformDbRecordToLegislatorInfo(record: any): LegislatorInfo {
  // Build name object
  const nameParts = {
    first: record.given_name || '',
    middle: '', // Middle name not in schema
    last: record.family_name || '',
    suffix: '',
    full: record.name || `${record.given_name || ''} ${record.family_name || ''}`.trim()
  };
  
  // Format email and phone as arrays
  const emailArray = record.email ? [record.email] : [];
  const phoneArray = [];
  
  // Add capitol phone if available
  if (record.capitol_voice) {
    phoneArray.push(record.capitol_voice);
  }
  
  // Add district phone if available and different
  if (record.district_voice && record.district_voice !== record.capitol_voice) {
    phoneArray.push(record.district_voice);
  }
  
  return {
    party: record.current_party || '',
    email: emailArray,
    phone: phoneArray,
    district: record.current_district ? record.current_district.toString() : '',
    role: record.current_chamber === 'upper' ? 'Senator' : 
          record.current_chamber === 'lower' ? 'Representative' : 
          'Legislator',
    name: nameParts,
    office: record.capitol_address || '',
    state: 'IL' // Since this is specific to Illinois legislators
  };
}

/**
 * Create a basic legislator object from just the name
 */
function createBasicLegislatorFromName(name: string): LegislatorInfo {
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Try to extract party information if present in parentheses
  let party = '';
  if (name.includes('(D)')) party = 'Democratic';
  else if (name.includes('(R)')) party = 'Republican';
  else if (name.includes('(I)')) party = 'Independent';
  
  // Try to extract role
  let role = 'Legislator';
  if (name.toLowerCase().includes('rep.') || name.toLowerCase().includes('representative')) {
    role = 'Representative';
  } else if (name.toLowerCase().includes('sen.') || name.toLowerCase().includes('senator')) {
    role = 'Senator';
  }
  
  return {
    name: {
      first: firstName,
      middle: '',
      last: lastName,
      suffix: '',
      full: name.replace(/\s*\([^)]*\)/g, '').trim() // Remove party/district info in parentheses
    },
    party,
    email: [],
    phone: [],
    district: '',
    role,
    office: '',
    state: 'IL'
  };
}

// Create a debounce function for API calls
function debounce<F extends (...args: any[]) => Promise<any>>(
  func: F,
  waitFor: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        resolve(await func(...args));
      }, waitFor);
    });
  };

  return debounced;
}

// Export a debounced version for search operations (300ms delay)
export const searchLegislatorDebounced = debounce(
  (sponsorName: string) => fetchLegislatorInfo(undefined, sponsorName),
  300
);

// Add a function to batch fetch multiple legislators at once
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
    try {
      // Fetch all uncached legislators in one query
      const { data, error } = await supabase
        .from('IL_legislators')
        .select()
        .in('id', uncachedIds);
      
      if (error) {
        console.error("Error in batch legislator fetch:", error);
      } else if (data) {
        // Transform and cache each result
        databaseResults = data.map(record => {
          const info = transformDbRecordToLegislatorInfo(record);
          const id = record.id;
          
          if (id) {
            const cacheKey = `id:${id}`;
            cacheLegislator(cacheKey, info);
          }
          
          return { id: record.id || '', data: info };
        });
      }
    } catch (err) {
      console.error("Exception in batch legislator fetch:", err);
    }
  }
  
  // Combine cached and fresh results in original order
  return uniqueIds.map(id => {
    // First check if we have it cached
    const cached = getCachedLegislator(`id:${id}`);
    if (cached) return cached;
    
    // Then check if we got it fresh from the database
    const fresh = databaseResults.find(r => r.id === id);
    return fresh ? fresh.data : null;
  });
}
