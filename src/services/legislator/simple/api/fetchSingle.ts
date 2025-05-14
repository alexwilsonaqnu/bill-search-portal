
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo, LegislatorSearchOptions } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { formatLegislatorFromDbRecord, createBasicLegislator } from '../utils';

/**
 * Fetch a legislator by ID or name
 */
export async function fetchLegislator(
  legislatorId?: string, 
  sponsorName?: string,
  options: LegislatorSearchOptions = {}
): Promise<LegislatorInfo | null> {
  // Validate input
  if (!legislatorId && !sponsorName) {
    console.error("fetchLegislator: No ID or name provided");
    return null;
  }
  
  // Create a cache key based on the provided parameters
  const cacheKey = legislatorId ? `id:${legislatorId}` : `name:${sponsorName}`;
  
  // Check cache first unless force refresh requested
  if (!options.forceRefresh) {
    const cached = getCachedLegislator(cacheKey);
    if (cached) return cached;
  }
  
  try {
    let legislatorData: LegislatorInfo | null = null;
    
    // Prioritize ID lookup
    if (legislatorId) {
      const { data, error } = await supabase
        .from('IL_legislators')
        .select('*')
        .eq('id', legislatorId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching legislator by ID:", error.message);
      } else if (data) {
        legislatorData = formatLegislatorFromDbRecord(data);
        console.log(`Found legislator by ID ${legislatorId}:`, legislatorData?.name?.full);
      }
    }
    
    // If no result by ID and name is provided, search by name
    if (!legislatorData && sponsorName) {
      const cleanName = sponsorName.trim().toLowerCase();
      
      // Try exact name match first
      const { data, error } = await supabase
        .from('IL_legislators')
        .select('*')
        .ilike('name', `%${cleanName}%`)
        .limit(1);
      
      if (error) {
        console.error("Error searching legislator by name:", error.message);
      } else if (data && data.length > 0) {
        legislatorData = formatLegislatorFromDbRecord(data[0]);
        console.log(`Found legislator by name ${sponsorName}:`, legislatorData?.name?.full);
      }
      
      // If still no match, try matching on first and last name separately
      if (!legislatorData) {
        // Create a fallback basic legislator
        legislatorData = createBasicLegislator(sponsorName);
      }
    }
    
    // Cache the result
    if (legislatorData) {
      cacheLegislator(cacheKey, legislatorData);
    }
    
    return legislatorData;
  } catch (error) {
    console.error("Unexpected error in fetchLegislator:", error.message);
    return null;
  }
}
