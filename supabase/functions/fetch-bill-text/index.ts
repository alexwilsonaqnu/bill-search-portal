
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
    // Get bill ID from the request
    const { billId, state } = await req.json();
    
    if (!billId) {
      return createErrorResponse(
        'Missing bill ID',
        'Bill ID is required to fetch bill text.',
        null,
        400
      );
    }

    // Log the incoming request details
    console.log(`Fetching text for bill ID: ${billId}, state from request: ${state || 'not provided'}`);
    console.log(`Note: Using bill_id directly; state parameter not needed for LegiScan API but ensuring Illinois (IL)`);
    
    // Special case for Illinois Cure Act (ID: 1635636)
    if (billId === '1635636') {
      return handleIllinoisCureAct();
    }
    
    // Special case for Illinois Bill 1636654 (which seems to get wrong content from API)
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
      // When using bill_id for lookup, state is not required, but we'll ensure IL state in the response
      const response = await fetchFromLegiscan(billId, LEGISCAN_API_KEY);
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
          { billId }
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
