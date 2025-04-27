
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENSTATES_API_KEY = Deno.env.get('OPENSTATES_API_KEY');

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
      throw new Error('Missing legislator ID');
    }
    
    console.log(`Fetching legislator details from OpenStates for ID: ${legislatorId}`);
    
    // Call OpenStates API to get legislator details
    const url = `https://v3.openstates.org/people/${legislatorId}`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': OPENSTATES_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenStates API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenStates raw response:', JSON.stringify(data).substring(0, 500));
    
    if (!data) {
      throw new Error('No data returned from OpenStates API');
    }

    // Extract contact information
    const emails = [];
    const phones = [];
    
    if (data.offices) {
      data.offices.forEach(office => {
        if (office.voice) phones.push(office.voice);
        if (office.email) emails.push(office.email);
      });
    }

    // Log extracted information
    console.log("Extracted contact info:", {
      party: data.party,
      emails,
      phones,
      hasOffices: !!data.offices,
      officesCount: data.offices?.length || 0
    });
    
    return new Response(
      JSON.stringify({
        party: data.party || 'Unknown',
        email: emails,
        phone: phones
      }),
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
