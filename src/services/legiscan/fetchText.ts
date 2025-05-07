
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fetches bill text content from LegiScan
 * Uses state and bill number (preferred) or bill ID
 */
export async function fetchBillText(billId: string, state: string = 'IL', billNumber?: string) {
  try {
    // Log which approach we're using to fetch
    console.log(`Invoking fetch-bill-text function with ${billNumber ? `state: ${state}, billNumber: ${billNumber}` : `billId: ${billId}`}`);
    
    // Set a reasonable timeout for the API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after 12 seconds")), 12000)
    );
    
    // Prepare request body - prioritize state+billNumber if available
    const requestBody = (state && billNumber)
      ? { state, billNumber } // Preferred: use state and bill number
      : { billId, state }; // Fallback: use bill ID but always include state
    
    // Make the API call with the appropriate parameters
    const fetchPromise = supabase.functions.invoke('fetch-bill-text', {
      body: requestBody
    });
    
    // Use Promise.race to handle timeouts
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data, error } = result || {};
    
    if (error) {
      console.error(`Error invoking fetch-bill-text:`, error);
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data?.error) {
      console.error(`fetch-bill-text returned error:`, data);
      const userMessage = data.userMessage || data.error;
      throw new Error(userMessage);
    }
    
    console.log(`fetch-bill-text successful response:`, data);
    
    // Cache the bill text with state information
    try {
      // Generate a consistent cache key based on available identifiers
      // Prioritize state+billNumber if available for the cache key
      const cacheKey = (state && billNumber) 
        ? `bill_text_${state}_${billNumber}` 
        : `bill_text_${billId}`;
        
      localStorage.setItem(cacheKey, JSON.stringify({
        ...data,
        state: state || 'IL', // Ensure state is always stored
        billId: billId, // Include the billId for reference
        billNumber: billNumber || data.billNumber // Include bill number if available
      }));
    } catch (storageError) {
      console.warn("Failed to cache bill text with state information:", storageError);
    }
    
    // Always ensure consistent state and identifiers in the returned object
    return {
      isPdf: data.isPdf || data.mimeType === 'application/pdf',
      base64: data.base64,
      text: data.text,
      mimeType: data.mimeType,
      title: data.title,
      url: data.url,
      state: state || 'IL', // Always ensure state is returned
      billId: billId, // Always include billId
      billNumber: billNumber || data.billNumber // Include billNumber if available
    };
  } catch (error) {
    console.error("Error fetching bill text:", error);
    throw error;
  }
}
