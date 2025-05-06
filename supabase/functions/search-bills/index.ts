
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
    if (!LEGISCAN_API_KEY) {
      throw new Error('LegiScan API key is not configured');
    }

    // Parse request
    let params;
    try {
      params = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          bills: [],
          totalItems: 0,
          currentPage: 1,
          totalPages: 0
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

    const { query, page = 1, pageSize = 10, sessionId } = params;
    console.log(`Searching LegiScan for: "${query}", page: ${page}, pageSize: ${pageSize}, sessionId: ${sessionId}`);

    // Set a more reasonable timeout to prevent long-running requests
    // Increased from 6s to 12s to give more time for LegiScan API to respond
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // Increased to 12 seconds

    try {
      // Build the LegiScan search URL - adding state=IL to filter for Illinois only
      const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search&state=IL${sessionId ? `&masterlist=${sessionId}` : ''}&query=${encodeURIComponent(query)}`;
      
      console.log("Making request to LegiScan API (hiding API key)");
      
      // Make the fetch request with timeout
      const response = await fetch(url, { 
        signal: controller.signal 
      });

      // Clear the timeout
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`LegiScan returned ${data.searchresult?.summary?.count || 0} results`);

      // Check for API error response
      if (data.status !== 'OK') {
        throw new Error(`LegiScan API returned status: ${data.status || 'Unknown'}`);
      }

      // Transform the results - but keep it simple and fast
      const allBills = data.searchresult && typeof data.searchresult === 'object' 
        ? Object.values(data.searchresult)
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
            }))
        : [];

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
      // Make sure to clear the timeout if there's an error
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 12 seconds');
      }
      throw error;
    }
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
