
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import TextContentDisplay from "./text/TextContentDisplay";

interface BillTextContentProps {
  bill: Bill;
  externalUrl?: string | null;
}

const BillTextContent = ({ bill, externalUrl }: BillTextContentProps) => {
  // Extract text content from the bill
  const textContent = bill.text || 
    (bill.versions && bill.versions.length > 0 ? 
      bill.versions[0].sections[0].content : "");
  
  // Determine if content is HTML
  const isHtml = textContent.includes('<html') || 
                 textContent.includes('<table') || 
                 textContent.includes('<meta') || 
                 textContent.includes('<style') || 
                 textContent.includes('<body');
  
  return (
    <div className="prose max-w-none">
      <TextContentDisplay 
        content={textContent}
        isHtml={isHtml}
      />
    </div>
  );
};

export default BillTextContent;
