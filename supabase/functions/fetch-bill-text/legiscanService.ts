
import { corsHeaders } from "./constants.ts";
import { createErrorResponse } from "./billHandlers.ts";

/**
 * Fetches bill text from LegiScan API
 * Includes improved error handling, response processing, and retry logic
 */
export async function fetchFromLegiscan(billId: string, apiKey: string) {
  try {
    console.log(`Fetching document content from LegiScan API for bill ${billId}`);
    
    // Construct the LegiScan API request URL for the "getBillText" operation
    const requestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}`;
    
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
    
    // Return the processed response
    return new Response(
      JSON.stringify({
        text: isPdf ? null : decodedContent,
        base64: isPdf ? base64Content : null,
        isPdf: isPdf,
        docId,
        mimeType,
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

/**
 * Helper function to fetch from LegiScan with retry logic
 */
async function fetchWithRetry(url: string, retries = 2, backoff = 1500) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If not first attempt, wait with exponential backoff
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retries} after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds
      
      const response = await fetch(url);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry aborted requests (timeouts)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds');
      }
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Otherwise continue to next retry attempt
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError;
}

/**
 * Decode base64 text content
 * This is a more robust implementation that handles various edge cases
 */
export function decodeBase64Text(base64Content: string) {
  // First, handle URL-safe base64
  const normalizedBase64 = base64Content.replace(/-/g, '+').replace(/_/g, '/');
  
  try {
    // Try standard atob first
    return atob(normalizedBase64);
  } catch (e) {
    console.error("Error decoding with atob:", e);
    
    // Try the Deno.decode approach as a fallback
    try {
      const binaryString = atob(normalizedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch (denoError) {
      console.error("Error with Deno text decoding:", denoError);
      throw new Error("Failed to decode base64 content");
    }
  }
}
