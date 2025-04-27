
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
    console.log(`Fetching LegiScan history for bill: ${billId}`);

    if (!LEGISCAN_API_KEY) {
      throw new Error('LegiScan API key not configured');
    }

    // Call LegiScan API to get bill details
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Log raw history data to see what we're working with
    console.log("Raw history data:", data.bill?.history);
    
    // Extract and format history from LegiScan response
    const history = data.bill?.history || [];
    const formattedHistory = history.map((item: any, index: number) => ({
      id: `${billId}-history-${index}`,
      description: item.action || '',
      details: item.date || ''
    }));

    console.log(`Found ${formattedHistory.length} history items for bill ${billId}`);
    console.log("Sample formatted history:", formattedHistory.slice(0, 2));

    return new Response(JSON.stringify(formattedHistory), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in get-bill-history function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});
