
import { corsHeaders, processOpenStatesResponse, cleanNameForSearch } from "./utils.ts";

// In-memory cache with improved structure and TTL
const legislatorCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter implementation
const API_RATE_LIMITS = {
  lastRequest: 0,
  minInterval: 1000, // Minimum 1 second between requests
  requestCount: 0,
  maxRequests: 5, // Max 5 requests per minute
  resetTime: 0
};

// Reset the rate limiter counter every minute
setInterval(() => {
  if (Date.now() > API_RATE_LIMITS.resetTime) {
    API_RATE_LIMITS.requestCount = 0;
    API_RATE_LIMITS.resetTime = Date.now() + 60000; // 1 minute from now
    console.log("Rate limit counter reset");
  }
}, 60000);

// Implements exponential backoff for retries with rate limiting awareness
async function fetchWithBackoff(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  // Check if we're within rate limits
  const now = Date.now();
  const timeSinceLastRequest = now - API_RATE_LIMITS.lastRequest;
  
  // Enforce minimum interval between requests
  if (timeSinceLastRequest < API_RATE_LIMITS.minInterval) {
    const waitTime = API_RATE_LIMITS.minInterval - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Check if we've hit the maximum requests per minute
  if (API_RATE_LIMITS.requestCount >= API_RATE_LIMITS.maxRequests) {
    console.log(`Rate limit exceeded: max ${API_RATE_LIMITS.maxRequests} requests per minute`);
    // Wait until the next reset
    await new Promise(resolve => setTimeout(resolve, 
      Math.max(100, API_RATE_LIMITS.resetTime - Date.now())));
    API_RATE_LIMITS.requestCount = 0;
  }
  
  // Update rate limit tracking
  API_RATE_LIMITS.lastRequest = Date.now();
  API_RATE_LIMITS.requestCount++;
  
  // If this is our first request in this period, set the reset time
  if (API_RATE_LIMITS.requestCount === 1) {
    API_RATE_LIMITS.resetTime = Date.now() + 60000; // 1 minute from now
  }
  
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      // Get retry-after header or use exponential backoff
      const retryAfter = response.headers.get('retry-after');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
      
      console.log(`Rate limited (429), retrying after ${waitTime}ms. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.error(`Fetch error: ${error.message}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Get API key or throw an error if not configured
export function getApiKey(): string {
  const OPENSTATES_API_KEY = Deno.env.get("OPENSTATES_API_KEY") || Deno.env.get("OPEN_STATES_API_KEY");
  
  if (!OPENSTATES_API_KEY) {
    console.error("OpenStates API key not configured");
    throw new Error("OpenStates API key not configured");
  }
  
  return OPENSTATES_API_KEY;
}

// Check cache first before making API request
function getCachedLegislator(cacheKey: string): any | null {
  if (legislatorCache.has(cacheKey)) {
    const { data, timestamp } = legislatorCache.get(cacheKey);
    const now = Date.now();
    
    if (now - timestamp < CACHE_TTL) {
      console.log(`Cache hit for: ${cacheKey}`);
      return data;
    } else {
      // Remove expired cache entry
      legislatorCache.delete(cacheKey);
    }
  }
  return null;
}

// Set cache for legislator data
function setCachedLegislator(cacheKey: string, data: any): void {
  legislatorCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached legislator: ${cacheKey}`);
}

// Fetch legislator by ID from OpenStates API with improved error handling
export async function fetchLegislatorById(legislatorId: string) {
  if (!legislatorId) return null;
  
  const cacheKey = `id-${legislatorId}`;
  const cachedData = getCachedLegislator(cacheKey);
  if (cachedData) return cachedData;

  try {
    const OPENSTATES_API_KEY = getApiKey();

    // Use backoff mechanism to handle rate limiting
    const response = await fetchWithBackoff(`https://v3.openstates.org/people/${legislatorId}?include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    }, 2, 1000);

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status}`);
      
      // For 429 (Too Many Requests) errors, return a fallback object
      if (response.status === 429) {
        return createFallbackLegislator(legislatorId);
      }
      
      return null;
    }

    const data = await response.json();
    const processed = processOpenStatesResponse(data);
    setCachedLegislator(cacheKey, processed);
    return processed;
  } catch (error) {
    console.error("Error fetching from OpenStates:", error);
    return createFallbackLegislator(legislatorId);
  }
}

// Search legislator by name from OpenStates API with improved caching
export async function searchLegislatorByName(name: string) {
  if (!name) return null;
  
  const cleanedName = cleanNameForSearch(name);
  const cacheKey = `name-${cleanedName}`;
  const cachedData = getCachedLegislator(cacheKey);
  if (cachedData) return cachedData;

  try {
    console.log(`Searching for legislator with name: ${cleanedName}`);
    const OPENSTATES_API_KEY = getApiKey();

    const response = await fetchWithBackoff(`https://v3.openstates.org/people?name=${encodeURIComponent(cleanedName)}&include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    }, 2, 1000);

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status}`);
      // If we hit a rate limit, return a basic legislator object
      return createEnhancedLegislatorFromName(name);
    }

    const data = await response.json();
    
    // Debug the results
    console.log(`Search returned ${data.results?.length || 0} results`);
    
    if (!data.results || data.results.length === 0) {
      // Return basic info if no results found
      return createEnhancedLegislatorFromName(name);
    }

    // Find best match - for simplicity, just take the first result
    const processed = processOpenStatesResponse(data.results[0]);
    setCachedLegislator(cacheKey, processed);
    return processed;
  } catch (error) {
    console.error("Error searching OpenStates:", error);
    return createEnhancedLegislatorFromName(name);
  }
}

// Create a fallback legislator object when we can't fetch by ID
function createFallbackLegislator(legislatorId: string) {
  return {
    name: {
      first: "",
      middle: "",
      last: "",
      suffix: "",
      full: `Legislator ${legislatorId}`
    },
    party: "",
    email: [],
    phone: [],
    district: "",
    role: "Legislator",
    office: "",
    state: "Illinois" // Default to Illinois since we're in the Billinois app
  };
}

// Enhanced function to create a more detailed legislator object from just the name when API fails
function createEnhancedLegislatorFromName(name: string) {
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Try to extract party information if present in parentheses
  let party = '';
  if (name.includes('(D)')) party = 'Democratic';
  else if (name.includes('(R)')) party = 'Republican';
  else if (name.includes('(I)')) party = 'Independent';
  
  // Extract state from name if possible (sometimes in format "Name (X-State)")
  let state = 'Illinois'; // Default to Illinois for Billinois app
  const stateMatch = name.match(/\(([^)]+)\)/);
  if (stateMatch && stateMatch[1]) {
    const matchParts = stateMatch[1].split('-');
    if (matchParts.length > 1) {
      state = matchParts[1];
    }
  }
  
  // Try to extract role
  let role = 'Legislator';
  if (name.toLowerCase().includes('rep.') || name.toLowerCase().includes('representative')) {
    role = 'Representative';
  } else if (name.toLowerCase().includes('sen.') || name.toLowerCase().includes('senator')) {
    role = 'Senator';
  }
  
  return {
    name: {
      first: firstName,
      middle: '',
      last: lastName,
      suffix: '',
      full: name.replace(/\s*\([^)]*\)/g, '').trim() // Remove party/district info in parentheses
    },
    party,
    email: [],
    phone: [],
    district: '',
    role,
    office: '',
    state
  };
}
