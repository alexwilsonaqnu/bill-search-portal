
import { useState } from "react";
import { Bill } from "@/types";
import TextContentDisplay from "./text/TextContentDisplay";
import FullScreenDialog from "./FullScreenDialog";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";
import BillTextFetcher from "./text/BillTextFetcher";
import BillTextDisplay from "./text/BillTextDisplay";

interface BillTextContentProps {
  bill: Bill;
  externalUrl?: string | null;
  errorMessage?: string | null;
}

const BillTextContent = ({ bill, externalUrl, errorMessage }: BillTextContentProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Extract text content from the bill
  const textContent = bill.text || 
    (bill.versions && bill.versions.length > 0 ? 
      bill.versions[0].sections[0].content : "");
  
  // Determine if content is HTML
  const isHtml = textContent?.includes('<html') || 
                 textContent?.includes('<table') || 
                 textContent?.includes('<meta') || 
                 textContent?.includes('<style') || 
                 textContent?.includes('<body');
  
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  console.log(`BillTextContent rendering for bill ${bill.id}, has text: ${!!textContent}`);

  // If the bill has an ID but no text content, use BillTextFetcher to load it
  if (bill.id && !textContent) {
    console.log(`No text content found for bill ${bill.id}, using BillTextFetcher`);
    return (
      <BillTextFetcher
        billId={bill.id}
        autoFetch={true}
        initialErrorMessage={errorMessage}
      >
        {props => (
          <BillTextDisplay {...props} externalUrl={externalUrl} />
        )}
      </BillTextFetcher>
    );
  }
  
  return (
    <div className="prose max-w-none">
      <div className="flex justify-between items-center mb-2">
        <div>{bill.id ? `Bill ID: ${bill.id}` : ''}</div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleFullScreen}
          className="flex items-center gap-1"
        >
          <Maximize className="h-4 w-4" /> Full Screen
        </Button>
      </div>
      
      {errorMessage && (
        <div className="mb-4 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      
      <TextContentDisplay 
        content={textContent || ''}
        isHtml={!!isHtml}
      />
      
      <FullScreenDialog 
        isOpen={isFullScreen}
        onClose={toggleFullScreen}
        title="Bill Text"
        isPdfContent={false}
        pdfBase64={null}
        textContent={textContent}
        extractedText={null}
        isHtmlContent={!!isHtml}
        externalUrl={externalUrl}
      />
    </div>
  );
};

export default BillTextContent;
