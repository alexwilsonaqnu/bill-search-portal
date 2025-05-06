
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import BillChat from "./BillChat";
import TextContentDisplay from "./text/TextContentDisplay";
import FullScreenDialog from "./FullScreenDialog";
import { fetchBillText } from "@/services/legiscan";
import { fallbackBillText } from "@/services/billTextService";
import BillTextHeader from "./BillTextHeader";
import BillTextLoading from "./BillTextLoading";
import BillTextError from "./BillTextError";
import PdfContentDisplay from "./pdf/PdfContentDisplay";
import ChatToggle from "./ChatToggle";

interface BillTextHashProps {
  textHash: string;
  billId: string;
  externalUrl?: string | null;
  autoFetch?: boolean;
  errorMessage?: string | null;
}

const BillTextHash = ({ 
  textHash, 
  billId, 
  externalUrl, 
  autoFetch = false, 
  errorMessage: initialErrorMessage 
}: BillTextHashProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialErrorMessage || null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPdfContent, setIsPdfContent] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loadFromCache, setLoadFromCache] = useState(false);
  
  // Check for cached text when component mounts
  useEffect(() => {
    const checkCachedText = () => {
      try {
        const cachedText = localStorage.getItem(`bill_text_${billId}`);
        if (cachedText) {
          const parsedCache = JSON.parse(cachedText);
          console.log(`Found cached text for bill ${billId}`);
          
          setTextContent(parsedCache.text);
          setIsHtmlContent(parsedCache.mimeType?.includes('html'));
          setIsPdfContent(parsedCache.isPdf || parsedCache.mimeType?.includes('pdf'));
          
          if (parsedCache.base64) {
            setPdfBase64(parsedCache.base64);
          }
          
          setLoadFromCache(true);
          return true;
        }
      } catch (e) {
        console.warn("Error retrieving bill text from cache:", e);
      }
      return false;
    };
    
    // Try to load from cache first
    const hasCachedText = checkCachedText();
    
    // If no cached text and autoFetch is true, fetch from API
    if (!hasCachedText && billId && autoFetch && !isLoading && !textContent) {
      fetchActualText();
    }
  }, [billId, autoFetch]);
  
  // Update error if passed from parent
  useEffect(() => {
    if (initialErrorMessage) {
      setError(initialErrorMessage);
    }
  }, [initialErrorMessage]);
  
  if (!billId) return null;
  
  const fetchActualText = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    console.log(`Fetching text for bill with ID: ${billId} from LegiScan`);
    
    try {
      const result = await fetchBillText(billId);
      console.log(`Received response for bill ${billId}:`, result);
      
      // Cache the result
      try {
        localStorage.setItem(`bill_text_${billId}`, JSON.stringify(result));
      } catch (e) {
        console.warn("Failed to cache bill text:", e);
      }
      
      if (result.isPdf) {
        setIsPdfContent(true);
        
        if (result.base64) {
          setPdfBase64(result.base64);
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
    } catch (error) {
      console.error("Error fetching bill text:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      
      // Try to use fallback content after API failure
      try {
        console.log("Using fallback bill text after API failure");
        const title = textHash ? `Bill with hash ${textHash}` : `Bill ${billId}`;
        const fallbackContent = await fallbackBillText(billId, title);
        setTextContent(fallbackContent.text);
        setIsHtmlContent(false);
        
        // Cache the fallback result
        try {
          localStorage.setItem(`bill_text_${billId}`, JSON.stringify(fallbackContent));
        } catch (e) {
          console.warn("Failed to cache fallback text:", e);
        }
      } catch (fallbackError) {
        console.error("Failed to use fallback text:", fallbackError);
      }
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

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };
  
  const retryFetchText = () => {
    fetchActualText();
  };
  
  const hasContent = (textContent && !isPdfContent) || (extractedText && extractedText.length > 100);
  
  return (
    <div className="space-y-2 relative">
      <BillTextHeader 
        hasTextContent={!!textContent}
        toggleFullScreen={toggleFullScreen}
        isLoading={isLoading}
      />
      
      {(!textContent || loadFromCache) && isLoading && (
        <BillTextLoading isLoading={isLoading} onFetchText={fetchActualText} />
      )}
      
      <BillTextError error={error} onRetry={retryFetchText} />
      
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

      {hasContent && (
        <div className="fixed bottom-6 left-6 z-40">
          <ChatToggle 
            isOpen={isChatOpen}
            onClick={toggleChat}
          />
        </div>
      )}
      
      {hasContent && (
        <div className="fixed bottom-4 left-4 z-50">
          <BillChat 
            billText={extractedText || textContent || ""} 
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default BillTextHash;
