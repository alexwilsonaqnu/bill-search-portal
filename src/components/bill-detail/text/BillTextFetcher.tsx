
import React from "react";
import { useBillTextFetch } from "./hooks/useBillTextFetch";

interface BillTextFetcherProps {
  billId?: string;
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
  // We can use either state+billNumber OR billId, but prefer state+billNumber when available
  if (!billId && !(state && billNumber)) {
    console.warn("BillTextFetcher: Missing both billId and state+billNumber combination");
    return null;
  }
  
  // Log which method we're using to fetch
  console.log(`BillTextFetcher rendering with ${billNumber ? `state: ${state}, billNumber: ${billNumber}` : `billId: ${billId}`}`);
  
  const {
    isLoading,
    textContent,
    error,
    isPdfContent,
    pdfBase64,
    isHtmlContent,
    extractedText,
    loadFromCache,
    fetchText,
    onTextExtracted
  } = useBillTextFetch({
    billId,
    state,
    billNumber,
    autoFetch,
    initialErrorMessage
  });

  return children({
    isLoading,
    textContent,
    error,
    isPdfContent,
    pdfBase64,
    isHtmlContent,
    extractedText,
    onTextExtracted,
    retryFetchText: fetchText,
    loadFromCache
  });
};

export default BillTextFetcher;
