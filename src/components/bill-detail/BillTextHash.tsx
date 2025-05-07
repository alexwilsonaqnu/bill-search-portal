
import BillTextFetcher from "./text/BillTextFetcher";
import BillTextDisplay from "./text/BillTextDisplay";

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
  autoFetch = true, // Changed default to true to automatically fetch text
  errorMessage: initialErrorMessage 
}: BillTextHashProps) => {
  if (!billId) return null;

  return (
    <BillTextFetcher
      billId={billId}
      autoFetch={autoFetch}
      initialErrorMessage={initialErrorMessage}
    >
      {({
        isLoading,
        textContent,
        error,
        isPdfContent,
        pdfBase64,
        isHtmlContent,
        extractedText,
        onTextExtracted,
        retryFetchText,
        loadFromCache
      }) => (
        <BillTextDisplay
          isLoading={isLoading}
          textContent={textContent}
          error={error}
          isPdfContent={isPdfContent}
          pdfBase64={pdfBase64}
          isHtmlContent={isHtmlContent}
          extractedText={extractedText}
          externalUrl={externalUrl}
          onTextExtracted={onTextExtracted}
          retryFetchText={retryFetchText}
          loadFromCache={loadFromCache}
        />
      )}
    </BillTextFetcher>
  );
};

export default BillTextHash;
