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
  
  console.error(`Error in get-bill function: ${errorMessage}`);
  
  return new Response(
    JSON.stringify({ 
      error: errorMessage,
      message: 'Failed to fetch bill information',
      userMessage: 'Unable to load bill information at this time. Please try again later.' 
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
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds
      
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

    const { billId } = await req.json();
    
    if (!billId) {
      return createErrorResponse(new Error('Missing bill ID'), 400);
    }

    console.log(`Fetching bill details for ID: ${billId}`);
    
    // Call LegiScan API to get bill details
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`;
    
    try {
      const data = await fetchFromLegiScan(url);
      
      if (data.status !== 'OK' || !data.bill) {
        console.error('Invalid response from LegiScan:', data);
        throw new Error('Failed to retrieve bill information');
      }

      console.log(`Successfully retrieved bill details for ${billId}`);
      
      return new Response(
        JSON.stringify({ bill: data.bill }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } catch (error) {
      return createErrorResponse(error);
    }
  } catch (error) {
    return createErrorResponse(error);
  }
});
