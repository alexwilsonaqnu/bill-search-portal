
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
    // Get bill ID from the request, but always use IL as the state
    const { billId } = await req.json();
    const state = 'IL'; // Always force Illinois state
    
    if (!billId) {
      return createErrorResponse(
        'Missing bill ID',
        'Bill ID is required to fetch bill text.',
        null,
        400
      );
    }

    console.log(`Fetching text for bill ID: ${billId} from state: ${state}`);
    
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
      // Always pass IL as the state parameter to LegiScan
      const response = await fetchFromLegiscan(billId, LEGISCAN_API_KEY, state);
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
