
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LegislatorInfo } from './types';
import { getCachedLegislator, cacheLegislator, legislatorCache } from './cache';

// Create a debounce function for API calls
const debounce = <F extends (...args: any[]) => Promise<any>>(
  func: F,
  waitFor: number
) => {
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
};

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
    
    // Using our dedicated edge function to handle rate limiting and caching
    const { data, error } = await supabase.functions.invoke('get-legislator', {
      body: { legislatorId, sponsorName }
    });
    
    // Log API call duration for monitoring
    const duration = Date.now() - startTime;
    console.log(`OpenStates API call took ${duration}ms`);
    
    if (error) {
      console.error("Error fetching legislator info:", error);
      throw new Error(error.message || "Failed to load legislator information");
    }
    
    // Validate that we have the expected data format
    if (!data || typeof data !== 'object') {
      console.error("Invalid legislator data format:", data);
      return null;
    }
    
    // Ensure email and phone are arrays for consistent handling
    const legislatorInfo: LegislatorInfo = {
      ...data,
      email: Array.isArray(data.email) ? data.email : data.email ? [data.email] : [],
      phone: Array.isArray(data.phone) ? data.phone : data.phone ? [data.phone] : []
    };
    
    // Store in cache
    cacheLegislator(cacheKey, legislatorInfo);
    
    return legislatorInfo;
  } catch (error) {
    console.error("Error in fetchLegislatorInfo:", error);
    // Don't show toast for every error to avoid overwhelming the user
    if (error.message !== "OpenStates API key not configured" && 
        !error.message.includes("rate limit") && 
        legislatorCache.size < 50) { // Only show toast if we haven't shown too many already
      toast.error("Error loading legislator information", { 
        description: "Try again later",
        duration: 3000,
        id: "legislator-error" // Prevent duplicate toasts
      });
    }
    return null;
  }
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
  
  // If we have uncached IDs that need fetching, do it in one batch API call
  let freshResults: {id: string, data: LegislatorInfo | null}[] = [];
  
  if (uncachedIds.length > 0) {
    try {
      const { data, error } = await supabase.functions.invoke('get-legislator', {
        body: { legislatorId: uncachedIds } // This passes an array to trigger batch mode
      });
      
      if (error) {
        console.error("Error in batch legislator fetch:", error);
      } else if (data?.results) {
        // Cache each result individually
        freshResults = data.results;
        for (const result of freshResults) {
          if (result.data) {
            const cacheKey = `id:${result.id}`;
            cacheLegislator(cacheKey, result.data);
          }
        }
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
    
    // Then check if we got it fresh from the API
    const fresh = freshResults.find(r => r.id === id);
    return fresh ? fresh.data : null;
  });
}
