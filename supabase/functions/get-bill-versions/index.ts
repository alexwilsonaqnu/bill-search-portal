
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
    const { billId } = await req.json();
    
    if (!billId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing bill ID',
          message: 'Bill ID is required to fetch bill versions.' 
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

    console.log(`Fetching versions for bill ID: ${billId}`);
    
    // Call LegiScan API to get bill details which includes versions
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.bill) {
      console.error('Invalid response from LegiScan:', data);
      throw new Error('Failed to retrieve bill information');
    }

    // Extract bill versions (texts) and process them
    const versions = data.bill.texts || [];
    console.log(`Found ${versions.length} versions for bill ${billId}`);
    
    // For each version, we need to fetch the full text content
    const processedVersions = await Promise.all(versions.map(async (version) => {
      try {
        if (!version.doc_id) {
          return {
            ...version,
            sections: [{
              title: "Full text",
              content: "No text content available for this version."
            }]
          };
        }
        
        // Fetch the text content for this version
        const textUrl = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBillText&id=${version.doc_id}`;
        const textResponse = await fetch(textUrl);
        const textData = await textResponse.json();
        
        if (textData.status !== 'OK' || !textData.text) {
          console.warn(`Could not fetch text for version ${version.doc_id}`);
          return {
            ...version,
            sections: [{
              title: "Full text",
              content: "Could not load text content for this version."
            }]
          };
        }
        
        // Decode base64 text content
        let textContent;
        try {
          const base64Text = textData.text.doc;
          textContent = new TextDecoder().decode(
            Uint8Array.from(atob(base64Text), c => c.charCodeAt(0))
          );
        } catch (e) {
          console.error(`Error decoding text for version ${version.doc_id}:`, e);
          textContent = "Error decoding text content.";
        }
        
        // For simplicity, we're treating each version as a single section
        return {
          ...version,
          sections: [{
            title: "Full text",
            content: textContent
          }]
        };
      } catch (error) {
        console.error(`Error processing version ${version.doc_id}:`, error);
        return {
          ...version,
          sections: [{
            title: "Error",
            content: `Error loading content: ${error.message}`
          }]
        };
      }
    }));
    
    return new Response(
      JSON.stringify({ versions: processedVersions }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error in get-bill-versions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to fetch bill versions' 
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
