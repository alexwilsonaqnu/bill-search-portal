
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define the legislator info interface
export interface LegislatorName {
  first: string;
  middle: string;
  last: string;
  suffix: string;
  full: string;
}

export interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
  district: string;
  role: string;
  name: LegislatorName;
  office?: string;
  state?: string;
}

// Global cache to store legislator data across the application
const legislatorCache = new Map<string, { data: LegislatorInfo; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

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
    const cached = legislatorCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Using cached legislator data for: ${cacheKey}`);
      return cached.data;
    }
    
    console.log(`Fetching legislator info for ID: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);
    
    // Using our dedicated edge function to handle rate limiting and caching
    const { data, error } = await supabase.functions.invoke('get-legislator', {
      body: { legislatorId, sponsorName }
    });
    
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
    legislatorCache.set(cacheKey, { 
      data: legislatorInfo, 
      timestamp: Date.now() 
    });
    
    return legislatorInfo;
  } catch (error) {
    console.error("Error in fetchLegislatorInfo:", error);
    // Don't show toast for every error to avoid overwhelming the user
    if (error.message !== "OpenStates API key not configured") {
      toast.error("Error loading legislator information", { 
        description: "Try again later",
        duration: 3000,
        id: "legislator-error" // Prevent duplicate toasts
      });
    }
    return null;
  }
}

/**
 * Preloads legislator data for multiple sponsors
 */
export function preloadLegislatorData(sponsors: any[]) {
  if (!sponsors || sponsors.length === 0) return;
  
  // Process in the background after a short delay
  setTimeout(() => {
    sponsors.forEach(sponsor => {
      // Get either ID or name
      const id = getLegislatorId(sponsor);
      const name = getSponsorName(sponsor);
      
      // Preload in the background without awaiting
      fetchLegislatorInfo(id, name).catch(() => {
        // Silently fail on preload errors
      });
    });
  }, 100);
}

// Helper functions to extract sponsor data
function getLegislatorId(sponsorData: any): string | undefined {
  if (!sponsorData || typeof sponsorData === 'string') {
    return undefined;
  }
  
  return sponsorData.people_id?.toString() || 
         sponsorData.id?.toString() || 
         sponsorData.legislator_id?.toString() || 
         undefined;
}

function getSponsorName(sponsorData: any): string {
  if (typeof sponsorData === 'string') return sponsorData;
  if (!sponsorData) return 'Unknown';
  
  if (typeof sponsorData.name === 'string') return sponsorData.name;
  if (typeof sponsorData.full_name === 'string') return sponsorData.full_name;
  
  const nameParts = [];
  if (sponsorData.first_name) nameParts.push(sponsorData.first_name);
  if (sponsorData.middle_name) nameParts.push(sponsorData.middle_name);
  if (sponsorData.last_name) nameParts.push(sponsorData.last_name);
  
  if (nameParts.length > 0) {
    const fullName = nameParts.join(' ');
    if (sponsorData.suffix) return `${fullName}, ${sponsorData.suffix}`;
    return fullName;
  }
  
  let displayName = 'Unknown';
  if (sponsorData.role) {
    displayName = `${sponsorData.role}.`;
    if (sponsorData.party) displayName += ` (${sponsorData.party})`;
  } else if (sponsorData.title) {
    displayName = sponsorData.title;
  }
  
  return displayName;
}
