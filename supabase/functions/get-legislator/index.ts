
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
    const { legislatorId } = await req.json();
    
    if (!legislatorId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing legislator ID',
          message: 'Legislator ID is required' 
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

    console.log(`Fetching legislator details for ID: ${legislatorId}`);
    
    // Call LegiScan API to get legislator details
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getPerson&id=${legislatorId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.person) {
      console.error('Invalid response from LegiScan:', data);
      throw new Error('Failed to retrieve legislator information');
    }

    // Extract the legislator data
    const legislator = data.person;

    // Build contact info
    const contactInfo = {
      party: legislator.party || 'Unknown',
      // LegiScan API doesn't provide direct email/phone info in getPerson
      // We'll need to consider if we want to get this from a different source
      email: [], 
      phone: [],
      district: legislator.district || '',
      role: legislator.role || '',
      name: {
        first: legislator.first_name || '',
        middle: legislator.middle_name || '',
        last: legislator.last_name || '',
        suffix: legislator.suffix || '',
        full: legislator.name || ''
      }
    };

    console.log("Extracted legislator info:", JSON.stringify(contactInfo, null, 2));
    
    return new Response(
      JSON.stringify(contactInfo),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error in get-legislator function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to fetch legislator information' 
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
