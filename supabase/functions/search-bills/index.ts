
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LEGISCAN_API_KEY = Deno.env.get('LEGISCAN_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch bill details with retry logic
async function fetchBillDetails(billId: string) {
  const maxRetries = 1;
  let retries = 0;
  let error;

  while (retries <= maxRetries) {
    try {
      const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        throw new Error(`Error fetching bill details: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.bill) {
        throw new Error('Invalid response from LegiScan API');
      }
      
      return data.bill;
    } catch (e) {
      error = e;
      retries++;
      if (retries <= maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.error(`Failed to fetch bill details after ${maxRetries} retries:`, error);
  return null;
}

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

      // Transform the results - first pass to collect bill IDs
      const searchResults = Object.values(data.searchresult)
        .filter(item => item.bill_id) // Filter out the summary object
        .map(item => ({
          id: item.bill_id.toString(),
          billNumber: item.bill_number,
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
      
      // Fetch detailed bill information for the first page results only to avoid rate limiting
      // This helps with performance while still getting sponsor data for visible results
      const enhancedResults = [];
      const billsToEnhance = searchResults.slice((page - 1) * pageSize, page * pageSize);
      
      console.log(`Fetching detailed sponsor info for ${billsToEnhance.length} bills`);
      
      // Process bills in parallel with a concurrency limit
      const concurrencyLimit = 3; // Process 3 bills at a time to avoid overloading the API
      for (let i = 0; i < billsToEnhance.length; i += concurrencyLimit) {
        const batch = billsToEnhance.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (bill) => {
          try {
            // Get detailed bill info including sponsors
            const billDetails = await fetchBillDetails(bill.id);
            
            if (billDetails) {
              // Extract sponsor information
              let primarySponsor = null;
              let cosponsors = [];
              
              if (billDetails.sponsors) {
                // Handle different sponsor formats
                if (Array.isArray(billDetails.sponsors)) {
                  if (billDetails.sponsors.length > 0) {
                    primarySponsor = billDetails.sponsors[0];
                    cosponsors = billDetails.sponsors.slice(1);
                  }
                } else {
                  // Handle sponsors object with primary and cosponsors
                  primarySponsor = billDetails.sponsors.primary;
                  cosponsors = Array.isArray(billDetails.sponsors.cosponsors) 
                    ? billDetails.sponsors.cosponsors 
                    : [];
                }
              }
              
              // Enhance the bill with detailed info
              return {
                ...bill,
                sponsor: primarySponsor,
                cosponsors: cosponsors,
                state: billDetails.state || 'IL',
                data: {
                  ...bill.data,
                  ...billDetails,
                  sponsor: primarySponsor,
                  cosponsors: cosponsors,
                  sponsors: { 
                    primary: primarySponsor,
                    cosponsors: cosponsors
                  }
                }
              };
            }
          } catch (error) {
            console.error(`Error enhancing bill ${bill.id}:`, error);
          }
          
          // Return original bill if enhancement fails
          return bill;
        });
        
        const batchResults = await Promise.all(batchPromises);
        enhancedResults.push(...batchResults);
      }
      
      // Combine enhanced bills with non-enhanced ones
      const allBills = searchResults.map(bill => {
        const enhanced = enhancedResults.find(eb => eb.id === bill.id);
        return enhanced || bill;
      });

      // Handle pagination
      const totalCount = allBills.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBills = allBills.slice(startIndex, endIndex);
      const totalPages = Math.ceil(totalCount / pageSize);

      // Return response with enhanced bills
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
      // Handle errors
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
    // Handle overall function errors
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
