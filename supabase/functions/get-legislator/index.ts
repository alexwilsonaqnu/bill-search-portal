
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPEN_STATES_API_KEY = Deno.env.get('OPEN_STATES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Office {
  classification: string;
  address?: string;
  voice?: string;
  fax?: string;
  email?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { legislatorName } = await req.json();
    
    if (!legislatorName) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing legislator name',
          message: 'Legislator name is required' 
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

    console.log(`Fetching legislator details for name: ${legislatorName}`);
    
    const url = `https://v3.openstates.org/people?jurisdiction=Illinois&name=${encodeURIComponent(legislatorName)}&apikey=${OPEN_STATES_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenStates API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.results?.[0]) {
      console.log('No legislator found in OpenStates:', { name: legislatorName });
      return new Response(
        JSON.stringify(null),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const legislator = data.results[0];
    
    // Extract contact info from offices
    const emails = legislator.offices
      ?.filter((office: Office) => office.email)
      .map((office: Office) => office.email) || [];
    
    const phones = legislator.offices
      ?.filter((office: Office) => office.voice)
      .map((office: Office) => office.voice) || [];

    // Build legislator info
    const legislatorInfo = {
      party: legislator.party || 'Unknown',
      email: emails,
      phone: phones,
      district: legislator.current_role?.district || '',
      role: legislator.current_role?.role || '',
      name: {
        first: legislator.name.split(' ')[0],
        middle: '',  // OpenStates doesn't provide middle name
        last: legislator.name.split(' ').slice(1).join(' '),
        suffix: '',  // OpenStates doesn't provide suffix
        full: legislator.name
      }
    };

    console.log("Extracted legislator info:", JSON.stringify(legislatorInfo, null, 2));
    
    return new Response(
      JSON.stringify(legislatorInfo),
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
