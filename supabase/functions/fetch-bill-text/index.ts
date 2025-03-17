
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { Md5 } from "https://deno.land/std@0.168.0/hash/md5.ts";

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
    // Get bill ID from the request
    const { billId } = await req.json();
    
    if (!billId) {
      return new Response(
        JSON.stringify({ error: 'Missing bill ID' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log(`Fetching text for bill ID: ${billId}`);
    
    // Fetch bill text from Legiscan API
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBillText&id=${billId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if we got a valid response
    if (data.status !== 'OK' || !data.text) {
      console.error('Legiscan API response error:', data);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bill text', details: data }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    const base64Text = data.text.doc;
    const providedHash = data.text.md5;
    
    // Decode BASE64
    const decodedTextBytes = base64Decode(base64Text);
    const decodedText = new TextDecoder().decode(decodedTextBytes);
    
    // Verify MD5 hash
    const md5 = new Md5();
    md5.update(decodedTextBytes);
    const calculatedHash = md5.toString();
    
    if (calculatedHash !== providedHash) {
      console.warn("MD5 hash mismatch! Data may be corrupted.");
      console.log(`Provided hash: ${providedHash}`);
      console.log(`Calculated hash: ${calculatedHash}`);
    }
    
    // Return the decoded text with metadata
    return new Response(
      JSON.stringify({
        text: decodedText,
        hash: providedHash,
        docId: data.text.doc_id,
        mimeType: data.text.mime,
        title: data.text.title || ""
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in fetch-bill-text function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
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
