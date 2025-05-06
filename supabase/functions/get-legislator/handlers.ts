
import { corsHeaders, createResponse } from "./utils.ts";
import { fetchLegislatorById, searchLegislatorByName } from "./api.ts";

// Main request handler
export async function handleRequest(req: Request) {
  // Parse the request body
  const { legislatorId, sponsorName } = await req.json();
  
  if (!legislatorId && !sponsorName) {
    return createResponse({ error: "Either legislatorId or sponsorName is required" }, 400);
  }

  console.log(`Processing request for legislator: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);

  // If we have a legislator ID, try to fetch directly by ID first
  if (legislatorId) {
    try {
      const directResult = await fetchLegislatorById(legislatorId);
      if (directResult) {
        return createResponse(directResult);
      }
    } catch (error) {
      console.error("Error fetching by ID:", error);
      // Continue to name search if ID fetch fails
    }
  }

  // If ID fetch failed or we only have a name, search by name
  if (sponsorName) {
    const searchResult = await searchLegislatorByName(sponsorName);
    if (searchResult) {
      return createResponse(searchResult);
    }
  }

  // If we get here, both methods failed - create a basic response from what we know
  if (sponsorName) {
    // If we have a name but no data, create a basic response with just the name
    const nameParts = sponsorName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return createResponse({
      name: {
        first: firstName,
        middle: '',
        last: lastName,
        suffix: '',
        full: sponsorName
      },
      party: '',
      email: [],
      phone: [],
      district: '',
      role: '',
      office: '',
      state: ''
    });
  }

  // Absolute fallback when we have nothing
  return createResponse({ error: "Could not find legislator information" }, 404);
}
