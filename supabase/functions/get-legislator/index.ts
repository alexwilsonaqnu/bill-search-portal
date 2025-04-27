
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENSTATES_API_KEY = Deno.env.get('OPENSTATES_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Office {
  classification?: string;
  address?: string;
  voice?: string;
  email?: string;
}

interface ContactDetail {
  type: string;
  value: string;
  note?: string;
}

interface ContactDetailsResult {
  emails: string[];
  phones: string[];
}

/**
 * Robustly extract contact details from different API response formats
 */
function extractContactDetails(legislator: any): ContactDetailsResult {
  const emails: string[] = [];
  const phones: string[] = [];
  
  // Process offices array (OpenStates format)
  if (legislator.offices && Array.isArray(legislator.offices)) {
    legislator.offices.forEach((office: Office) => {
      if (office.email && typeof office.email === 'string' && !emails.includes(office.email)) {
        emails.push(office.email.trim());
      }
      
      if (office.voice && typeof office.voice === 'string' && !phones.includes(office.voice)) {
        phones.push(office.voice.trim());
      }
    });
  }
  
  // Process contact_details array (alternate OpenStates format)
  if (legislator.contact_details && Array.isArray(legislator.contact_details)) {
    legislator.contact_details.forEach((contact: ContactDetail) => {
      if (contact.type === 'email' && !emails.includes(contact.value)) {
        emails.push(contact.value.trim());
      }
      
      if (['voice', 'phone', 'cell', 'work'].includes(contact.type) && !phones.includes(contact.value)) {
        phones.push(contact.value.trim());
      }
    });
  }
  
  // Fallback for direct properties
  if (legislator.email && typeof legislator.email === 'string' && !emails.includes(legislator.email)) {
    emails.push(legislator.email.trim());
  }
  
  if (legislator.phone && typeof legislator.phone === 'string' && !phones.includes(legislator.phone)) {
    phones.push(legislator.phone.trim());
  }
  
  // Log what we found for debugging
  console.log("Extracted contact info:", { emails, phones });
  
  return { emails, phones };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { legislatorId, name } = await req.json();
    
    if (!legislatorId && !name) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing identifier',
          message: 'Either legislator ID or name is required' 
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

    let searchParam = "";
    
    // Determine search method
    if (name) {
      console.log(`Searching OpenStates for legislator by name: ${name}`);
      // URL encode the name for the API
      searchParam = `?name=${encodeURIComponent(name)}`;
    } else {
      console.log(`Searching OpenStates for legislator by ID: ${legislatorId}`);
      searchParam = `/${legislatorId}`;
    }
    
    // Make API request to OpenStates
    const url = `https://v3.openstates.org/people${searchParam}`;
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': OPENSTATES_API_KEY || '',
      }
    });

    if (!response.ok) {
      throw new Error(`OpenStates API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`OpenStates API response received for ${name || legislatorId}`);
    
    // Handle different response formats from OpenStates API
    let legislatorData;
    
    if (name) {
      // When searching by name, the response has a results array
      console.log(`Found ${data.results?.length || 0} legislators matching "${name}"`);
      
      if (!data.results || data.results.length === 0) {
        return new Response(
          JSON.stringify({
            party: 'Unknown',
            email: [],
            phone: []
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Use the first result
      legislatorData = data.results[0];
    } else {
      // When searching by ID, the legislator data is directly in the response
      legislatorData = data;
    }
    
    if (!legislatorData) {
      console.error('No legislator data found in the response');
      throw new Error('Failed to retrieve legislator information');
    }
    
    // Extract party information, with normalizing to short form
    let party = legislatorData.party || 'Unknown';
    if (party.toLowerCase().includes('democrat')) {
      party = 'D';
    } else if (party.toLowerCase().includes('republic')) {
      party = 'R';
    }
    
    // Extract contact information
    const contactDetails = extractContactDetails(legislatorData);
    
    return new Response(
      JSON.stringify({
        party: party,
        email: contactDetails.emails,
        phone: contactDetails.phones
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
