
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Fetches bill text content from LegiScan
 */
export async function fetchBillText(billId: string) {
  try {
    console.log(`Invoking fetch-bill-text function with billId: ${billId}`);
    
    // Set a reasonable timeout for the API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after 10 seconds")), 10000)
    );
    
    const fetchPromise = supabase.functions.invoke('fetch-bill-text', {
      body: { billId }
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
    
    return {
      isPdf: data.isPdf || data.mimeType === 'application/pdf',
      base64: data.base64,
      text: data.text,
      mimeType: data.mimeType,
      title: data.title,
      url: data.url
    };
  } catch (error) {
    console.error("Error fetching bill text:", error);
    throw error;
  }
}

export async function extractTextFromPdf(pdfBase64: string) {
  try {
    console.log(`Invoking pdf-to-text function with PDF data length: ${pdfBase64.length}`);
    
    // Set a reasonable timeout for PDF extraction
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("PDF extraction timed out after 15 seconds")), 15000)
    );
    
    const fetchPromise = supabase.functions.invoke('pdf-to-text', {
      body: { pdfBase64 }
    });
    
    // Use Promise.race to handle timeouts
    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const { data, error } = result || {};
    
    if (error) {
      console.error(`Error invoking pdf-to-text:`, error);
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data?.error) {
      console.error(`pdf-to-text returned error:`, data);
      throw new Error(data.error);
    }
    
    console.log(`pdf-to-text successful response method: ${data.method}`);
    
    return {
      text: data.text,
      method: data.method
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

/**
 * Fallback mechanism to fetch bill content when the API fails
 */
export async function fallbackBillText(billId: string, title: string) {
  return {
    text: `# ${title || `Bill ${billId}`}\n\nWe're unable to retrieve the full text for this bill at the moment. This could be due to:\n\n- Temporary API issues with LegiScan\n- Network connectivity problems\n- The bill text may not be available in the LegiScan database yet\n\nPlease try again later or check the official legislative website for this bill's content.`,
    isPdf: false,
    mimeType: 'text/markdown',
    title: title || `Bill ${billId}`,
    url: null
  };
}
