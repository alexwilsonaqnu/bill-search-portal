
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
  
  // Find the correct Legiscan Bill ID
  // Look for:
  // 1. Deep in nested structure: bill.data.bill.bill_id
  // 2. Directly in bill.data: bill.data.bill_id
  // 3. Check if there's a doc_id in texts array (common for PDF documents)
  // 4. Finally, fall back to the bill.id (which is likely to be a string)
  const getLegiscanBillId = () => {
    if (bill.data?.bill?.bill_id) {
      console.log("Found bill_id in nested structure:", bill.data.bill.bill_id);
      return bill.data.bill.bill_id.toString();
    }
    
    if (billData?.bill_id) {
      console.log("Found bill_id in direct data:", billData.bill_id);
      return billData.bill_id.toString();
    }
    
    if (billData?.texts?.[0]?.doc_id) {
      console.log("Found doc_id in texts array:", billData.texts[0].doc_id);
      return billData.texts[0].doc_id.toString();
    }
    
    // Look for any field that might contain the real bill ID
    for (const key of Object.keys(billData || {})) {
      if (key.includes('id') && typeof billData[key] === 'number') {
        console.log(`Found potential ID in field ${key}:`, billData[key]);
        return billData[key].toString();
      }
    }
    
    console.log("Falling back to bill.id:", bill.id);
    return bill.id.toString();
  };
  
  const legiscanBillId = getLegiscanBillId();
  
  console.log("Extracted data:", {
    billId: bill.id,
    legiscanBillId,
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
    legiscanBillId 
  };
};

export default BillDataExtractor;
