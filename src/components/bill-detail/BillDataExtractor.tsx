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
    
    console.log('Checking text content sources:', {
      directText: bill.text?.slice(0, 100),
      billData: billData,
      textUrl: billData.text_url,
      texts: billData.texts,
      description: bill.description,
      title: bill.title
    });

    // First check direct text field on bill
    if (bill.text && typeof bill.text === 'string' && bill.text.trim().length > 0) {
      console.log('Found content in direct text field');
      return bill.text;
    }

    // Check for text_content from external source
    if (billData.text_content) {
      console.log('Found content in text_content field');
      return billData.text_content;
    }

    // Check for full_text field
    if (billData.full_text) {
      console.log('Found content in full_text field');
      return billData.full_text;
    }
    
    // Check texts array
    if (billData.texts && Array.isArray(billData.texts)) {
      const textWithContent = billData.texts.find(t => 
        t.content && typeof t.content === 'string' && t.content.trim().length > 0
      );
      if (textWithContent) {
        console.log('Found content in texts array');
        return textWithContent.content;
      }
    }
    
    // Check for text field
    if (billData.text && typeof billData.text === 'string' && billData.text.trim().length > 0) {
      console.log('Found content in billData.text field');
      return billData.text;
    }

    // Check bill versions
    if (bill.versions && bill.versions.length > 0) {
      const latestVersion = bill.versions[bill.versions.length - 1];
      if (latestVersion.sections && latestVersion.sections.length > 0) {
        const combinedContent = latestVersion.sections
          .map(section => section.content)
          .filter(content => content && content.trim().length > 0)
          .join('\n\n');
        if (combinedContent) {
          console.log('Found content in bill versions');
          return combinedContent;
        }
      }
    }

    // If we have a description or title from cache, use that as initial content
    if (bill.description || bill.title) {
      const content = [
        bill.title,
        bill.description
      ].filter(Boolean).join('\n\n');
      console.log('Using cached bill description/title as content');
      return content;
    }

    // If we have a text URL but no content yet, return null to allow external content
    if (billData.text_url) {
      console.log('Found text URL but no content yet');
      return null;
    }
    
    console.log('No text content found in any source');
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
