
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

    // Build the LegiScan search URL - adding state=IL to filter for Illinois only
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search&state=IL${sessionId ? `&masterlist=${sessionId}` : ''}&query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`LegiScan returned ${data.searchresult?.summary?.count || 0} results`);

    // Transform the results and fetch additional bill details for each result
    const allBills = data.searchresult && typeof data.searchresult === 'object' 
      ? await Promise.all(
          Object.values(data.searchresult)
            .filter(item => item.bill_id) // Filter out the summary object
            .map(async (item) => {
              // Fetch additional bill details
              const billDetailsUrl = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${item.bill_id}`;
              let billDetails;
              try {
                const detailsResponse = await fetch(billDetailsUrl);
                const detailsData = await detailsResponse.json();
                billDetails = detailsData.bill;
                
                // Fix circular references before sending data
                if (billDetails && billDetails.sponsors) {
                  // If first sponsor is a circular reference, replace with actual sponsor data
                  if (Array.isArray(billDetails.sponsors) && billDetails.sponsors.length > 0) {
                    const firstSponsor = billDetails.sponsors[0];
                    if (firstSponsor && typeof firstSponsor === 'object' && 
                        Object.keys(firstSponsor).length === 1 && 
                        firstSponsor.message && firstSponsor.message.includes("Circular")) {
                      
                      // Fix circular reference by directly assigning sponsor to sponsors[0]
                      if (billDetails.sponsor) {
                        billDetails.sponsors[0] = { ...billDetails.sponsor };
                      }
                    }
                  }
                }
                
                // Log sponsor information for debugging
                console.log(`Bill ${item.bill_id} sponsor info:`, {
                  sponsor: billDetails?.sponsors?.primary || billDetails?.sponsor,
                  hasCoSponsors: !!billDetails?.sponsors?.cosponsors || !!billDetails?.cosponsors
                });
              } catch (error) {
                console.error(`Error fetching details for bill ${item.bill_id}:`, error);
                billDetails = null;
              }

              return {
                id: item.bill_id.toString(),
                title: item.title || `${item.bill_number}`,
                description: billDetails?.description || item.description || item.title || '',
                status: item.status || '',
                lastUpdated: item.last_action_date || '',
                sessionName: item.session?.session_name || 'Unknown Session',
                sessionYear: item.session?.year_start || '',
                text: billDetails?.text_content || billDetails?.summary || '',
                versions: [],
                changes: [{
                  id: 'last_action',
                  description: item.last_action || '',
                  details: item.last_action_date || ''
                }],
                data: billDetails || item
              };
            })
        )
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
