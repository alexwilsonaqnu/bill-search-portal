
import { useState, useEffect } from "react";
import { fetchBillText } from "@/services/legiscan";
import { fallbackBillText } from "@/services/billTextService";

interface BillTextFetcherProps {
  billId: string;
  state?: string;
  billNumber?: string;
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
  state = 'IL',
  billNumber,
  autoFetch = true,
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
  
  // Generate a consistent cache key based on available identifiers
  // Prioritize state+billNumber if available
  const cacheKey = billNumber 
    ? `bill_text_${state}_${billNumber}` 
    : `bill_text_${billId}`;
  
  // Log which approach we're using
  console.log(`BillTextFetcher: Using ${billNumber ? 'state+billNumber' : 'billId'} approach`, {
    state,
    billNumber,
    billId,
    cacheKey
  });
  
  // Check for cached text when component mounts
  useEffect(() => {
    const checkCachedText = () => {
      try {
        const cachedText = localStorage.getItem(cacheKey);
        if (cachedText) {
          const parsedCache = JSON.parse(cachedText);
          console.log(`Found cached text for ${billNumber ? `${state} bill ${billNumber}` : `bill ID ${billId}`}`);
          
          // Validate the state in cache matches our expected state
          if (parsedCache.state !== state) {
            console.warn(`Cached text has incorrect state: ${parsedCache.state}, expected: ${state}`);
            return false;
          }
          
          // Validate ID matches if we're using billId
          if (!billNumber && parsedCache.billId && parsedCache.billId !== billId) {
            console.warn(`Cached text has mismatched billId: ${parsedCache.billId}, expected: ${billId}`);
            return false;
          }
          
          // Validate bill number matches if we're using billNumber
          if (billNumber && parsedCache.billNumber && parsedCache.billNumber !== billNumber) {
            console.warn(`Cached text has mismatched billNumber: ${parsedCache.billNumber}, expected: ${billNumber}`);
            return false;
          }
          
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
    
    // If no cached text and we have identifiers, fetch from API immediately
    if (!hasCachedText && autoFetch && ((billId) || (state && billNumber))) {
      console.log(`No cached text found, fetching from API...`);
      fetchActualText();
    }
  }, [billId, state, billNumber, autoFetch, cacheKey]);
  
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
    
    // Log which method we're using to fetch
    console.log(`Fetching text ${billNumber ? `for ${state} bill ${billNumber}` : `for bill ID ${billId}`}`);
    
    try {
      // Use the appropriate fetch method based on available identifiers
      // Prioritize state+billNumber if available
      const result = (state && billNumber)
        ? await fetchBillText(billId, state, billNumber)  // Use state+billNumber approach
        : await fetchBillText(billId, state);             // Use billId approach with state
        
      console.log(`Received text response:`, result);
      
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
      
      // Detect HTML content
      const isHtml = result.text?.includes('<html') || 
                     result.text?.includes('<table') || 
                     result.text?.includes('<meta') || 
                     result.text?.includes('<style') || 
                     result.text?.includes('<body');
      
      setIsHtmlContent(isHtml);
      setTextContent(result.text);
      
      // Cache the successful result with all identifiers
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          ...result,
          state,
          billId,
          billNumber
        }));
      } catch (cacheError) {
        console.warn("Failed to cache text result:", cacheError);
      }
    } catch (error) {
      console.error("Error fetching bill text:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      
      // Try to use fallback content after API failure
      try {
        console.log("Using fallback bill text after API failure");
        const title = billNumber ? `${state} Bill ${billNumber}` : `Bill ${billId}`;
        const fallbackContent = await fallbackBillText(billId, title);
        setTextContent(fallbackContent.text);
        setIsHtmlContent(false);
        
        // Cache the fallback result with identifiers
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            ...fallbackContent,
            state,
            billId,
            billNumber
          }));
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
