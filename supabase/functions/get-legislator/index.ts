
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const LEGISCAN_API_KEY = Deno.env.get('LEGISCAN_API_KEY');

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
  
  // Process offices array
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
  
  // Process contact_details array
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

    // Determine which API endpoint to use
    let apiUrl: string;
    
    if (legislatorId) {
      console.log(`Fetching legislator details for ID: ${legislatorId}`);
      apiUrl = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getLegislator&id=${legislatorId}`;
    } else if (name) {
      console.log(`Searching for legislator by name: ${name}`);
      // LegiScan API requires state parameter for search by name
      apiUrl = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=search&state=IL&query=${encodeURIComponent(name)}&type=people`;
    } else {
      throw new Error('Either legislatorId or name is required');
    }
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("LegiScan API response:", JSON.stringify(data).substring(0, 200) + "...");
    
    let legislatorData;
    
    if (legislatorId) {
      // Direct legislator lookup response format
      if (data.status !== 'OK' || !data.legislator) {
        throw new Error('Failed to retrieve legislator information');
      }
      legislatorData = data.legislator;
    } else {
      // Search response format - find the first matching person
      if (data.status !== 'OK' || !data.searchresult || !data.searchresult.people) {
        throw new Error('No matching legislators found');
      }
      
      // Get the first person from search results
      const people = Object.values(data.searchresult.people);
      if (people.length === 0) {
        throw new Error(`No legislators found matching name: ${name}`);
      }
      
      legislatorData = people[0];
    }
    
    if (!legislatorData) {
      throw new Error('No legislator data found');
    }
    
    // Extract party information
    let party = legislatorData.party || 'Unknown';
    
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
        error: error.message || 'Unknown error occurred',
        message: 'Failed to retrieve legislator information'
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
