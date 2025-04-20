
import { useEffect, useState } from "react";
import { toast } from "sonner";
import BillChat from "./BillChat";
import TextContentDisplay from "./text/TextContentDisplay";
import FullScreenDialog from "./FullScreenDialog";
import { fetchBillText } from "@/services/billTextService";
import BillTextHeader from "./BillTextHeader";
import BillTextLoading from "./BillTextLoading";
import BillTextError from "./BillTextError";
import PdfContentDisplay from "./pdf/PdfContentDisplay";

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  useEffect(() => {
    console.log(`BillTextHash component using billId: ${billId} and textHash: ${textHash}`);
  }, [billId, textHash]);
  
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
    console.log(`Fetching text for bill with ID: ${billId}`);
    toast.info("Fetching bill text from Legiscan...");
    
    try {
      const result = await fetchBillText(billId);
      console.log(`Received response for bill ${billId}:`, result);
      
      if (result.isPdf) {
        setIsPdfContent(true);
        
        if (result.base64) {
          setPdfBase64(result.base64);
          toast.success("PDF document loaded successfully");
        } else {
          setTextContent(result.text);
          setIsHtmlContent(true);
        }
        
        setIsLoading(false);
        return;
      }
      
      const isHtml = result.text.includes('<html') || 
                     result.text.includes('<table') || 
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

  const handleTextExtraction = (text: string) => {
    setExtractedText(text);
    if (text && text.length > 100) {
      setTextContent(text);
      setIsHtmlContent(false);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };
  
  return (
    <div className="space-y-2 relative">
      <BillTextHeader 
        hasTextContent={!!textContent}
        toggleFullScreen={toggleFullScreen}
        isLoading={isLoading}
      />
      
      {!textContent && isLoading && (
        <BillTextLoading isLoading={isLoading} onFetchText={fetchActualText} />
      )}
      
      <BillTextError error={error} />
      
      {!textContent && !isLoading && !error && (
        <BillTextLoading isLoading={isLoading} onFetchText={fetchActualText} />
      )}
      
      {isPdfContent && (
        <PdfContentDisplay 
          pdfBase64={pdfBase64} 
          textContent={textContent}
          externalUrl={externalUrl}
          extractedText={extractedText}
          onTextExtracted={handleTextExtraction}
          isFullScreen={isFullScreen}
        />
      )}
      
      {textContent && !isPdfContent && !isFullScreen && (
        <TextContentDisplay content={textContent} isHtml={isHtmlContent} />
      )}

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

      {(textContent && !isPdfContent) || (extractedText && extractedText.length > 100) ? (
        <BillChat 
          billText={extractedText || textContent || ""} 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default BillTextHash;
