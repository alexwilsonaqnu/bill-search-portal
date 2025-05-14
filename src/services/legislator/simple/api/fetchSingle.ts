
import { supabase } from "@/integrations/supabase/client";
import { LegislatorInfo, LegislatorSearchOptions } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { formatLegislatorFromDbRecord, createBasicLegislator } from '../utils';

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
      return await searchByName(sponsorName, cacheKey);
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
 * Helper function to search by name
 */
async function searchByName(
  sponsorName: string,
  cacheKey: string
): Promise<LegislatorInfo | null> {
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
