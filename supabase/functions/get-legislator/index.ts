
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
};

// Handle the requests
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse the request body
    const { legislatorId, sponsorName } = await req.json();
    
    if (!legislatorId && !sponsorName) {
      return new Response(
        JSON.stringify({ error: "Either legislatorId or sponsorName is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log(`Processing request for legislator: ${legislatorId || 'N/A'}, Name: ${sponsorName || 'N/A'}`);

    // If we have a legislator ID, try to fetch directly by ID first
    if (legislatorId) {
      try {
        const directResult = await fetchLegislatorById(legislatorId);
        if (directResult) {
          return new Response(JSON.stringify(directResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        console.error("Error fetching by ID:", error);
        // Continue to name search if ID fetch fails
      }
    }

    // If ID fetch failed or we only have a name, search by name
    if (sponsorName) {
      const searchResult = await searchLegislatorByName(sponsorName);
      return new Response(JSON.stringify(searchResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we get here, both methods failed
    return new Response(
      JSON.stringify({ error: "Could not find legislator information" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404 
      }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// Fetch legislator by ID from OpenStates API
async function fetchLegislatorById(legislatorId: string) {
  const OPENSTATES_API_KEY = Deno.env.get("OPENSTATES_API_KEY");
  
  if (!OPENSTATES_API_KEY) {
    console.error("OpenStates API key not configured");
    throw new Error("OpenStates API key not configured");
  }

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
async function searchLegislatorByName(name: string) {
  const OPENSTATES_API_KEY = Deno.env.get("OPENSTATES_API_KEY");
  
  if (!OPENSTATES_API_KEY) {
    console.error("OpenStates API key not configured");
    throw new Error("OpenStates API key not configured");
  }

  try {
    // Clean up the name for search - remove titles, suffixes, etc.
    const searchName = name
      .replace(/^(Rep\.|Sen\.|Hon\.|Dr\.|Mr\.|Mrs\.|Ms\.|)\s+/i, '')
      .replace(/,?\s+(Jr\.|Sr\.|I|II|III|IV|MD|PhD|Esq\.?)$/i, '')
      .trim();

    console.log(`Searching for legislator with name: ${searchName}`);

    const response = await fetch(`https://v3.openstates.org/people?name=${encodeURIComponent(searchName)}&include=offices`, {
      headers: {
        "X-API-Key": OPENSTATES_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Error response from OpenStates API: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Debug the results
    console.log(`Search returned ${data.results?.length || 0} results`);
    
    if (!data.results || data.results.length === 0) {
      return null;
    }

    // Find best match
    // For simplicity, just take the first result for now
    // In a production app, you might want to implement better matching logic
    return processOpenStatesResponse(data.results[0]);
  } catch (error) {
    console.error("Error searching OpenStates:", error);
    return null;
  }
}

// Process and format OpenStates API response
function processOpenStatesResponse(legislator: any) {
  if (!legislator) return null;

  // Extract emails and phones from all offices
  const emails: string[] = [];
  const phones: string[] = [];
  let officeLocation = "";

  // Try to extract contact info from offices
  if (Array.isArray(legislator.offices)) {
    for (const office of legislator.offices) {
      if (office.email && !emails.includes(office.email)) {
        emails.push(office.email);
      }
      if (office.phone && !phones.includes(office.phone)) {
        phones.push(office.phone);
      }
      if (office.name && !officeLocation) {
        officeLocation = office.name;
      }
    }
  }
  
  // Fallback for older OpenStates API format
  if (emails.length === 0 && legislator.email) {
    if (Array.isArray(legislator.email)) {
      emails.push(...legislator.email);
    } else if (typeof legislator.email === 'string') {
      emails.push(legislator.email);
    }
  }
  
  if (phones.length === 0 && legislator.phone) {
    if (Array.isArray(legislator.phone)) {
      phones.push(...legislator.phone);
    } else if (typeof legislator.phone === 'string') {
      phones.push(legislator.phone);
    }
  }
  
  // Fallback for office location
  if (!officeLocation && legislator.chamber) {
    officeLocation = legislator.chamber === 'upper' ? 'Senate' : 'House';
  }

  // Build the name object
  const nameParts = {
    first: legislator.name?.split(' ')[0] || '',
    middle: '',
    last: legislator.name?.split(' ').slice(1).join(' ') || '',
    suffix: '',
    full: legislator.name || ''
  };

  return {
    party: legislator.party || '',
    email: emails,
    phone: phones,
    district: legislator.current_role?.district || legislator.district || '',
    role: legislator.current_role?.title || legislator.role || '',
    name: nameParts,
    office: officeLocation,
    state: legislator.current_role?.state || legislator.state || ''
  };
}
