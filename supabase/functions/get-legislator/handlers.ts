
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
    return createResponse(searchResult);
  }

  // If we get here, both methods failed
  return createResponse({ error: "Could not find legislator information" }, 404);
}
