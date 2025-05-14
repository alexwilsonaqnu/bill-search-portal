
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LegislatorInfo } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { transformDbRecordToLegislatorInfo } from './transformers';
import { createBasicLegislatorFromName } from './fallbacks';

/**
 * Fetches legislator information by ID or name
 * @param legislatorId Optional ID of the legislator
 * @param sponsorName Optional name of the legislator
 * @param forceRefresh Optional flag to force refresh from database
 */
export async function fetchLegislatorInfo(
  legislatorId?: string, 
  sponsorName?: string,
  forceRefresh = false
): Promise<LegislatorInfo | null> {
  try {
    // Validate we have at least one identifier
    if (!legislatorId && !sponsorName) {
      console.warn("Missing both legislator ID and name");
      return null;
    }
    
    // Create cache key based on available identifiers
    const cacheKey = legislatorId ? `id:${legislatorId}` : `name:${sponsorName}`;
    
    // Check cache first (unless force refresh is requested)
    const cached = getCachedLegislator(cacheKey, forceRefresh);
    if (cached) {
      console.log(`Using cached legislator data for ${cacheKey}`);
      return cached;
    }
    
    console.log(`Fetching legislator for ID: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}, Force refresh: ${forceRefresh}`);
    
    // Query the database directly
    return await queryDatabase(legislatorId, sponsorName, cacheKey);
  } catch (error) {
    console.error("Error in fetchLegislatorInfo:", error);
    
    // Return fallback if we have a name
    if (sponsorName) {
      return createBasicLegislatorFromName(sponsorName);
    }
    
    return null;
  }
}

async function queryDatabase(
  legislatorId?: string,
  sponsorName?: string,
  cacheKey?: string
): Promise<LegislatorInfo | null> {
  console.log("Querying IL_legislators table with params:", { legislatorId, sponsorName });
  
  // First attempt: Try with provided identifiers
  let result = null;
  
  // First try using ID if available
  if (legislatorId) {
    console.log(`Querying by ID: ${legislatorId}`);
    const { data, error } = await supabase
      .from('IL_legislators')
      .select('*')
      .eq('id', legislatorId)
      .limit(1);
    
    if (!error && data && data.length > 0) {
      console.log("Found legislator by ID:", data[0].name);
      result = transformDbRecordToLegislatorInfo(data[0]);
      if (cacheKey) cacheLegislator(cacheKey, result);
      return result;
    } else if (error) {
      console.warn(`Error querying by ID: ${error.message}`);
    } else {
      console.log(`No legislator found with ID: ${legislatorId}`);
    }
  }
  
  // Then try exact name match if available
  if (sponsorName) {
    console.log(`Querying by exact name: "${sponsorName}"`);
    
    // Check if the table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('IL_legislators')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tableError) {
      console.error("Error checking IL_legislators table:", tableError.message);
    } else {
      console.log("IL_legislators table exists, records count:", tableInfo);
    }
    
    // Query with exact name match
    const { data, error } = await supabase
      .from('IL_legislators')
      .select('*')
      .eq('name', sponsorName)
      .limit(1);
      
    if (!error && data && data.length > 0) {
      console.log("Found legislator by exact name:", data[0].name);
      result = transformDbRecordToLegislatorInfo(data[0]);
      if (cacheKey) cacheLegislator(cacheKey, result);
      return result;
    } else if (error) {
      console.warn(`Error querying by exact name: ${error.message}`);
    } else {
      console.log(`No exact name match for: "${sponsorName}"`);
    }
    
    // If exact match fails, try with the given_name + family_name fields
    console.log(`Trying given_name + family_name search for: "${sponsorName}"`);
    const nameParts = sponsorName.trim().split(' ');
    
    if (nameParts.length > 1) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      const { data: namePartsData, error: namePartsError } = await supabase
        .from('IL_legislators')
        .select('*')
        .eq('given_name', firstName)
        .eq('family_name', lastName)
        .limit(1);
        
      if (!namePartsError && namePartsData && namePartsData.length > 0) {
        console.log("Found legislator by first+last name:", namePartsData[0].name);
        result = transformDbRecordToLegislatorInfo(namePartsData[0]);
        if (cacheKey) cacheLegislator(cacheKey, result);
        return result;
      }
    }
    
    // If name parts search fails, try ILIKE on name
    console.log(`Trying flexible name search for: "${sponsorName}"`);
    const { data: flexData, error: flexError } = await supabase
      .from('IL_legislators')
      .select('*')
      .ilike('name', `%${sponsorName}%`)
      .limit(1);
      
    if (!flexError && flexData && flexData.length > 0) {
      console.log("Found legislator by flexible name search:", flexData[0].name);
      result = transformDbRecordToLegislatorInfo(flexData[0]);
      if (cacheKey) cacheLegislator(cacheKey, result);
      return result;
    }
    
    // Try even more flexible search - match on just family_name
    if (nameParts.length > 0) {
      const lastName = nameParts[nameParts.length - 1];
      console.log(`Trying family_name search for: "${lastName}"`);
      
      const { data: lastNameData, error: lastNameError } = await supabase
        .from('IL_legislators')
        .select('*')
        .ilike('family_name', `%${lastName}%`)
        .limit(1);
        
      if (!lastNameError && lastNameData && lastNameData.length > 0) {
        console.log("Found legislator by family name:", lastNameData[0].name);
        result = transformDbRecordToLegislatorInfo(lastNameData[0]);
        if (cacheKey) cacheLegislator(cacheKey, result);
        return result;
      }
    }
    
    // Last resort: try current_party
    console.log(`Trying any search with current_party:`);
    const { data: partyData, error: partyError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(1);
      
    if (!partyError && partyData && partyData.length > 0) {
      console.log("Found legislator using first record:", partyData[0]);
      result = transformDbRecordToLegislatorInfo(partyData[0]);
      if (cacheKey) cacheLegislator(cacheKey, result);
      return result;
    } else if (partyError) {
      console.error("Error in party search:", partyError.message);
    } else {
      console.log("No records found in IL_legislators");
    }
    
    // Last resort: return fallback legislator data
    console.log(`No match found for "${sponsorName}", creating fallback data`);
    const fallback = createBasicLegislatorFromName(sponsorName);
    if (cacheKey) cacheLegislator(cacheKey, fallback);
    return fallback;
  }
  
  console.log("No legislator found with provided parameters");
  return null;
}
