
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight, ExternalLink, FileSearch } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfBase64: string;
  externalUrl?: string | null;
  onTextExtracted?: (text: string) => void;
  isFullScreen?: boolean;
}

const PdfViewer = ({ pdfBase64, externalUrl, onTextExtracted, isFullScreen = false }: PdfViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    loadPdfFromBase64(pdfBase64);
  }, [pdfBase64]);
  
  useEffect(() => {
    if (pdfDocument && canvasRef.current) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, isFullScreen]);
  
  const loadPdfFromBase64 = async (base64Data: string) => {
    try {
      // Remove the data URL prefix if present
      const pdfData = base64Data.includes('base64,') 
        ? atob(base64Data.split('base64,')[1])
        : atob(base64Data);
      
      // Convert binary string to array buffer
      const array = new Uint8Array(pdfData.length);
      for (let i = 0; i < pdfData.length; i++) {
        array[i] = pdfData.charCodeAt(i);
      }
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: array.buffer });
      const pdf = await loadingTask.promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      return pdf;
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF document");
      return null;
    }
  };
  
  const renderPage = async (pageNumber: number) => {
    if (!pdfDocument || !canvasRef.current) return;
    
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
    } catch (error) {
      console.error("Error rendering PDF page:", error);
      toast.error("Failed to render PDF page");
    }
  };
  
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
        if (onTextExtracted) {
          onTextExtracted(extractedText);
        }
        
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
      if (data.text && data.text.length > 0 && onTextExtracted) {
        onTextExtracted(data.text);
      }
      
      return data.text;
    } catch (error) {
      console.error("Error with server-side text extraction:", error);
      toast.error(`Failed to extract text: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const openExternalUrl = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("No external URL available for this bill");
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <span className="font-medium">PDF Document</span>
        </div>
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm mx-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="ml-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className={`flex justify-center bg-gray-100 p-2 rounded ${isFullScreen ? 'flex-1 overflow-auto' : ''}`}>
        <canvas ref={canvasRef} className={isFullScreen ? "max-h-full" : "max-w-full"} />
      </div>
      
      <div className="mt-4 flex justify-between items-center">
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
        
        {externalUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={openExternalUrl}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Original PDF
          </Button>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
