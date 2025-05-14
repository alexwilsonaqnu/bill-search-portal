
import { fetchWithBackoff } from "./fetcher.ts";
import { getCachedLegislator, setCachedLegislator } from "./cache.ts";
import { createFallbackLegislator, createEnhancedLegislatorFromName } from "./fallbackData.ts";
import { corsHeaders, processOpenStatesResponse, cleanNameForSearch } from "./utils.ts";

// Get API key or throw an error if not configured
export function getApiKey(): string {
  const OPENSTATES_API_KEY = Deno.env.get("OPENSTATES_API_KEY") || Deno.env.get("OPEN_STATES_API_KEY");
  
  if (!OPENSTATES_API_KEY) {
    console.error("OpenStates API key not configured");
    throw new Error("OpenStates API key not configured");
  }
  
  return OPENSTATES_API_KEY;
}

// Fetch legislator by ID from OpenStates API with improved error handling
export async function fetchLegislatorById(legislatorId: string) {
  if (!legislatorId) return null;
  
  const cacheKey = `id-${legislatorId}`;
  const cachedData = getCachedLegislator(cacheKey);
  if (cachedData) {
    console.log(`Using cached legislator data for ID: ${legislatorId}`);
    return cachedData;
  }

  try {
    console.log(`Cache miss - fetching fresh data for legislator ID: ${legislatorId}`);
    const OPENSTATES_API_KEY = getApiKey();

    // Use backoff mechanism to handle rate limiting
    console.log(`Making API request to OpenStates for legislator ID: ${legislatorId}`);
    const response = await fetchWithBackoff(`https://v3.openstates.org/people/${legislatorId}?include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    }, 2, 1000);

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status} ${response.statusText}`);
      
      // For 429 (Too Many Requests) errors, return a fallback object
      if (response.status === 429) {
        console.log(`Rate limit hit (429) for legislator ID: ${legislatorId}, using fallback`);
        return createFallbackLegislator(legislatorId);
      }
      
      return null;
    }

    const data = await response.json();
    console.log(`Successfully fetched data from OpenStates for ID: ${legislatorId}`);
    const processed = processOpenStatesResponse(data);
    console.log(`Processed OpenStates response for ID: ${legislatorId}`);
    setCachedLegislator(cacheKey, processed);
    return processed;
  } catch (error) {
    console.error(`Exception in fetchLegislatorById for ${legislatorId}:`, error);
    return createFallbackLegislator(legislatorId);
  }
}

// Search legislator by name from OpenStates API with improved caching
export async function searchLegislatorByName(name: string) {
  if (!name) return null;
  
  const cleanedName = cleanNameForSearch(name);
  const cacheKey = `name-${cleanedName}`;
  const cachedData = getCachedLegislator(cacheKey);
  if (cachedData) {
    console.log(`Using cached legislator data for name: ${cleanedName}`);
    return cachedData;
  }

  try {
    console.log(`Cache miss - searching for legislator with name: ${cleanedName}`);
    const OPENSTATES_API_KEY = getApiKey();

    console.log(`Making API request to OpenStates for name search: ${cleanedName}`);
    const response = await fetchWithBackoff(`https://v3.openstates.org/people?name=${encodeURIComponent(cleanedName)}&include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    }, 2, 1000);

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status} ${response.statusText}`);
      // If we hit a rate limit, return a basic legislator object
      return createEnhancedLegislatorFromName(name);
    }

    const data = await response.json();
    console.log(`Search returned ${data.results?.length || 0} results for "${cleanedName}"`);
    
    if (!data.results || data.results.length === 0) {
      // Return basic info if no results found
      console.log(`No results found for name search: ${cleanedName}, creating fallback`);
      return createEnhancedLegislatorFromName(name);
    }

    // Find best match - for simplicity, just take the first result
    console.log(`Processing first match for name: ${cleanedName}`);
    const processed = processOpenStatesResponse(data.results[0]);
    setCachedLegislator(cacheKey, processed);
    return processed;
  } catch (error) {
    console.error(`Exception in searchLegislatorByName for ${name}:`, error);
    return createEnhancedLegislatorFromName(name);
  }
}
