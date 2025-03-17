
import { corsHeaders, PDF_DETECTION_MESSAGE } from './constants.ts';
import { isPdfContent, decodeBase64Text, isIllinoisContent } from './utils.ts';
import { createErrorResponse, handleIllinoisBill1636654 } from './billHandlers.ts';

// Format the response for bill text
export async function fetchFromLegiscan(billId: string, apiKey: string): Promise<Response> {
  if (!apiKey) {
    console.error('Legiscan API key is not configured');
    return createErrorResponse(
      'Legiscan API key is not configured',
      'The Legiscan API key is missing. Please contact the administrator.',
      null,
      500
    );
  }
  
  try {
    // For other bills, fetch text from Legiscan API
    const url = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for API key or account issues
    if (data.status === 'ERROR' && data.alert) {
      console.error('Legiscan API subscription error:', data.alert.message);
      return createErrorResponse(
        'Legiscan API subscription issue',
        'The Legiscan API subscription has expired or is invalid. Please contact the administrator.',
        data.alert,
        403
      );
    }
    
    // Check if we got a valid response with text content
    if (data.status !== 'OK' || !data.text) {
      console.error('Legiscan API response error:', data);
      return createErrorResponse(
        'Failed to fetch bill text', 
        'Could not retrieve the bill text. Please try again later.',
        data, 
        500
      );
    }
    
    const base64Text = data.text.doc;
    
    // Decode BASE64
    const decodedText = decodeBase64Text(base64Text);
    
    // Check if the content is from Illinois
    const state = data.text.state_link?.includes('ilga.gov') || isIllinoisContent(decodedText) 
      ? "Illinois" 
      : "Unknown";
      
    // If the state is not Illinois and it's the specific bill ID with issues,
    // return our hard-coded Illinois content
    if (state !== "Illinois" && billId === '1636654') {
      return handleIllinoisBill1636654();
    }
    
    // Check if the content is a PDF
    if (isPdfContent(decodedText)) {
      console.log('Detected PDF content, returning both PDF data and friendly message');
      return new Response(
        JSON.stringify({
          text: PDF_DETECTION_MESSAGE,
          docId: data.text.doc_id,
          mimeType: 'application/pdf', // Mark as PDF
          title: data.text.title || "",
          isPdf: true,
          base64: base64Text, // Include the original base64 data for PDF rendering
          url: data.text.state_link || null,
          state: state
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
        title: data.text.title || "",
        url: data.text.state_link || null,
        state: state
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching from Legiscan:', error);
    return createErrorResponse(
      error.message || 'Unknown error occurred when fetching from Legiscan',
      'Failed to fetch the bill text. Please try again later.'
    );
  }
}
