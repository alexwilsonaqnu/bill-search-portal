
import { corsHeaders, createResponse } from "./utils.ts";
import { createEnhancedLegislatorFromName } from "./fallbackData.ts";

// Main request handler
export async function handleRequest(req: Request) {
  // Parse the request body
  let body;
  try {
    body = await req.json();
    console.log("Request body:", body);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return createResponse({ error: "Invalid JSON in request body" }, 400);
  }
  
  const { legislatorId, sponsorName } = body;
  
  if (!legislatorId && !sponsorName) {
    console.log("Error: Missing required parameters");
    return createResponse({ error: "Either legislatorId or sponsorName is required" }, 400);
  }

  console.log(`Looking up legislator: ID=${legislatorId || 'N/A'}, Name=${sponsorName || 'N/A'}`);

  // We're moving the implementation to use direct Supabase client queries in the frontend
  // This edge function now only exists as a fallback
  
  // Simply return a fallback legislator with basic info
  console.log("Creating fallback legislator object");
  if (sponsorName) {
    return createResponse(createEnhancedLegislatorFromName(sponsorName));
  }

  // If we have neither ID nor name that we can use
  console.log("Could not create legislator with the provided parameters");
  return createResponse({ error: "Could not find legislator information" }, 404);
}
