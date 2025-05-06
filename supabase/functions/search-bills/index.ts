
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      return new Response(
        JSON.stringify({ 
          error: 'LegiScan API key is not configured',
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

    // Parse request
    const params = await req.json();
    const { query, page = 1, pageSize = 10, sessionId } = params;
    
    // If no query provided, return empty results
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
    
    console.log(`Searching LegiScan for: "${query}", page: ${page}`);

    // Build the LegiScan search URL - adding state=IL to filter for Illinois only
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search&state=IL${sessionId ? `&masterlist=${sessionId}` : ''}&query=${encodeURIComponent(query)}`;
    
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // Perform the API request with timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
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

      // Transform the results
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
      // Handle timeouts explicitly
      if (error.name === 'AbortError') {
        console.error('Request to LegiScan API timed out');
        return new Response(
          JSON.stringify({ 
            error: 'Request to LegiScan timed out after 10 seconds',
            apiDown: true,
            bills: [],
            totalItems: 0,
            currentPage: page,
            totalPages: 0
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Handle other errors
      console.error(`Error accessing LegiScan API: ${error.message}`);
      return new Response(
        JSON.stringify({ 
          error: error.message || 'Unknown error occurred',
          apiDown: true,
          bills: [],
          totalItems: 0,
          currentPage: page,
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
  } catch (error) {
    console.error(`Error in search-bills function: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        bills: [],
        totalItems: 0,
        currentPage: page || 1,
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
