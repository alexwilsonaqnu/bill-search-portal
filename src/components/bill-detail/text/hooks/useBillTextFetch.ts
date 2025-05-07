
import { useState, useEffect, useCallback } from "react";
import { fetchBillText } from "@/services/legiscan";
import { fallbackBillText } from "@/services/billTextService";
import { getCachedBillText, cacheBillText } from "../utils/billTextCache";

interface UseBillTextFetchProps {
  billId?: string;
  state?: string;
  billNumber?: string;
  autoFetch?: boolean;
  initialErrorMessage?: string | null;
}

interface UseBillTextFetchResult {
  isLoading: boolean;
  textContent: string | null;
  error: string | null;
  isPdfContent: boolean;
  pdfBase64: string | null;
  isHtmlContent: boolean;
  extractedText: string | null;
  loadFromCache: boolean;
  fetchText: () => Promise<void>;
  onTextExtracted: (text: string) => void;
}

export function useBillTextFetch({
  billId,
  state = 'IL',
  billNumber,
  autoFetch = true,
  initialErrorMessage
}: UseBillTextFetchProps): UseBillTextFetchResult {
  const [isLoading, setIsLoading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialErrorMessage || null);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [isPdfContent, setIsPdfContent] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loadFromCache, setLoadFromCache] = useState(false);
  
  // Log which approach we're using
  useEffect(() => {
    console.log(`useBillTextFetch: Using ${billNumber ? 'state+billNumber' : 'billId'} approach`, {
      state,
      billNumber,
      billId
    });
  }, [billId, state, billNumber]);
  
  // Update error if passed from parent
  useEffect(() => {
    if (initialErrorMessage) {
      setError(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  // Check for cached text when hook mounts
  useEffect(() => {
    const checkCachedText = () => {
      const cachedData = getCachedBillText(billId, state, billNumber);
      
      if (cachedData) {
        setTextContent(cachedData.text);
        setIsHtmlContent(cachedData.mimeType?.includes('html'));
        setIsPdfContent(cachedData.isPdf || cachedData.mimeType?.includes('pdf'));
        
        if (cachedData.base64) {
          setPdfBase64(cachedData.base64);
        }
        
        setLoadFromCache(true);
        return true;
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
  }, [billId, state, billNumber, autoFetch]);
  
  const fetchActualText = useCallback(async () => {
    if (isLoading || (!billId && !(state && billNumber))) return;
    
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
        
        // Cache the successful PDF result
        cacheBillText(result, billId, state, billNumber);
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
      
      // Cache the successful result
      cacheBillText(result, billId, state, billNumber);
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
        
        // Cache the fallback result
        cacheBillText(fallbackContent, billId, state, billNumber);
      } catch (fallbackError) {
        console.error("Failed to use fallback text:", fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [billId, state, billNumber, isLoading]);

  const handleTextExtraction = useCallback((text: string) => {
    setExtractedText(text);
    if (text && text.length > 100) {
      setTextContent(text);
      setIsHtmlContent(false);
    }
  }, []);

  return {
    isLoading,
    textContent,
    error,
    isPdfContent,
    pdfBase64,
    isHtmlContent,
    extractedText,
    loadFromCache,
    fetchText: fetchActualText,
    onTextExtracted: handleTextExtraction
  };
}
