
import { LegislatorInfo } from '../types';
import { getCachedLegislator } from '../cache';
import { createBasicLegislatorFromName } from './fallbacks';
import { searchById, searchByName, verifyTableHasData } from './helpers/searchStrategies';
import { getSampleRecords } from './helpers/dbQueries';

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
    
    // Fetch a few sample records to help debug database issues
    await getSampleRecords();
    
    // Check if the legislators table has data
    const hasData = await verifyTableHasData();
    if (!hasData) {
      console.warn("il_legislators table is empty or inaccessible, using fallback");
      if (sponsorName) {
        const fallback = createBasicLegislatorFromName(sponsorName);
        return fallback;
      }
      return null;
    }
    
    // First try by ID if available
    if (legislatorId) {
      const result = await searchById(legislatorId, cacheKey);
      if (result) return result;
    }
    
    // Then try by name if available
    if (sponsorName) {
      return await searchByName(sponsorName, cacheKey);
    }
    
    console.log("No legislator found with provided parameters");
    return null;
  } catch (error) {
    console.error("Error in fetchLegislatorInfo:", error);
    
    // Return fallback if we have a name
    if (sponsorName) {
      return createBasicLegislatorFromName(sponsorName);
    }
    
    return null;
  }
}
