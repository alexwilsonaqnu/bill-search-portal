
import { useState } from "react";
import BillTextHeader from "../BillTextHeader";
import BillTextLoading from "../BillTextLoading";
import BillTextError from "../BillTextError";
import PdfContentDisplay from "../pdf/PdfContentDisplay";
import TextContentDisplay from "./TextContentDisplay";
import FullScreenDialog from "../FullScreenDialog";
import ChatToggle from "../ChatToggle";
import BillChat from "../BillChat";

interface BillTextDisplayProps {
  isLoading: boolean;
  textContent: string | null;
  error: string | null;
  isPdfContent: boolean;
  pdfBase64: string | null;
  isHtmlContent: boolean;
  extractedText: string | null;
  externalUrl?: string | null;
  onTextExtracted: (text: string) => void;
  retryFetchText: () => void;
  loadFromCache: boolean;
}

const BillTextDisplay = ({
  isLoading,
  textContent,
  error,
  isPdfContent,
  pdfBase64,
  isHtmlContent,
  extractedText,
  externalUrl,
  onTextExtracted,
  retryFetchText,
  loadFromCache
}: BillTextDisplayProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
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
        <BillTextLoading isLoading={isLoading} onFetchText={retryFetchText} />
      )}
      
      <BillTextError error={error} onRetry={retryFetchText} />
      
      {!textContent && !isLoading && !error && (
        <BillTextLoading isLoading={isLoading} onFetchText={retryFetchText} />
      )}
      
      {isPdfContent && (
        <PdfContentDisplay 
          pdfBase64={pdfBase64} 
          textContent={textContent}
          externalUrl={externalUrl}
          extractedText={extractedText}
          onTextExtracted={onTextExtracted}
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
        onTextExtracted={onTextExtracted}
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

export default BillTextDisplay;
