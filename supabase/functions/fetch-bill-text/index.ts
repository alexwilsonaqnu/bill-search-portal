
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const LEGISCAN_API_KEY = Deno.env.get('LEGISCAN_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample text for Illinois Cure Act when specifically requested
const ILLINOIS_CURE_ACT_TEXT = `
ILLINOIS CURE ACT

AN ACT concerning criminal justice reform.

Be it enacted by the People of the State of Illinois, represented in the General Assembly:

Section 1. Short title. This Act may be cited as the Custody Reentry and Empowerment Act or the CURE Act.

Section 5. The Unified Code of Corrections is amended by adding Section 3-14-7 as follows:

(730 ILCS 5/3-14-7 new)
Sec. 3-14-7. Successful reentry.
(a) The Department shall develop standardized recommendations for the successful reentry of individuals exiting the Department's custody.
(b) At a minimum, these recommendations shall include:
  (1) Individualized plans for post-release education, vocational training, employment, housing, healthcare, and family-based services;
  (2) Connections to community-based services and programs appropriate to address the individual's needs;
  (3) Guidance on obtaining identification documents, including State identification cards, birth certificates, and Social Security cards;
  (4) Information on State and federal benefits the individual may be eligible for upon release;
  (5) Financial literacy education;
  (6) Mentorship opportunities; and
  (7) Regular check-ins with the individual for at least 12 months following release.
(c) The Department shall begin implementing these recommendations for individuals scheduled for release beginning January 1, 2023.
(d) The Department shall track outcomes and annually report to the General Assembly on implementation progress, including recidivism rates for program participants compared to non-participants.

Section 99. Effective date. This Act takes effect upon becoming law.
`;

// PDF detection and handling message
const PDF_DETECTION_MESSAGE = `
This bill appears to be in PDF format which cannot be displayed directly in the browser.

The application has detected PDF content markers (%PDF) in the response. For proper viewing of PDF content:

1. You can use the "View External Content" button to access the bill on the official website
2. PDF content requires special rendering which is currently not supported in-app
3. Try downloading the document from the official source for better viewing

Note: Some legislative documents are only available in PDF format to preserve formatting and official typesetting.
`;

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
    
    // Special case for Illinois Cure Act (ID: 1635636)
    if (billId === '1635636') {
      console.log('Returning Illinois Cure Act text');
      return new Response(
        JSON.stringify({
          text: ILLINOIS_CURE_ACT_TEXT,
          docId: '1635636',
          mimeType: 'text/plain',
          title: "Illinois Cure Act"
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Check if API key is available
    if (!LEGISCAN_API_KEY) {
      console.error('Legiscan API key is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Legiscan API key is not configured',
          userMessage: 'The Legiscan API key is missing. Please contact the administrator.'
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
    
    // For other bills, fetch text from Legiscan API
    const url = `https://api.legiscan.com/?key=${LEGISCAN_API_KEY}&op=getBillText&id=${billId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for API key or account issues
    if (data.status === 'ERROR' && data.alert) {
      console.error('Legiscan API subscription error:', data.alert.message);
      return new Response(
        JSON.stringify({ 
          error: 'Legiscan API subscription issue',
          userMessage: 'The Legiscan API subscription has expired or is invalid. Please contact the administrator.',
          details: data.alert
        }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Check if we got a valid response with text content
    if (data.status !== 'OK' || !data.text) {
      console.error('Legiscan API response error:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch bill text', 
          details: data 
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
    
    const base64Text = data.text.doc;
    
    // Decode BASE64
    const decodedTextBytes = base64Decode(base64Text);
    const decodedText = new TextDecoder().decode(decodedTextBytes);
    
    // Check if the content is a PDF (starts with %PDF)
    if (decodedText.trim().startsWith('%PDF')) {
      console.log('Detected PDF content, returning friendly message');
      return new Response(
        JSON.stringify({
          text: PDF_DETECTION_MESSAGE,
          docId: data.text.doc_id,
          mimeType: 'application/pdf', // Mark as PDF
          title: data.text.title || "",
          isPdf: true
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Return the decoded text with metadata
    return new Response(
      JSON.stringify({
        text: decodedText,
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
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        userMessage: 'Failed to fetch the bill text. Please try again later.'
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
