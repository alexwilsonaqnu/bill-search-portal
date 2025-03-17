
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
  
  // Find the correct Legiscan Bill ID and Document ID
  const getBillIdentifiers = () => {
    // Check for nested data structure
    const data = bill.data?.bill || bill.data || {};
    
    // First try to get the bill_id
    const billId = data.bill_id ? data.bill_id.toString() : bill.id;
    
    // Get document ID from texts array if available
    let docId = null;
    if (data.texts && Array.isArray(data.texts) && data.texts.length > 0) {
      docId = data.texts[0].doc_id;
      console.log(`Found document ID in texts array: ${docId}`);
    }
    
    // Extract other important bill identifiers
    const stateId = data.state_id || data.state;
    const sessionId = data.session_id || data.session;
    
    return {
      legiscanBillId: billId,
      documentId: docId,
      stateId,
      sessionId
    };
  };
  
  const { legiscanBillId, documentId, stateId, sessionId } = getBillIdentifiers();
  
  console.log("Extracted data:", {
    billId: bill.id,
    legiscanBillId,
    documentId,
    stateId,
    sessionId,
    textHash,
    hasTextContent: !!getTextContent(),
    rawData: JSON.stringify(bill.data).slice(0, 200) + "..." // Log a snippet of raw data for debugging
  });
  
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
    legiscanBillId,
    documentId 
  };
};

export default BillDataExtractor;
