import { corsHeaders } from "../constants.ts";
import { createErrorResponse } from "../billHandlers.ts";

/**
 * Helper function to fetch from LegiScan with retry logic
 */
export async function fetchWithRetry(url: string, retries = 2, backoff = 1500) {
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
 * Create a standardized success response with proper CORS headers
 */
export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      } 
    }
  );
}
