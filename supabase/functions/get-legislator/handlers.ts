
import { corsHeaders, createResponse } from "./utils.ts";
import { fetchLegislatorById, searchLegislatorByName } from "./legislatorApi.ts";
import { createEnhancedLegislatorFromName } from "./fallbackData.ts";

// Main request handler
export async function handleRequest(req: Request) {
  // Parse the request body
  const { legislatorId, sponsorName } = await req.json();
  
  if (!legislatorId && !sponsorName) {
    return createResponse({ error: "Either legislatorId or sponsorName is required" }, 400);
  }

  console.log(`Processing request for legislator: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);

  // Check for batch request (array of IDs)
  if (Array.isArray(legislatorId)) {
    return await handleBatchRequest(legislatorId);
  }

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
    return createResponse(createEnhancedLegislatorFromName(sponsorName));
  }

  // Absolute fallback when we have nothing
  return createResponse({ error: "Could not find legislator information" }, 404);
}

// New handler for batch requests
async function handleBatchRequest(legislatorIds: string[]) {
  // Deduplicate IDs
  const uniqueIds = [...new Set(legislatorIds)];
  
  // Limit batch size to prevent abuse
  const maxBatchSize = 20;
  const idsToFetch = uniqueIds.slice(0, maxBatchSize);
  
  // Fetch all legislators in parallel
  const results = await Promise.all(
    idsToFetch.map(async (id) => {
      try {
        const result = await fetchLegislatorById(id);
        return { id, data: result || null };
      } catch (error) {
        console.error(`Error fetching legislator ${id}:`, error);
        return { id, data: null, error: error.message };
      }
    })
  );
  
  return createResponse({
    results,
    totalRequested: uniqueIds.length,
    totalProcessed: idsToFetch.length,
    truncated: uniqueIds.length > maxBatchSize
  });
}
