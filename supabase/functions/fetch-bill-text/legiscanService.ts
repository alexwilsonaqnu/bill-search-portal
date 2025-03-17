
import { corsHeaders, PDF_DETECTION_MESSAGE } from './constants.ts';
import { isPdfContent, decodeBase64Text, isIllinoisContent, detectStateFromContent, extractBillNumber } from './utils.ts';
import { createErrorResponse, handleIllinoisBill1636654 } from './billHandlers.ts';

// Format the response for bill text
export async function fetchFromLegiscan(billId: string, apiKey: string): Promise<Response> {
  if (!apiKey) {
    console.error('Legiscan API key is not configured');
    return createErrorResponse(
      'Legiscan API key is not configured',
      'The Legiscan API key is missing. Please contact the administrator.',
      null,
      500
    );
  }
  
  try {
    console.log(`Attempting to fetch bill text for ID: ${billId}`);
    
    // 1) Try using known docId mappings for problematic bills
    const docIdMappings: Record<string, string> = {
      '1636716': '2635022', // Updated with correct docId
      '1636717': '2025697' 
    };
    
    // If we have a known mapping for this bill ID, use it directly
    if (docIdMappings[billId]) {
      const docId = docIdMappings[billId];
      console.log(`Using mapped document ID ${docId} for bill ID ${billId}`);
      
      try {
        const url = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docId}&state=IL`;
        console.log(`Fetching bill text with specific docId: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK' || !data.text) {
          console.error(`Mapped docId fetch failed for ${billId}:`, data);
          // Will continue to fallback logic below
        } else {
          console.log(`Successfully fetched bill text with mapped docId ${docId} for bill ${billId}`);
          
          const base64Text = data.text.doc;
          const decodedText = decodeBase64Text(base64Text);
          
          // Verify state content for additional debugging
          const detectedState = detectStateFromContent(decodedText);
          console.log(`Content appears to be from: ${detectedState || 'Unknown state'}`);
          
          // If from Illinois or contains ILGA link, return the content
          if (isIllinoisContent(decodedText) || data.text.state_link?.includes('ilga.gov')) {
            // PDF handling
            if (isPdfContent(decodedText)) {
              return new Response(
                JSON.stringify({
                  text: PDF_DETECTION_MESSAGE,
                  docId: data.text.doc_id,
                  mimeType: 'application/pdf',
                  title: data.text.title || `Illinois Bill ${billId}`,
                  isPdf: true,
                  base64: base64Text,
                  url: data.text.state_link || null,
                  state: "Illinois"
                }),
                { 
                  headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders 
                  } 
                }
              );
            }
            
            // Return regular text
            return new Response(
              JSON.stringify({
                text: decodedText,
                docId: data.text.doc_id,
                mimeType: data.text.mime,
                title: data.text.title || `Illinois Bill ${billId}`,
                url: data.text.state_link || null,
                state: "Illinois"
              }),
              { 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders 
                } 
              }
            );
          } else {
            console.warn(`Content for bill ${billId} with docId ${docId} is not from Illinois.`);
            // Will continue to fallback logic below
          }
        }
      } catch (error) {
        console.error(`Error using mapped docId for ${billId}:`, error);
        // Will continue to fallback logic below
      }
    }
    
    // 2) Fallback logic - Fetch bill details first, then get document IDs
    console.log(`No matching docId or mapping failed for bill ID ${billId}. Proceeding with two-step approach...`);
    
    // 2a) First fetch the bill details to get document information
    console.log(`Fetching bill details for bill ID ${billId}`);
    const getBillUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBill&id=${billId}&state=IL`;
    
    const billResponse = await fetch(getBillUrl);
    if (!billResponse.ok) {
      throw new Error(`Failed to fetch bill data: ${billResponse.status} ${billResponse.statusText}`);
    }
    
    const billData = await billResponse.json();
    if (billData.status !== 'OK' || !billData.bill) {
      throw new Error(`LegiScan returned an error: ${JSON.stringify(billData)}`);
    }
    
    console.log(`Successfully retrieved bill details for ${billId}`);
    
    // 2b) Extract document ID from the bill data
    // First try to get from .documents array if available
    let docId = null;
    let docType = null;
    
    if (billData.bill.documents && billData.bill.documents.length > 0) {
      console.log(`Found ${billData.bill.documents.length} documents in bill data`);
      
      // Try to find the introduced version or the first available document
      const introduced = billData.bill.documents.find(d => 
        d.type?.toLowerCase().includes('introduced') || 
        d.type_id === 1
      );
      
      if (introduced) {
        docId = introduced.doc_id;
        docType = introduced.type;
        console.log(`Using 'introduced' document with ID ${docId} and type ${docType}`);
      } else {
        // Use first document as fallback
        docId = billData.bill.documents[0].doc_id;
        docType = billData.bill.documents[0].type;
        console.log(`Using first available document with ID ${docId} and type ${docType}`);
      }
    }
    // If no documents array, try texts array
    else if (billData.bill.texts && billData.bill.texts.length > 0) {
      console.log(`Found ${billData.bill.texts.length} texts in bill data`);
      
      // Try to find the introduced version or the first available text
      const introduced = billData.bill.texts.find(t => 
        t.type?.toLowerCase().includes('introduced') || 
        t.type_id === 1
      );
      
      if (introduced) {
        docId = introduced.doc_id;
        docType = introduced.type;
        console.log(`Using 'introduced' text with ID ${docId} and type ${docType}`);
      } else {
        // Use first text as fallback
        docId = billData.bill.texts[0].doc_id;
        docType = billData.bill.texts[0].type;
        console.log(`Using first available text with ID ${docId} and type ${docType}`);
      }
    }
    
    if (!docId) {
      console.error(`Could not find any document or text IDs for bill ${billId}`);
      throw new Error(`No documents found for bill ${billId}`);
    }
    
    // 2c) Fetch the actual text document using the doc_id
    console.log(`Fetching bill text using document ID ${docId}`);
    const getBillTextUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docId}`;
    
    const textResponse = await fetch(getBillTextUrl);
    if (!textResponse.ok) {
      throw new Error(`Failed to fetch bill text: ${textResponse.status} ${textResponse.statusText}`);
    }
    
    const textData = await textResponse.json();
    if (textData.status !== 'OK' || !textData.text) {
      throw new Error(`LegiScan text fetch returned an error: ${JSON.stringify(textData)}`);
    }
    
    console.log(`Successfully retrieved text document ${docId} for bill ${billId}`);
    
    // 2d) Process the text content
    const base64Text = textData.text.doc;
    const decodedText = decodeBase64Text(base64Text);
    
    // Identify state and potential bill number for validation
    const detectedState = detectStateFromContent(decodedText);
    const extractedBillNumber = extractBillNumber(decodedText);
    
    console.log(`Content analysis: State=${detectedState || 'Unknown'}, Bill Number=${extractedBillNumber || 'Unknown'}`);
    
    // If this is the specific bill ID that previously had issues, make sure we're getting Illinois content
    if (billId === '1636716' && !isIllinoisContent(decodedText)) {
      console.warn(`Bill 1636716 still retrieving non-Illinois content. Detected state: ${detectedState}`);
      
      // Add this document ID to our "do not use" list for future reference
      console.log(`Document ID ${docId} for bill 1636716 retrieves content from wrong state (${detectedState})`);
      
      // Consider a hardcoded response for this specific bill
      // For now, we'll let the content through but with a clear warning
    }
    
    // Prepare the response based on content type
    if (isPdfContent(decodedText)) {
      console.log(`Bill ${billId} document ${docId} is PDF content`);
      return new Response(
        JSON.stringify({
          text: PDF_DETECTION_MESSAGE,
          docId: textData.text.doc_id,
          mimeType: 'application/pdf',
          title: textData.text.title || billData.bill.title || `Illinois Bill ${billId}`,
          isPdf: true,
          base64: base64Text,
          url: textData.text.state_link || null,
          state: detectedState || "Unknown"
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Return regular text
    return new Response(
      JSON.stringify({
        text: decodedText,
        docId: textData.text.doc_id,
        mimeType: textData.text.mime,
        title: textData.text.title || billData.bill.title || `Illinois Bill ${billId}`,
        url: textData.text.state_link || null,
        state: detectedState || "Unknown"
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error fetching from Legiscan:', error);
    return createErrorResponse(
      error.message || 'Unknown error occurred when fetching from Legiscan',
      'Failed to fetch the bill text. Please try again later.'
    );
  }
}
