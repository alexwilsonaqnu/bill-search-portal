
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FileSearch } from "lucide-react";
import { toast } from "sonner";

interface PdfTextExtractorProps {
  pdfDocument: any;
  pdfBase64: string;
  onTextExtracted: (text: string) => void;
}

const PdfTextExtractor = ({ pdfDocument, pdfBase64, onTextExtracted }: PdfTextExtractorProps) => {
  const [isExtractingText, setIsExtractingText] = useState(false);
  
  const extractTextFromPdf = async () => {
    if (!pdfDocument) {
      toast.error("No PDF document loaded");
      return;
    }
    
    setIsExtractingText(true);
    toast.info("Extracting text directly from PDF...");
    
    try {
      let extractedText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        
        // Process text items
        const textItems = textContent.items;
        let lastY;
        
        // Process each text item
        for (const item of textItems) {
          if ('str' in item) {
            // Add new line when y position changes significantly
            if (lastY && Math.abs(lastY - item.transform[5]) > 5) {
              extractedText += '\n';
            }
            extractedText += item.str + ' ';
            lastY = item.transform[5];
          }
        }
        
        // Add page break between pages
        extractedText += '\n\n';
      }
      
      // Clean up extracted text - remove excessive whitespace
      extractedText = extractedText
        .replace(/\s+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .replace(/\n+/g, '\n\n')
        .trim();
      
      if (extractedText && extractedText.length > 0) {
        toast.success("Text successfully extracted from PDF");
        
        // If we got good text, pass it to the parent component
        onTextExtracted(extractedText);
        
        return extractedText;
      } else {
        // If direct extraction failed, fall back to server-side extraction
        return await extractTextViaApi();
      }
    } catch (error) {
      console.error("Error extracting text directly from PDF:", error);
      toast.info("Trying server-side extraction method...");
      
      // Fall back to server-side extraction
      return await extractTextViaApi();
    } finally {
      setIsExtractingText(false);
    }
  };
  
  // Fallback method using the server-side text extraction API
  const extractTextViaApi = async () => {
    try {
      const { data, error } = await fetch('/api/functions/v1/pdf-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfBase64 }),
      }).then(res => res.json());
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast.success(`Text extracted using server-side ${data.method}`);
      
      // If we got text, pass it to the parent component
      if (data.text && data.text.length > 0) {
        onTextExtracted(data.text);
      }
      
      return data.text;
    } catch (error) {
      console.error("Error with server-side text extraction:", error);
      toast.error(`Failed to extract text: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };
  
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={extractTextFromPdf}
      disabled={isExtractingText}
      className="flex items-center gap-2"
    >
      {isExtractingText ? (
        <>
          <Spinner className="h-4 w-4" />
          Extracting Text...
        </>
      ) : (
        <>
          <FileSearch className="h-4 w-4" />
          Extract Text from PDF
        </>
      )}
    </Button>
  );
};

export default PdfTextExtractor;
