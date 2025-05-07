
import { corsHeaders } from "./constants.ts";
import { createErrorResponse } from "./billHandlers.ts";
import { fetchWithRetry, createSuccessResponse } from "./utils/httpUtils.ts";
import { decodeBase64Text, isPdfContent } from "./utils/decodingUtils.ts";
import { isIllinoisContent, detectStateFromContent, getStateCodeById } from "./utils/contentUtils.ts";
import { enhanceIllinoisBillText } from "./utils/formattingUtils.ts";

/**
 * Fetches bill text from LegiScan API
 * Includes improved error handling, response processing, and state detection
 */
export async function fetchFromLegiscan(billId: string, apiKey: string, state = 'IL') {
  try {
    console.log(`Fetching document content from LegiScan API for bill ${billId} from state ${state}`);
    
    // Construct the LegiScan API request URL for the "getBillText" operation
    // Explicitly include the state parameter to ensure we get Illinois bills
    const requestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}&state=${state}`;
    
    // Make API request with retry logic
    const data = await fetchWithRetry(requestUrl);
    
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
    
    // Get state information from the bill data
    const stateInfo = state || text.state || detectStateFromContent(decodedContent);
    const stateCode = text.state_id ? getStateCodeById(text.state_id) : state;
    
    // Check if content is PDF
    const contentIsPdf = isPdf || isPdfContent(decodedContent);
    const isIllinois = stateCode === 'IL' || stateInfo === 'IL' || 
                      (decodedContent && isIllinoisContent(decodedContent));
    
    // Special handling for Illinois content
    if (isIllinois && !contentIsPdf) {
      // Add Illinois-specific styling for better display
      decodedContent = enhanceIllinoisBillText(decodedContent);
    }
    
    // Return the processed response with correct state info
    return createSuccessResponse({
      text: contentIsPdf ? null : decodedContent,
      base64: contentIsPdf ? base64Content : null,
      isPdf: contentIsPdf,
      docId,
      mimeType,
      state: stateCode || stateInfo || 'IL',  // Ensure state is always set, default to IL
      title: text.title || `Bill ${billId}`,
      url: text.state_link || null
    });
  } catch (error) {
    console.error('Error in fetchFromLegiscan:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch from LegiScan',
      'An unexpected error occurred while fetching the bill text.',
      { billId }
    );
  }
}
