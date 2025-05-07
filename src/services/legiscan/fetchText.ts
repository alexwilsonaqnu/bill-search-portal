
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Fetches bill text content from LegiScan
 * Always forces Illinois (IL) as the state regardless of bill ID
 */
export async function fetchBillText(billId: string) {
  try {
    console.log(`Invoking fetch-bill-text function with billId: ${billId}`);
    
    // Set a reasonable timeout for the API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after 12 seconds")), 12000)
    );
    
    // Make the API call - always include state='IL' to ensure consistent state handling
    const fetchPromise = supabase.functions.invoke('fetch-bill-text', {
      body: { 
        billId,
        state: 'IL' // Explicitly include state parameter for consistent handling
      }
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
      // Store in local storage with state information included
      localStorage.setItem(`bill_text_${billId}`, JSON.stringify({
        ...data,
        state: 'IL', // Ensure state is always stored with the bill text
        billId: billId // Include the billId in the cache for reference
      }));
    } catch (storageError) {
      console.warn("Failed to cache bill text with state information:", storageError);
    }
    
    // Force state to be 'IL' regardless of what's returned
    return {
      isPdf: data.isPdf || data.mimeType === 'application/pdf',
      base64: data.base64,
      text: data.text,
      mimeType: data.mimeType,
      title: data.title,
      url: data.url,
      state: 'IL', // Always force state to IL
      billId: billId // Include the billId in the returned object for reference
    };
  } catch (error) {
    console.error("Error fetching bill text:", error);
    throw error;
  }
}
