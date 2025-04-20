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
  
  // Updated text content detection to be more comprehensive
  const getTextContent = () => {
    const billData = bill.data?.bill || bill.data || {};
    
    // Prioritize direct text_content and full_text fields
    if (billData.text_content) return billData.text_content;
    if (billData.full_text) return billData.full_text;
    
    // Check texts array more thoroughly
    if (billData.texts && Array.isArray(billData.texts)) {
      const textWithContent = billData.texts.find(t => 
        t.content && t.content.trim().length > 50
      );
      if (textWithContent) return textWithContent.content;
    }
    
    // Check for text field with significant content
    if (billData.text && billData.text.trim().length > 50) {
      return billData.text;
    }
    
    return null;
  };
  
  // Determine text format (html or plain text)
  const getTextFormat = () => {
    const billData = bill.data?.bill || bill.data;
    
    if (billData?.text_format) return billData.text_format;
    
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
    const data = bill.data?.bill || bill.data || {};
    
    const billId = data.bill_id ? data.bill_id.toString() : bill.id;
    
    let docId = null;
    if (data.texts && Array.isArray(data.texts) && data.texts.length > 0) {
      docId = data.texts[0].doc_id;
    }
    
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
