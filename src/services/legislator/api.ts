
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
