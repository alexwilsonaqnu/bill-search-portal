
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

    // Extract relevant information
    const legislator = data.person;
    
    // Process contact information
    const emails = [];
    const phones = [];
    
    // Add personal email if available
    if (legislator.email) {
      emails.push(legislator.email);
    }
    
    // Process offices array to extract all contact information
    if (legislator.offices && Array.isArray(legislator.offices)) {
      legislator.offices.forEach(office => {
        // Add office email if available and not already in the list
        if (office.email && !emails.includes(office.email)) {
          emails.push(office.email);
        }
        
        // Add office phone if available
        if (office.phone) {
          const formattedPhone = office.phone.trim();
          if (formattedPhone && !phones.includes(formattedPhone)) {
            phones.push(formattedPhone);
          }
        }
      });
    }
    
    // Log what we found for debugging
    console.log("Extracted contact info:", { 
      party: legislator.party, 
      emails, 
      phones,
      hasOffices: !!legislator.offices,
      officesCount: legislator.offices ? legislator.offices.length : 0
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
