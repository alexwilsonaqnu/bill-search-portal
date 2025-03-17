
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function fetchBillText(billId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-bill-text', {
      body: { billId }
    });
    
    if (error) {
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data.error) {
      const userMessage = data.userMessage || data.error;
      throw new Error(userMessage);
    }
    
    return {
      isPdf: data.isPdf || data.mimeType === 'application/pdf',
      base64: data.base64,
      text: data.text,
      mimeType: data.mimeType
    };
  } catch (error) {
    console.error("Error fetching bill text:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast.error(`Failed to fetch bill text: ${errorMessage}`);
    throw error;
  }
}

export async function extractTextFromPdf(pdfBase64: string) {
  try {
    const { data, error } = await supabase.functions.invoke('pdf-to-text', {
      body: { pdfBase64 }
    });
    
    if (error) {
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      text: data.text,
      method: data.method
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}
