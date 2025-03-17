
import { Bill } from "@/types";

interface BillDataExtractorProps {
  bill: Bill;
}

const BillDataExtractor = ({ bill }: BillDataExtractorProps) => {
  // Function to extract the ILGA URL if present in the bill data
  const getIlgaUrl = () => {
    if (bill.data?.texts?.[0]?.state_link) {
      return bill.data.texts[0].state_link;
    }
    if (bill.data?.text_url) {
      return bill.data.text_url;
    }
    // Look for a URL pattern in any field
    const billString = JSON.stringify(bill.data);
    const urlMatch = billString.match(/https?:\/\/www\.ilga\.gov\/legislation\/\S+\.htm/);
    return urlMatch ? urlMatch[0] : null;
  };
  
  // Check if bill has text content - look in multiple possible locations
  const getTextContent = () => {
    // Direct text_content field
    if (bill.data?.text_content) return bill.data.text_content;
    
    // Check in texts array
    if (bill.data?.texts && Array.isArray(bill.data.texts)) {
      const textWithContent = bill.data.texts.find(t => t.content);
      if (textWithContent) return textWithContent.content;
    }
    
    // Check in text field
    if (bill.data?.text) return bill.data.text;
    
    // Check in full_text field
    if (bill.data?.full_text) return bill.data.full_text;
    
    return null;
  };
  
  // Determine text format (html or plain text)
  const getTextFormat = () => {
    if (bill.data?.text_format) return bill.data.text_format;
    
    // Try to auto-detect format
    const billTextContent = getTextContent();
    if (billTextContent && typeof billTextContent === 'string') {
      if (billTextContent.trim().startsWith('<') && billTextContent.includes('</')) {
        return 'html';
      }
    }
    
    return 'text';
  };
  
  // Extract the text hash from bill data
  const textHash = bill.data?.text_hash || "";
  
  // Get the Legiscan Bill ID if available
  const legiscanBillId = bill.data?.bill_id || bill.data?.doc_id || bill.id;
  
  // Extract and return all bill data
  const ilgaUrl = getIlgaUrl();
  const billTextContent = getTextContent();
  const hasTextContent = !!billTextContent;
  const textFormat = getTextFormat();
  
  return { 
    ilgaUrl, 
    billTextContent, 
    hasTextContent, 
    textFormat, 
    textHash, 
    legiscanBillId 
  };
};

export default BillDataExtractor;
