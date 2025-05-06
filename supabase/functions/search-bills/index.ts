import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const LEGISCAN_API_KEY = Deno.env.get('LEGISCAN_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create consistent error responses
function createErrorResponse(error: any, status = 500) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error(`Error in search-bills function: ${errorMessage}`);
  
  return new Response(
    JSON.stringify({ 
      error: errorMessage,
      bills: [],
      totalItems: 0,
      currentPage: 1,
      totalPages: 0
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

// Helper function to fetch from LegiScan with retry logic
async function fetchFromLegiScan(url: string, retries = 2, backoff = 1500) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If not first attempt, wait with exponential backoff
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retries} after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased from 12s to 15s
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry aborted requests (timeouts)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds');
      }
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Otherwise continue to next retry attempt
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LEGISCAN_API_KEY) {
      return createErrorResponse(new Error('LegiScan API key is not configured'), 500);
    }

    // Parse request
    let params;
    try {
      params = await req.json();
    } catch (e) {
      return createErrorResponse(new Error('Invalid request body'), 400);
    }

    const { query, page = 1, pageSize = 10, sessionId } = params;
    
    // If no query provided, return empty results instead of erroring
    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({
          bills: [],
          totalItems: 0,
          currentPage: page,
          totalPages: 0
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
    console.log(`Searching LegiScan for: "${query}", page: ${page}, pageSize: ${pageSize}, sessionId: ${sessionId}`);

    // Build the LegiScan search URL - adding state=IL to filter for Illinois only
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search&state=IL${sessionId ? `&masterlist=${sessionId}` : ''}&query=${encodeURIComponent(query)}`;
    
    console.log("Making request to LegiScan API (hiding API key)");
    
    try {
      const data = await fetchFromLegiScan(url);
      console.log(`LegiScan returned ${data.searchresult?.summary?.count || 0} results`);

      // Check for API error response
      if (data.status !== 'OK') {
        throw new Error(`LegiScan API returned status: ${data.status || 'Unknown'}`);
      }

      // If the API returned no results properly (not an error)
      if (!data.searchresult || typeof data.searchresult !== 'object' || Object.keys(data.searchresult).length <= 1) {
        return new Response(
          JSON.stringify({
            bills: [],
            totalItems: 0,
            currentPage: page,
            totalPages: 0
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      // Transform the results - but keep it simple and fast
      const allBills = Object.values(data.searchresult)
        .filter(item => item.bill_id) // Filter out the summary object
        .map(item => ({
          id: item.bill_id.toString(),
          title: item.title || `${item.bill_number}`,
          description: item.description || item.title || '',
          status: item.status || '',
          lastUpdated: item.last_action_date || '',
          sessionName: item.session?.session_name || 'Unknown Session',
          sessionYear: item.session?.year_start || '',
          changes: [{
            id: 'last_action',
            description: item.last_action || '',
            details: item.last_action_date || ''
          }],
          data: item,
        }));

      // Handle pagination
      const totalCount = allBills.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBills = allBills.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalCount / pageSize);

      return new Response(
        JSON.stringify({
          bills: paginatedBills,
          totalItems: totalCount,
          currentPage: page,
          totalPages: totalPages
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } catch (error) {
      // If the API is genuinely down, try to return a graceful error
      // that the client can display instead of crashing
      return createErrorResponse(error);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
});
