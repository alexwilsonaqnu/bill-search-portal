
import { checkRateLimit, updateRateLimit } from "./rateLimiter.ts";

// Implements exponential backoff for retries with rate limiting awareness
export async function fetchWithBackoff(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  // Check if we're within rate limits
  const { shouldWait, waitTime } = checkRateLimit();
  
  // Enforce minimum interval between requests
  if (shouldWait) {
    console.log(`Rate limiting: waiting ${waitTime}ms before request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update rate limit tracking
  updateRateLimit();
  
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      // Get retry-after header or use exponential backoff
      const retryAfter = response.headers.get('retry-after');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
      
      console.log(`Rate limited (429), retrying after ${waitTime}ms. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      console.error(`Fetch error: ${error.message}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}
