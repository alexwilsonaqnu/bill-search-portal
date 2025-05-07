
import { useState, useEffect } from "react";
import { fetchBillText } from "@/services/legiscan";
import { fallbackBillText } from "@/services/billTextService";

interface BillTextFetcherProps {
  billId: string;
  autoFetch?: boolean;
  initialErrorMessage?: string | null;
  children: (props: {
    isLoading: boolean;
    textContent: string | null;
    error: string | null;
    isPdfContent: boolean;
    pdfBase64: string | null;
    isHtmlContent: boolean;
    extractedText: string | null;
    onTextExtracted: (text: string) => void;
    retryFetchText: () => void;
    loadFromCache: boolean;
  }) => React.ReactNode;
}

const BillTextFetcher = ({
  billId,
  autoFetch = false,
  initialErrorMessage,
  children
}: BillTextFetcherProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialErrorMessage || null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [isPdfContent, setIsPdfContent] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
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
        const title = billId ? `Bill ${billId}` : `Unknown Bill`;
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

  return children({
    isLoading,
    textContent,
    error,
    isPdfContent,
    pdfBase64,
    isHtmlContent,
    extractedText,
    onTextExtracted: handleTextExtraction,
    retryFetchText: fetchActualText,
    loadFromCache
  });
};

export default BillTextFetcher;
