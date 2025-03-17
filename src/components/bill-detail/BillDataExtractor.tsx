
import { Bill } from "@/types";

interface BillDataExtractorProps {
  bill: Bill;
}

const BillDataExtractor = ({ bill }: BillDataExtractorProps) => {
  // Function to extract the ILGA URL if present in the bill data
  const getIlgaUrl = () => {
    // Check for nested bill data structure
    const billData = bill.data?.bill || bill.data;
    
    if (billData?.texts?.[0]?.state_link) {
      return billData.texts[0].state_link;
    }
    if (billData?.text_url) {
      return billData.text_url;
    }
    // Look for a URL pattern in any field
    const billString = JSON.stringify(billData);
    const urlMatch = billString.match(/https?:\/\/www\.ilga\.gov\/legislation\/\S+\.htm/);
    return urlMatch ? urlMatch[0] : null;
  };
  
  // Check if bill has text content - look in multiple possible locations
  const getTextContent = () => {
    // Check for nested bill data structure
    const billData = bill.data?.bill || bill.data;
    
    // Direct text_content field
    if (billData?.text_content) return billData.text_content;
    
    // Check in texts array
    if (billData?.texts && Array.isArray(billData.texts)) {
      const textWithContent = billData.texts.find(t => t.content);
      if (textWithContent) return textWithContent.content;
    }
    
    // Check in text field
    if (billData?.text) return billData.text;
    
    // Check in full_text field
    if (billData?.full_text) return billData.full_text;
    
    return null;
  };
  
  // Determine text format (html or plain text)
  const getTextFormat = () => {
    // Check for nested bill data structure
    const billData = bill.data?.bill || bill.data;
    
    if (billData?.text_format) return billData.text_format;
    
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
  const billData = bill.data?.bill || bill.data;
  const textHash = billData?.text_hash || "";
  
  // Get the Legiscan Bill ID if available
  // First check in nested bill structure, then in direct fields
  const legiscanBillId = 
    billData?.bill_id || 
    billData?.doc_id || 
    bill.data?.bill?.bill_id || 
    bill.id;
  
  console.log("Extracted Legiscan Bill ID:", legiscanBillId, "from bill with ID:", bill.id);
  
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
