
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

// Fetch legislator by ID from OpenStates API
export async function fetchLegislatorById(legislatorId: string) {
  const OPENSTATES_API_KEY = getApiKey();

  try {
    const response = await fetch(`https://v3.openstates.org/people/${legislatorId}?include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return processOpenStatesResponse(data);
  } catch (error) {
    console.error("Error fetching from OpenStates:", error);
    return null;
  }
}

// Search legislator by name from OpenStates API
export async function searchLegislatorByName(name: string) {
  const OPENSTATES_API_KEY = getApiKey();

  try {
    // Clean up the name for search
    const searchName = cleanNameForSearch(name);

    console.log(`Searching for legislator with name: ${searchName}`);

    const response = await fetch(`https://v3.openstates.org/people?name=${encodeURIComponent(searchName)}&include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status}`);
      // If we hit a rate limit, return a basic legislator object
      if (response.status === 429) {
        return createEnhancedLegislatorFromName(name);
      }
      return null;
    }

    const data = await response.json();
    
    // Debug the results
    console.log(`Search returned ${data.results?.length || 0} results`);
    
    if (!data.results || data.results.length === 0) {
      // Return basic info if no results found
      return createEnhancedLegislatorFromName(name);
    }

    // Find best match - for simplicity, just take the first result
    return processOpenStatesResponse(data.results[0]);
  } catch (error) {
    console.error("Error searching OpenStates:", error);
    return createEnhancedLegislatorFromName(name);
  }
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
  let state = '';
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
