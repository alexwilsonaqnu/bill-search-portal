
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./constants.ts";
import { handleIllinoisCureAct, handleIllinoisBill1636654, createErrorResponse } from "./billHandlers.ts";
import { fetchFromLegiscan } from "./legiscanService.ts";

const LEGISCAN_API_KEY = Deno.env.get('LEGISCAN_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get parameters from the request
    const { billId, state, billNumber } = await req.json();
    
    // Check if we have at least one valid identifier (billId OR state+billNumber)
    if (!billId && !(state && billNumber)) {
      return createErrorResponse(
        'Missing bill identifiers',
        'Either bill ID or state and bill number are required to fetch bill text.',
        null,
        400
      );
    }

    // Log the incoming request details
    console.log(`Fetching text with params: ${JSON.stringify({ billId, state, billNumber })}`);
    
    // Special cases - still using billId for these
    if (billId === '1635636') {
      return handleIllinoisCureAct();
    }
    
    if (billId === '1636654') {
      return handleIllinoisBill1636654();
    }
    
    // Check if Legiscan API key is available
    if (!LEGISCAN_API_KEY) {
      return createErrorResponse(
        'Legiscan API key is not configured',
        'The system is not properly configured to fetch bill text. Please contact the administrator.',
        null,
        500
      );
    }

    // For all other bills, fetch from Legiscan API with improved handling and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      // Use either billId OR state+billNumber approach
      const response = billId 
        ? await fetchFromLegiscan(billId, LEGISCAN_API_KEY) 
        : await fetchFromLegiscan(null, LEGISCAN_API_KEY, state, billNumber);
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Error fetching from LegiScan API: ${error.message}`);
      
      // Check if we aborted due to timeout
      if (error.name === 'AbortError') {
        return createErrorResponse(
          'Request timeout',
          'The request to LegiScan timed out. Please try again later.',
          { billId, state, billNumber }
        );
      }
      
      return createErrorResponse(
        error.message || 'Unknown error occurred',
        'Failed to fetch the bill text. The LegiScan API may be temporarily unavailable.'
      );
    }
    
  } catch (error) {
    console.error('Error in fetch-bill-text function:', error);
    return createErrorResponse(
      error.message || 'Unknown error occurred',
      'Failed to fetch the bill text. Please try again later.'
    );
  }
});
