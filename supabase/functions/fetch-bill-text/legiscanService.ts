
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
    console.log(`Attempting to fetch bill text for ID: ${billId}`);
    
    // Special handling for specific bill IDs that we know have issues
    if (billId === '1636716') {
      console.log('Using special handling for bill 1636716');
      // For bill 1636716, we need to use the correct document ID 
      // This document ID corresponds to the actual bill text for HB3717
      const docId = '2025696';
      const url = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docId}&state=IL`;
      console.log(`Fetching bill text with specific docId: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.text) {
        console.error('Special handling for 1636716 failed:', data);
        // Fall back to regular fetch
      } else {
        console.log('Successfully fetched bill text with special docId for 1636716');
        const base64Text = data.text.doc;
        const decodedText = decodeBase64Text(base64Text);
        
        // Check if the content is a PDF
        if (isPdfContent(decodedText)) {
          console.log('Detected PDF content for bill 1636716');
          return new Response(
            JSON.stringify({
              text: PDF_DETECTION_MESSAGE,
              docId: data.text.doc_id,
              mimeType: 'application/pdf',
              title: "Illinois House Bill 3717", // Set correct title
              isPdf: true,
              base64: base64Text,
              url: data.text.state_link || null,
              state: "Illinois"
            }),
            { 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders 
              } 
            }
          );
        }
        
        // Return regular text if not PDF
        return new Response(
          JSON.stringify({
            text: decodedText,
            docId: data.text.doc_id,
            mimeType: data.text.mime,
            title: "Illinois House Bill 3717", // Set correct title
            url: data.text.state_link || null,
            state: "Illinois"
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
    }
    
    // For other bills, fetch text from Legiscan API
    const url = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}&state=IL`;
    console.log(`Fetching bill text from Legiscan API: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Legiscan response status: ${data.status}`);
    
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
    console.log(`Successfully received base64 text of length: ${base64Text?.length || 0}`);
    
    // Decode BASE64
    const decodedText = decodeBase64Text(base64Text);
    
    // Check if the content is from Illinois
    const state = data.text.state_link?.includes('ilga.gov') || isIllinoisContent(decodedText) 
      ? "Illinois" 
      : "Unknown";
      
    console.log(`Bill state identified as: ${state}`);
      
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
