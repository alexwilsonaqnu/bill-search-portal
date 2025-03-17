
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing PDF base64 data' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log("Received PDF data for OCR processing");
    
    // First attempt: Use PDF.js parsing approach directly
    try {
      console.log("Attempting direct PDF text extraction...");
      const pdfData = pdfBase64.includes('base64,') 
        ? atob(pdfBase64.split('base64,')[1])
        : atob(pdfBase64);
      
      const extractedText = await extractTextFromPdf(pdfData);
      
      if (extractedText && extractedText.length > 100) { // Ensure we got meaningful text
        console.log("Successfully extracted text with PDF.js approach");
        return new Response(
          JSON.stringify({ text: extractedText, method: "pdf-parse" }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
    } catch (pdfError) {
      console.error("Error in PDF.js extraction:", pdfError);
      // Continue to fallback method if this fails
    }
    
    // Fallback to simulated OCR approach (basic implementation)
    // In a production environment, you would integrate with a real OCR service
    console.log("Falling back to basic text extraction...");
    
    const simulatedOcrText = simulateOcrExtraction(pdfBase64);
    
    return new Response(
      JSON.stringify({ 
        text: simulatedOcrText,
        method: "simulated-ocr",
        message: "Used fallback extraction method. For better results, consider integrating with a dedicated OCR service."
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error in pdf-to-text function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        userMessage: 'Failed to extract text from the PDF. Please try again later.'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});

// Basic PDF text extraction
async function extractTextFromPdf(pdfData: string): Promise<string> {
  // This is a placeholder for PDF.js-based text extraction
  // In a real implementation, you would use PDF.js or a similar library
  
  // Extract visible text content from the PDF
  // This is a simplified approach that might work for some PDFs
  let extractedText = "";
  
  // Look for text markers in the PDF
  const textMarkers = [
    /\(([^)]{4,})\)/g, // Text inside parentheses
    /\[\(([^)]{4,})\)\]/g, // Text inside special brackets used in PDFs
    /TJ\s*\[\s*\(([^)]+)\)\s*\]/g, // TJ operator with text
    /Tj\s*\(([^)]+)\)/g, // Tj operator with text
  ];
  
  for (const marker of textMarkers) {
    const matches = pdfData.matchAll(marker);
    for (const match of matches) {
      if (match[1] && match[1].length > 1) {
        // Clean up the extracted text
        const text = match[1]
          .replace(/\\(\d{3})/g, (m, code) => String.fromCharCode(parseInt(code, 8)))
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')');
        
        if (text.trim() && !/^[0-9.]+$/.test(text)) { // Skip just numbers
          extractedText += text + " ";
        }
      }
    }
  }
  
  return extractedText.trim();
}

// Fallback extraction approach
function simulateOcrExtraction(pdfBase64: string): string {
  // In a real implementation, you would call an OCR service API here
  // This is just a placeholder returning a message about the bill format
  
  // For now, we'll return a formatted message explaining that we need to integrate with a proper OCR service
  return `
BILL TEXT EXTRACTION RESULTS:

This bill appears to be in PDF format with primarily image-based content.
Basic text extraction was attempted but produced limited results.

To improve text extraction from PDF bills:

1. The PDF contains formatted text that requires specialized extraction methods
2. For optimal results, a dedicated OCR service integration is recommended
3. Consider services like Google Cloud Vision, Amazon Textract, or Azure Computer Vision

The system will continue to display the PDF viewer for proper visualization of the bill content.

NOTE: PDF content can be viewed in the PDF viewer above.
  `;
}
