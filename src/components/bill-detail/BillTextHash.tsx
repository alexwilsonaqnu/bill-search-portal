
import BillTextFetcher from "./text/BillTextFetcher";
import BillTextDisplay from "./text/BillTextDisplay";

interface BillTextHashProps {
  textHash: string;
  billId: string;
  state?: string;
  billNumber?: string;
  externalUrl?: string | null;
  autoFetch?: boolean;
  errorMessage?: string | null;
}

const BillTextHash = ({ 
  textHash, 
  billId, 
  state = 'IL',
  billNumber,
  externalUrl, 
  autoFetch = true,
  errorMessage: initialErrorMessage 
}: BillTextHashProps) => {
  if (!billId && !(state && billNumber)) return null;

  console.log(`BillTextHash rendering with ${billNumber ? `state: ${state}, billNumber: ${billNumber}` : `billId: ${billId}`}`);

  return (
    <BillTextFetcher
      billId={billId}
      state={state}
      billNumber={billNumber}
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
