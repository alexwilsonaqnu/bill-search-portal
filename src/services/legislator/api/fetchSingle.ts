
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
    
    // First let's check if the table exists and if it has any data
    console.log("Checking IL_legislators table status...");
    const { count, error: countError } = await supabase
      .from('IL_legislators')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error checking table:", countError.message);
    } else {
      console.log(`IL_legislators table contains ${count} records`);
      
      // If table is empty, return fallback right away
      if (count === 0) {
        console.warn("IL_legislators table is empty, using fallback");
        if (sponsorName) {
          const fallback = createBasicLegislatorFromName(sponsorName);
          if (cacheKey) cacheLegislator(cacheKey, fallback);
          return fallback;
        }
        return null;
      }
    }
    
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
  console.log("Starting database query with params:", { legislatorId, sponsorName });
  
  // First, let's dump a few records to see what's in the database
  console.log("Fetching sample records to inspect data format:");
  const { data: sampleData, error: sampleError } = await supabase
    .from('IL_legislators')
    .select('*')
    .limit(3);
    
  if (sampleError) {
    console.error("Error fetching sample data:", sampleError.message);
  } else {
    console.log("Sample records:", sampleData);
  }
  
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
    
    // Check the case sensitivity of the database
    console.log("Testing case sensitivity with ILIKE vs EQ for name field");
    
    // First try case-sensitive match
    const { data: exactData, error: exactError } = await supabase
      .from('IL_legislators')
      .select('*')
      .eq('name', sponsorName)
      .limit(1);
      
    if (!exactError && exactData && exactData.length > 0) {
      console.log("Found legislator by exact name (case-sensitive):", exactData[0].name);
      result = transformDbRecordToLegislatorInfo(exactData[0]);
      if (cacheKey) cacheLegislator(cacheKey, result);
      return result;
    } else {
      console.log("No exact case-sensitive match found.");
    }
    
    // Try with lowercase comparison
    console.log("Trying case-insensitive search...");
    const { data: lowerData, error: lowerError } = await supabase
      .from('IL_legislators')
      .select('*')
      .ilike('name', sponsorName)
      .limit(1);
      
    if (!lowerError && lowerData && lowerData.length > 0) {
      console.log("Found legislator by case-insensitive name:", lowerData[0].name);
      result = transformDbRecordToLegislatorInfo(lowerData[0]);
      if (cacheKey) cacheLegislator(cacheKey, result);
      return result;
    }
    
    // If exact match fails, try with the given_name + family_name fields
    console.log(`Trying given_name + family_name search for: "${sponsorName}"`);
    const nameParts = sponsorName.trim().split(' ');
    
    if (nameParts.length > 1) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      console.log(`Searching with firstName="${firstName}", lastName="${lastName}"`);
      
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
      } else {
        console.log("No match found with given_name and family_name");
      }
    }
    
    // Try flexible name search with wildcards
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
    } else {
      console.log("No flexible name match found");
    }
    
    // Try matching only on family name as last resort
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
      } else {
        console.log("No match found with family_name");
      }
    }
    
    // Final attempt: get the first record from the table to see if there's any data
    console.log(`Last resort: querying any record from the table`);
    const { data: anyData, error: anyError } = await supabase
      .from('IL_legislators')
      .select('*')
      .limit(1);
      
    if (!anyError && anyData && anyData.length > 0) {
      console.log("Found a legislator record:", anyData[0]);
      // Don't return this as a match, but it confirms data exists
    } else if (anyError) {
      console.error("Error in last resort query:", anyError.message);
    } else {
      console.log("No records found in IL_legislators at all");
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
