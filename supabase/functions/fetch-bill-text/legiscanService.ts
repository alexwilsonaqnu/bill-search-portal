
import { corsHeaders } from "./constants.ts";
import { createErrorResponse } from "./billHandlers.ts";
import { fetchWithRetry, createSuccessResponse } from "./utils/httpUtils.ts";
import { decodeBase64Text, isPdfContent } from "./utils/decodingUtils.ts";
import { isIllinoisContent, detectStateFromContent, getStateCodeById } from "./utils/contentUtils.ts";
import { enhanceIllinoisBillText } from "./utils/formattingUtils.ts";

/**
 * Fetches bill text from LegiScan API
 * Supports fetching by billId OR state+billNumber
 */
export async function fetchFromLegiscan(
  billId: string | null, 
  apiKey: string,
  state?: string,
  billNumber?: string
) {
  try {
    // Log which method we're using to fetch
    if (state && billNumber) {
      console.log(`Fetching document content from LegiScan API for ${state} bill ${billNumber}`);
    } else if (billId) {
      console.log(`Fetching document content from LegiScan API for bill ${billId}`);
    } else {
      return createErrorResponse(
        'Invalid parameters',
        'Either billId or state and billNumber must be provided',
        { billId, state, billNumber }
      );
    }
    
    // Construct the LegiScan API request URL for the appropriate operation
    let requestUrl;
    if (state && billNumber) {
      // Using state+billNumber approach (preferred method)
      requestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBill&state=${state}&bill=${billNumber}`;
    } else {
      // Using bill_id for direct lookup (fallback method)
      requestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}`;
    }
    
    // Make API request with retry logic
    const data = await fetchWithRetry(requestUrl);
    
    // Handle API errors
    if (data.status !== 'OK') {
      console.error('LegiScan API returned an error:', data);
      return createErrorResponse(
        data.alert?.message || 'LegiScan API error',
        'The requested bill text could not be retrieved. It may not exist or require special access.',
        data
      );
    }
    
    // Different response handling based on the API call type
    if (state && billNumber) {
      // Handle getBill response (when using state+billNumber)
      return handleGetBillResponse(data, apiKey, state, billNumber);
    } else {
      // Handle getBillText response (when using billId)
      return handleGetBillTextResponse(data, billId || '', state || 'IL');
    }
  } catch (error) {
    console.error('Error in fetchFromLegiscan:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch from LegiScan',
      'An unexpected error occurred while fetching the bill text.',
      { billId, state, billNumber }
    );
  }
}

/**
 * Handles response from getBillText API operation
 */
async function handleGetBillTextResponse(data: any, billId: string, state: string) {
  // Extract text data
  const { text } = data;
  if (!text) {
    return createErrorResponse(
      'No text content available',
      'The bill text content is not available from LegiScan.',
      { billId, state }
    );
  }
  
  const docId = text.doc_id;
  const base64Content = text.doc;
  
  // Process the content based on mime type
  const mimeType = text.mime || 'text/html';
  const isPdf = mimeType === 'application/pdf' || text.mime_id === 2;
  
  if (!base64Content) {
    return createErrorResponse(
      'No content available',
      'The bill text content is not available from LegiScan.',
      { billId, state, docId }
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
      { billId, state, docId }
    );
  }
  
  const contentIsPdf = isPdf || isPdfContent(decodedContent);
  
  // Special handling for state-specific content
  if (!contentIsPdf) {
    // Add state-specific styling for better display
    decodedContent = enhanceIllinoisBillText(decodedContent);
  }
  
  // Return the processed response
  return createSuccessResponse({
    text: contentIsPdf ? null : decodedContent,
    base64: contentIsPdf ? base64Content : null,
    isPdf: contentIsPdf,
    docId,
    mimeType,
    state,
    title: text.title || `Bill ${billId}`,
    url: text.state_link || null,
    billId: billId,
    billNumber: text.bill_number || null
  });
}

/**
 * Handles response from getBill API operation
 * May need to make additional API call to get the text content
 */
async function handleGetBillResponse(data: any, apiKey: string, state: string, billNumber: string) {
  // Extract bill data
  const { bill } = data;
  if (!bill) {
    return createErrorResponse(
      'No bill data available',
      'The bill information could not be retrieved from LegiScan.',
      { state, billNumber }
    );
  }
  
  // Store the bill ID for reference
  const billId = bill.bill_id;
  
  // Check if bill has text elements
  if (!bill.texts || bill.texts.length === 0) {
    return createErrorResponse(
      'No bill text available',
      'This bill does not have any text documents available.',
      { state, billNumber, billId }
    );
  }
  
  // Get the most recent text (typically the first one)
  const textInfo = bill.texts[0];
  const docId = textInfo.doc_id;
  
  // Make a second API call to get the actual text content
  const textRequestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docId}`;
  console.log(`Making second API call to get text document: ${docId}`);
  
  try {
    const textData = await fetchWithRetry(textRequestUrl);
    if (textData.status !== 'OK' || !textData.text) {
      return createErrorResponse(
        'Failed to retrieve text content',
        'The bill text document could not be retrieved.',
        { state, billNumber, docId }
      );
    }
    
    // Now we have the text content, process it similarly to getBillText
    // But make sure to include billId, billNumber, and state in the response
    const { text } = textData;
    const base64Content = text.doc;
    const mimeType = text.mime || 'text/html';
    const isPdf = mimeType === 'application/pdf' || text.mime_id === 2;
    
    if (!base64Content) {
      return createErrorResponse(
        'No content available',
        'The bill text content is not available from LegiScan.',
        { state, billNumber, billId, docId }
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
        { state, billNumber, billId, docId }
      );
    }
    
    const contentIsPdf = isPdf || isPdfContent(decodedContent);
    
    // Special handling for state-specific content
    if (!contentIsPdf) {
      // Add state-specific styling for better display
      decodedContent = enhanceIllinoisBillText(decodedContent);
    }
    
    // Return the processed response with both billId and billNumber
    return createSuccessResponse({
      text: contentIsPdf ? null : decodedContent,
      base64: contentIsPdf ? base64Content : null,
      isPdf: contentIsPdf,
      docId,
      mimeType,
      state,
      title: text.title || `${state} Bill ${billNumber}`,
      url: text.state_link || bill.state_link || null,
      billId: billId,
      billNumber: billNumber
    });
    
  } catch (error) {
    console.error('Error fetching bill text document:', error);
    return createErrorResponse(
      'Error retrieving text document',
      'Failed to retrieve the bill text document.',
      { state, billNumber, docId }
    );
  }
}
