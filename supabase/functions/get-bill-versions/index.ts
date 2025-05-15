
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
    const { billId, state = 'IL', includeText = true } = await req.json();
    
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

    console.log(`Fetching versions for bill ID: ${billId}, state: ${state}, includeText: ${includeText}`);
    
    if (!LEGISCAN_API_KEY) {
      console.error('LEGISCAN_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          message: 'LegiScan API key is not configured on the server.'
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
    
    // Call LegiScan API to get bill details which includes versions
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBill&id=${billId}&state=${state}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
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
      
      if (versions.length === 0) {
        console.warn(`No versions found for bill ${billId}`);
        return new Response(
          JSON.stringify({ 
            versions: [],
            message: 'No versions available for this bill.'
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      // Check for specific version types (introduced, engrossed, etc.)
      const versionTypes = versions.map(v => v.type).join(", ");
      console.log(`Version types for bill ${billId}: ${versionTypes}`);
      
      // For each version, we need to fetch the full text content
      const processedVersions = includeText ? 
        await Promise.all(versions.map(async (version) => {
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
            console.log(`Fetching text for version ${version.doc_id} (${version.type})`);
            
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
              
              // Check if we have content
              if (!textContent || textContent.trim().length < 10) {
                console.warn(`Empty or very short content for version ${version.doc_id}`);
              } else {
                console.log(`Successfully decoded content for version ${version.doc_id}, length: ${textContent.length}`);
              }
              
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
        })) : 
        // If includeText is false, just return the version metadata
        versions.map(version => ({
          ...version,
          sections: [{
            title: "Full text",
            content: "Text content not requested."
          }]
        }));
      
      // Verify which versions have content
      const versionsWithContent = processedVersions.filter(v => 
        v.sections && v.sections.some(s => s.content && s.content.trim().length > 10)
      ).length;
      
      console.log(`Returning ${processedVersions.length} processed versions, ${versionsWithContent} with content`);
      
      return new Response(
        JSON.stringify({ 
          versions: processedVersions,
          versionsWithContent
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Check if we aborted due to timeout
      if (error.name === 'AbortError') {
        console.error('Request to LegiScan API timed out');
        return new Response(
          JSON.stringify({ 
            error: 'Request timed out',
            message: 'The request to LegiScan timed out after 10 seconds.'
          }),
          {
            status: 408,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      throw error;
    }
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
