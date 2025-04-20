
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
    const { query } = await req.json();
    console.log(`Searching LegiScan for: "${query}"`);

    // Build the LegiScan search URL
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search&state=IL&query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`LegiScan returned ${data.searchresult?.summary?.count || 0} results`);

    // Transform the results into our Bill format
    const bills = data.searchresult && typeof data.searchresult === 'object' 
      ? Object.values(data.searchresult)
        .filter(item => item.bill_id) // Filter out the summary object
        .map(item => ({
          id: item.bill_id.toString(),
          title: item.title || `${item.bill_number}`,
          description: item.description || item.title || '',
          status: item.status || '',
          lastUpdated: item.last_action_date || '',
          versions: [],
          changes: [{
            id: 'last_action',
            description: item.last_action || '',
            details: item.last_action_date || ''
          }],
          data: item
        }))
      : [];

    const totalCount = data.searchresult?.summary?.count || bills.length;

    return new Response(
      JSON.stringify({
        bills,
        totalItems: totalCount,
        currentPage: 1,
        totalPages: Math.ceil(totalCount / 10)
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error in search-bills function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        bills: [],
        totalItems: 0,
        currentPage: 1,
        totalPages: 0
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
