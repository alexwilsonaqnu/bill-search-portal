import { supabase } from "@/integrations/supabase/client";

export async function fetchBillText(billId: string) {
  try {
    console.log(`Invoking fetch-bill-text function with billId: ${billId}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-bill-text', {
      body: { billId }
    });
    
    if (error) {
      console.error(`Error invoking fetch-bill-text:`, error);
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data.error) {
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
    
    const { data, error } = await supabase.functions.invoke('pdf-to-text', {
      body: { pdfBase64 }
    });
    
    if (error) {
      console.error(`Error invoking pdf-to-text:`, error);
      throw new Error(`Error invoking function: ${error.message}`);
    }
    
    if (data.error) {
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
