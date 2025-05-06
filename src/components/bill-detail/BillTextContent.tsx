
import { Bill } from "@/types";
import { Card } from "@/components/ui/card";
import TextContentDisplay from "./text/TextContentDisplay";

interface BillTextContentProps {
  bill: Bill;
  externalUrl?: string | null;
  additionalText?: string | null;
}

const BillTextContent = ({ bill, externalUrl, additionalText }: BillTextContentProps) => {
  // Extract text content from all possible sources
  const getTextContent = () => {
    // First priority: additionalText parameter if provided
    if (additionalText && additionalText.trim().length > 0) {
      return additionalText;
    }
    
    // Second priority: bill.text
    if (bill.text && bill.text.trim().length > 0) {
      return bill.text;
    }
    
    // Third priority: bill.versions
    if (bill.versions && bill.versions.length > 0 && 
        bill.versions[0].sections && bill.versions[0].sections.length > 0) {
      return bill.versions[0].sections[0].content;
    }
    
    // Fourth priority: nested data
    const billData = bill.data?.bill || bill.data || {};
    if (billData.text_content) {
      return billData.text_content;
    }
    
    // Final fallback: empty string
    return "";
  };
  
  const textContent = getTextContent();
  
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
