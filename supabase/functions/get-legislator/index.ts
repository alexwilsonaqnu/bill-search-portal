
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
    const { legislatorId, name } = await req.json();
    
    let url: string;
    
    if (name) {
      // If name is provided, search by name
      console.log(`Searching legislator by name: ${name}`);
      url = `https://v3.openstates.org/people?name=${encodeURIComponent(name)}&apikey=${OPENSTATES_API_KEY}`;
    } else if (legislatorId) {
      // If ID is provided, search by ID
      console.log(`Fetching legislator details from OpenStates for ID: ${legislatorId}`);
      url = `https://v3.openstates.org/people/${legislatorId}?apikey=${OPENSTATES_API_KEY}`;
    } else {
      throw new Error('Missing legislator ID or name');
    }
    
    // Call OpenStates API
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenStates API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenStates raw response:', JSON.stringify(data).substring(0, 500) + '...');
    
    if (!data) {
      throw new Error('No data returned from OpenStates API');
    }

    // Handle both individual legislator and search results
    const legislator = name ? (data.results && data.results.length > 0 ? data.results[0] : null) : data;
    
    if (!legislator) {
      throw new Error('Legislator not found');
    }

    // Extract contact information
    const emails = [];
    const phones = [];
    
    // Extract from contact_details if available
    if (legislator.contact_details && Array.isArray(legislator.contact_details)) {
      console.log("Found contact_details array with", legislator.contact_details.length, "items");
      
      legislator.contact_details.forEach(contact => {
        if (contact.type === 'email' && contact.value) {
          emails.push(contact.value);
        }
        if ((contact.type === 'voice' || contact.type === 'phone') && contact.value) {
          phones.push(contact.value);
        }
      });
    }

    // Extract from offices if available
    if (legislator.offices && Array.isArray(legislator.offices)) {
      console.log("Found offices array with", legislator.offices.length, "items");
      
      legislator.offices.forEach(office => {
        if (office.email && !emails.includes(office.email)) {
          emails.push(office.email);
        }
        if (office.voice && !phones.includes(office.voice)) {
          phones.push(office.voice);
        }
      });
    }

    // Log extracted information
    console.log("Extracted contact info:", {
      party: legislator.party,
      emails,
      phones,
      hasContactDetails: !!legislator.contact_details,
      contactDetailsCount: legislator.contact_details?.length || 0,
      hasOffices: !!legislator.offices,
      officesCount: legislator.offices?.length || 0
    });
    
    return new Response(
      JSON.stringify({
        party: legislator.party || 'Unknown',
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
