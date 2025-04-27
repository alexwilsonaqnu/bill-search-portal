
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const LEGISCAN_API_KEY = Deno.env.get('LEGISCAN_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { billId } = await req.json();
    
    if (!billId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing bill ID',
          message: 'Bill ID is required to fetch bill details.' 
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    console.log(`Fetching bill details for ID: ${billId}`);
    
    // Call LegiScan API to get bill details
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
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
    console.error('Error in get-bill function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to fetch bill information' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
