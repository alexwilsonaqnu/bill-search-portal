
import { corsHeaders, createResponse } from "./utils.ts";
import { fetchLegislatorById, searchLegislatorByName } from "./legislatorApi.ts";
import { createEnhancedLegislatorFromName } from "./fallbackData.ts";

// Main request handler
export async function handleRequest(req: Request) {
  // Parse the request body
  const { legislatorId, sponsorName } = await req.json();
  
  if (!legislatorId && !sponsorName) {
    console.log("Error: Missing required parameters - both legislatorId and sponsorName are empty");
    return createResponse({ error: "Either legislatorId or sponsorName is required" }, 400);
  }

  console.log(`Processing request for legislator: ID=${legislatorId || 'N/A'}, Name=${sponsorName || 'N/A'}`);

  // Check for batch request (array of IDs)
  if (Array.isArray(legislatorId)) {
    console.log(`Handling batch request for ${legislatorId.length} legislator IDs`);
    return await handleBatchRequest(legislatorId);
  }

  // If we have a legislator ID, try to fetch directly by ID first
  if (legislatorId) {
    try {
      console.log(`Fetching legislator by ID: ${legislatorId}`);
      const directResult = await fetchLegislatorById(legislatorId);
      if (directResult) {
        console.log(`Successfully retrieved legislator data for ID ${legislatorId}`);
        return createResponse(directResult);
      }
      console.log(`No data found for legislator ID ${legislatorId}`);
    } catch (error) {
      console.error(`Error fetching legislator by ID ${legislatorId}:`, error);
      // Continue to name search if ID fetch fails
    }
  }

  // If ID fetch failed or we only have a name, search by name
  if (sponsorName) {
    try {
      console.log(`Searching for legislator by name: ${sponsorName}`);
      const searchResult = await searchLegislatorByName(sponsorName);
      if (searchResult) {
        console.log(`Found legislator data for name: ${sponsorName}`);
        return createResponse(searchResult);
      }
      console.log(`No data found for name: ${sponsorName}`);
    } catch (error) {
      console.error(`Error searching legislator by name ${sponsorName}:`, error);
    }
  }

  // If we get here, both methods failed - create a basic response from what we know
  if (sponsorName) {
    console.log(`Creating fallback legislator data for: ${sponsorName}`);
    // If we have a name but no data, create a basic response with just the name
    return createResponse(createEnhancedLegislatorFromName(sponsorName));
  }

  // Absolute fallback when we have nothing
  console.log("Failed to find legislator information with the provided parameters");
  return createResponse({ error: "Could not find legislator information" }, 404);
}

// New handler for batch requests
async function handleBatchRequest(legislatorIds: string[]) {
  // Deduplicate IDs
  const uniqueIds = [...new Set(legislatorIds)];
  
  console.log(`Processing batch request for ${uniqueIds.length} unique legislator IDs`);
  
  // Limit batch size to prevent abuse
  const maxBatchSize = 20;
  const idsToFetch = uniqueIds.slice(0, maxBatchSize);
  
  if (uniqueIds.length > maxBatchSize) {
    console.log(`Batch size limited to ${maxBatchSize} from ${uniqueIds.length} requested IDs`);
  }
  
  // Fetch all legislators in parallel
  const results = await Promise.all(
    idsToFetch.map(async (id) => {
      try {
        console.log(`Batch process: fetching legislator ID ${id}`);
        const result = await fetchLegislatorById(id);
        return { id, data: result || null };
      } catch (error) {
        console.error(`Batch process: error fetching legislator ${id}:`, error);
        return { id, data: null, error: error.message };
      }
    })
  );
  
  console.log(`Batch process complete: processed ${results.length} legislators`);
  
  return createResponse({
    results,
    totalRequested: uniqueIds.length,
    totalProcessed: idsToFetch.length,
    truncated: uniqueIds.length > maxBatchSize
  });
}
