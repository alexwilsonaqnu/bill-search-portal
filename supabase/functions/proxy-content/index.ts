
// Follow us: https://twitter.com/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Get URL from the query parameters
    const url = new URL(req.url).searchParams.get('url');
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing URL parameter' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log(`Proxying request to: ${url}`);
    
    // Validate that the URL is from ilga.gov
    if (!url.startsWith('https://www.ilga.gov/')) {
      return new Response(
        JSON.stringify({ error: 'Only URLs from ilga.gov are allowed' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Fetch the content from the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'text/plain';
    
    // Read the response body as text
    const text = await response.text();
    
    // Return the content with CORS headers
    return new Response(text, {
      headers: {
        'Content-Type': contentType,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error in proxy-content function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
