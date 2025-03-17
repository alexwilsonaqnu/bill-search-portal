
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AlertCircle, Maximize, FileText } from "lucide-react";
import BillChat from "./BillChat";
import PdfViewer from "./pdf/PdfViewer";
import ExtractedTextDisplay from "./pdf/ExtractedTextDisplay";
import PdfFallbackDisplay from "./pdf/PdfFallbackDisplay";
import TextContentDisplay from "./text/TextContentDisplay";
import FullScreenDialog from "./FullScreenDialog";
import { fetchBillText } from "@/services/billTextService";

interface BillTextHashProps {
  textHash: string;
  billId: string;
  externalUrl?: string | null;
}

const BillTextHash = ({ textHash, billId, externalUrl }: BillTextHashProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPdfContent, setIsPdfContent] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  
  // Automatically fetch the bill text when the component mounts
  useEffect(() => {
    if (billId) {
      fetchActualText();
    }
  }, [billId]);
  
  if (!billId) return null;
  
  const fetchActualText = async () => {
    if (isLoading || textContent) return;
    
    setIsLoading(true);
    setError(null);
    toast.info("Fetching bill text from Legiscan...");
    
    try {
      const result = await fetchBillText(billId);
      
      // Check if content is PDF
      if (result.isPdf) {
        setIsPdfContent(true);
        
        if (result.base64) {
          setPdfBase64(result.base64);
          toast.success("PDF document loaded successfully");
        } else {
          // If no base64 data, display the fallback message
          setTextContent(result.text);
          setIsHtmlContent(true);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Check if content is HTML by looking for HTML tags
      const isHtml = result.text.includes('<html') || 
                     result.text.includes('<meta') || 
                     result.text.includes('<style') || 
                     result.text.includes('<body');
      
      setIsHtmlContent(isHtml);
      setTextContent(result.text);
      toast.success("Bill text fetched successfully");
    } catch (error) {
      console.error("Error fetching bill text:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text extraction from PDF
  const handleTextExtraction = (text: string) => {
    setExtractedText(text);
    // Make text available for chat if it's meaningful
    if (text && text.length > 100) {
      setTextContent(text);
      setIsHtmlContent(false);
    }
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };
  
  return (
    <div className="space-y-2 relative">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Bill Text</h3>
        {!textContent && isLoading && (
          <div className="flex items-center">
            <Spinner className="mr-2 h-4 w-4" />
            <span className="text-sm text-gray-500">Loading bill text...</span>
          </div>
        )}
        {textContent && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullScreen}
            className="flex items-center gap-1"
          >
            <Maximize className="h-4 w-4" /> Full Screen
          </Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-2">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                The Legiscan API subscription may have expired. Please contact the administrator.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {!textContent && !isLoading && !error && (
        <div>
          <Button
            onClick={fetchActualText}
            disabled={isLoading}
            size="sm"
            className="mt-2"
          >
            {isLoading ? "Loading..." : "Load Bill Text"}
          </Button>
        </div>
      )}
      
      {/* PDF Content Special Handling */}
      {isPdfContent && pdfBase64 && !isFullScreen && (
        <div className="mt-4 border rounded-md p-4">
          <div className="flex items-center gap-1 mb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="font-medium">PDF Document</span>
          </div>
          
          <PdfViewer 
            pdfBase64={pdfBase64} 
            externalUrl={externalUrl} 
            onTextExtracted={handleTextExtraction} 
          />
          
          {/* Display extracted text if available */}
          {extractedText && <ExtractedTextDisplay text={extractedText} />}
        </div>
      )}
      
      {/* PDF Fallback Message */}
      {isPdfContent && !pdfBase64 && textContent && !isFullScreen && (
        <div className="mt-4">
          <PdfFallbackDisplay content={textContent} externalUrl={externalUrl} />
        </div>
      )}
      
      {/* Regular Content Display */}
      {textContent && !isPdfContent && !isFullScreen && (
        <TextContentDisplay content={textContent} isHtml={isHtmlContent} />
      )}

      {/* Full Screen Dialog */}
      <FullScreenDialog 
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        title="Bill Text"
        isPdfContent={isPdfContent}
        pdfBase64={pdfBase64}
        textContent={textContent}
        extractedText={extractedText}
        isHtmlContent={isHtmlContent}
        externalUrl={externalUrl}
        onTextExtracted={handleTextExtraction}
      />

      {/* Chat component - disabled for PDF content unless text has been extracted */}
      {(textContent && !isPdfContent) || (extractedText && extractedText.length > 100) ? (
        <BillChat billText={extractedText || textContent || ""} />
      ) : null}
    </div>
  );
};

export default BillTextHash;
