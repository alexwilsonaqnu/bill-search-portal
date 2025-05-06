
import { corsHeaders } from './constants.ts';
import { isPdfContent, decodeBase64Text, isIllinoisContent, detectStateFromContent } from './utils.ts';
import { createErrorResponse } from './billHandlers.ts';

/**
 * Fetches bill text from LegiScan API
 * Includes improved error handling and response processing
 */
export async function fetchFromLegiscan(billId: string, apiKey: string) {
  try {
    console.log(`Fetching document content from LegiScan API for bill ${billId}`);
    
    // Construct the LegiScan API request URL for the "getBillText" operation
    const requestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}`;
    
    // Make the API request with improved timeout handling
    const response = await fetch(requestUrl);
    
    if (!response.ok) {
      console.error(`LegiScan API responded with status ${response.status}: ${response.statusText}`);
      return createErrorResponse(
        `LegiScan API error: ${response.statusText}`,
        'Failed to fetch the bill text from LegiScan. The service may be experiencing issues.',
        { billId, status: response.status }
      );
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Handle API errors
    if (data.status !== 'OK' || !data.text) {
      console.error('LegiScan API returned an error:', data);
      return createErrorResponse(
        data.alert?.message || 'LegiScan API error',
        'The requested bill text could not be retrieved. It may not exist or require special access.',
        data
      );
    }
    
    // Extract text data
    const { text } = data;
    const docId = text.doc_id;
    const base64Content = text.doc;
    
    // Process the content based on mime type
    const mimeType = text.mime || 'text/html';
    const isPdf = mimeType === 'application/pdf' || text.mime_id === 2;
    
    if (!base64Content) {
      return createErrorResponse(
        'No content available',
        'The bill text content is not available from LegiScan.',
        { billId, docId }
      );
    }
    
    // Decode and process the content
    let decodedContent;
    try {
      decodedContent = decodeBase64Text(base64Content);
    } catch (error) {
      console.error('Error decoding base64 content:', error);
      return createErrorResponse(
        'Content decoding error',
        'The bill text could not be decoded properly.',
        { billId, docId }
      );
    }
    
    // Check if content is PDF
    const contentIsPdf = isPdf || isPdfContent(decodedContent);
    
    // Return appropriate response based on content type
    let stateDetected = null;
    if (!contentIsPdf) {
      // For text content, try to detect the state
      stateDetected = detectStateFromContent(decodedContent);
      
      // Special handling for Illinois content
      if (isIllinoisContent(decodedContent)) {
        stateDetected = 'Illinois';
      }
    }
    
    // Return the processed response
    return new Response(
      JSON.stringify({
        text: contentIsPdf ? null : decodedContent,
        base64: contentIsPdf ? base64Content : null,
        isPdf: contentIsPdf,
        docId,
        mimeType,
        state: stateDetected,
        title: text.title || `Bill ${billId}`,
        url: text.state_link || null
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error in fetchFromLegiscan:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch from LegiScan',
      'An unexpected error occurred while fetching the bill text.',
      { billId }
    );
  }
}
