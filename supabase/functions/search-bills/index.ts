
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
    const { query, page = 1, pageSize = 10, sessionId } = await req.json();
    console.log(`Searching LegiScan for: "${query}", page: ${page}, pageSize: ${pageSize}, sessionId: ${sessionId}`);

    // Build the LegiScan search URL
    // Remove the state filter to search across all sessions
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search${sessionId ? `&masterlist=${sessionId}` : ''}&query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`LegiScan returned ${data.searchresult?.summary?.count || 0} results`);

    // Transform the results into our Bill format
    const allBills = data.searchresult && typeof data.searchresult === 'object' 
      ? Object.values(data.searchresult)
        .filter(item => item.bill_id) // Filter out the summary object
        .map(item => ({
          id: item.bill_id.toString(),
          title: item.title || `${item.bill_number}`,
          description: item.description || item.title || '',
          status: item.status || '',
          lastUpdated: item.last_action_date || '',
          sessionName: item.session?.session_name || 'Unknown Session', // Add session information
          sessionYear: item.session?.year_start || '',
          versions: [],
          changes: [{
            id: 'last_action',
            description: item.last_action || '',
            details: item.last_action_date || ''
          }],
          data: item
        }))
      : [];

    // Handle pagination
    const totalCount = allBills.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBills = allBills.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCount / pageSize);

    console.log(`Paginating results: ${paginatedBills.length} bills for page ${page} of ${totalPages}`);

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
