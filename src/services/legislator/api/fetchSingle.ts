
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LegislatorInfo } from '../types';
import { getCachedLegislator, cacheLegislator } from '../cache';
import { transformDbRecordToLegislatorInfo } from './transformers';
import { createBasicLegislatorFromName } from './fallbacks';

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
      console.log(`Using cached legislator data for ${cacheKey}`);
      return cached;
    }
    
    console.log(`Fetching legislator info for ID: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);
    
    // Track API call start time for analytics
    const startTime = Date.now();
    
    // Try using the edge function first if it's available
    const edgeFunctionResult = await tryEdgeFunction(legislatorId, sponsorName, cacheKey);
    if (edgeFunctionResult) {
      return edgeFunctionResult;
    }

    // Fallback to direct Supabase IL_legislators table query
    return await queryDatabaseDirectly(legislatorId, sponsorName, cacheKey, startTime);
  } catch (error) {
    console.error("Error in fetchLegislatorInfo:", error);
    // Don't show toast for every error to avoid overwhelming the user
    if (!error.message?.includes("PGRST116") && error.message) {
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

async function tryEdgeFunction(
  legislatorId?: string,
  sponsorName?: string,
  cacheKey?: string
): Promise<LegislatorInfo | null> {
  try {
    console.log("Attempting to use edge function to fetch legislator data...");
    
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('get-legislator', {
      body: { legislatorId, sponsorName },
    });
    
    if (!edgeFunctionError && edgeFunctionData) {
      console.log('Successfully retrieved legislator data from edge function:', edgeFunctionData);
      if (cacheKey) {
        cacheLegislator(cacheKey, edgeFunctionData);
      }
      return edgeFunctionData;
    }
    
    if (edgeFunctionError) {
      console.warn('Edge function error, falling back to direct DB query:', edgeFunctionError);
    }
    
    return null;
  } catch (edgeError) {
    console.warn('Error calling edge function, falling back to direct DB query:', edgeError);
    return null;
  }
}

async function queryDatabaseDirectly(
  legislatorId?: string,
  sponsorName?: string,
  cacheKey?: string,
  startTime?: number
): Promise<LegislatorInfo | null> {
  console.log("Falling back to direct database query...");
  
  // IMPORTANT: Use lowercase 'l' in 'IL_legislators' to match the actual table name in Supabase
  let query = supabase.from('IL_legislators').select('*');
  
  if (legislatorId) {
    // If we have an ID, use it as the primary lookup
    query = query.eq('id', legislatorId);
    console.log(`Querying IL_legislators with ID: ${legislatorId}`);
  } else if (sponsorName) {
    // If we only have a name, try to find match on name field
    query = query.eq('name', sponsorName);
    console.log(`Querying IL_legislators with exact name: ${sponsorName}`);
  }
  
  let { data, error } = await query.limit(1);
  
  console.log('Supabase direct query results:', { data, error });
  
  // If exact match fails and we're searching by name, try a more flexible search
  if ((!data || data.length === 0 || error) && sponsorName && !legislatorId) {
    const flexResult = await tryFlexibleNameSearch(sponsorName);
    if (flexResult.data) {
      data = flexResult.data;
      error = null;
    }
  }
  
  // Log database query duration
  if (startTime) {
    const duration = Date.now() - startTime;
    console.log(`Legislator DB query took ${duration}ms`);
  }
  
  if (error) {
    console.error("Error fetching legislator info:", error);
    
    // Create a basic fallback when no match found but we have a name
    if (sponsorName) {
      const fallbackLegislator = createBasicLegislatorFromName(sponsorName);
      if (cacheKey) {
        cacheLegislator(cacheKey, fallbackLegislator);
      }
      console.log(`Created fallback legislator for "${sponsorName}":`, fallbackLegislator);
      return fallbackLegislator;
    }
    
    return null;
  }
  
  if (!data || data.length === 0) {
    console.log(`No legislator found in database for ${legislatorId ? `ID: ${legislatorId}` : `name: ${sponsorName}`}`);
    
    if (sponsorName) {
      const fallbackLegislator = createBasicLegislatorFromName(sponsorName);
      if (cacheKey) {
        cacheLegislator(cacheKey, fallbackLegislator);
      }
      console.log(`Created fallback legislator for "${sponsorName}":`, fallbackLegislator);
      return fallbackLegislator;
    }
    
    return null;
  }
  
  // Transform database record to LegislatorInfo format
  const legislatorInfo = transformDbRecordToLegislatorInfo(data[0]);
  console.log(`Successfully transformed legislator data:`, legislatorInfo);
  
  // Store in cache
  if (cacheKey) {
    cacheLegislator(cacheKey, legislatorInfo);
  }
  
  return legislatorInfo;
}

async function tryFlexibleNameSearch(sponsorName: string) {
  console.log(`No exact match for name "${sponsorName}", trying flexible search with ilike`);
  
  // IMPORTANT: Use lowercase 'l' in 'IL_legislators' to match the actual table name in Supabase
  const { data: flexData, error: flexError } = await supabase
    .from('IL_legislators')
    .select('*')
    .ilike('name', `%${sponsorName}%`)
    .limit(1);
    
  console.log('Flexible search results:', { flexData, flexError });
  
  return { data: flexData, error: flexError };
}
