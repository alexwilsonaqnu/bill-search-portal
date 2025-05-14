
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
  // Use lowercase 'l' in 'IL_legislators' to match the actual table name in Supabase
  let query = supabase.from('IL_legislators').select('*');
  
  if (legislatorId) {
    // If we have an ID, use it as the primary lookup
    query = query.eq('id', legislatorId);
    console.log(`Querying with ID: ${legislatorId}`);
  } else if (sponsorName) {
    // If we only have a name, try to find match on name field
    query = query.eq('name', sponsorName);
    console.log(`Querying with exact name: ${sponsorName}`);
  }
  
  let { data, error } = await query.limit(1);
  
  console.log('Database query results:', { 
    found: !!data && data.length > 0, 
    error: error?.message 
  });
  
  // If exact match fails and we're searching by name, try a flexible search
  if ((!data || data.length === 0) && sponsorName && !legislatorId) {
    console.log(`No exact match for "${sponsorName}", trying flexible search`);
    
    const { data: flexData, error: flexError } = await supabase
      .from('IL_legislators')
      .select('*')
      .ilike('name', `%${sponsorName}%`)
      .limit(1);
      
    if (!flexError && flexData && flexData.length > 0) {
      console.log('Found match with flexible search:', flexData[0].name);
      data = flexData;
      error = null;
    }
  }
  
  if (error) {
    console.warn(`Database error: ${error.message}`);
    
    // Create basic fallback for name searches
    if (sponsorName) {
      const fallback = createBasicLegislatorFromName(sponsorName);
      if (cacheKey) cacheLegislator(cacheKey, fallback);
      return fallback;
    }
    
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log(`No legislator found for ${legislatorId ? `ID: ${legislatorId}` : `name: ${sponsorName}`}`);
    
    if (sponsorName) {
      const fallback = createBasicLegislatorFromName(sponsorName);
      if (cacheKey) cacheLegislator(cacheKey, fallback);
      return fallback;
    }
    
    return null;
  }
  
  // Transform database record to LegislatorInfo format
  const legislatorInfo = transformDbRecordToLegislatorInfo(data[0]);
  
  // Store in cache
  if (cacheKey) {
    cacheLegislator(cacheKey, legislatorInfo);
  }
  
  return legislatorInfo;
}
