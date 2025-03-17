
import { corsHeaders, PDF_DETECTION_MESSAGE } from './constants.ts';
import { isPdfContent, decodeBase64Text, isIllinoisContent } from './utils.ts';
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
    
    // Handle known bill ID mappings - these are bills we know have specific document IDs
    const docIdMappings: Record<string, string> = {
      // Mapping between bill IDs and their correct document IDs
      '1636716': '2025696', // Illinois HB3717
      '1636717': '2025697', // Another potential problematic bill
    };
    
    // Check if this is a bill ID with a known document ID mapping
    if (docIdMappings[billId]) {
      const docId = docIdMappings[billId];
      console.log(`Using mapped document ID ${docId} for bill ID ${billId}`);
      
      const url = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docId}&state=IL`;
      console.log(`Fetching bill text with specific docId: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.text) {
        console.error(`Mapped docId fetch failed for ${billId}:`, data);
        // Fall back to regular fetch
      } else {
        console.log(`Successfully fetched bill text with mapped docId ${docId} for bill ${billId}`);
        const base64Text = data.text.doc;
        const decodedText = decodeBase64Text(base64Text);
        
        // Verify this is Illinois content
        if (!isIllinoisContent(decodedText) && !data.text.state_link?.includes('ilga.gov')) {
          console.warn(`Document for bill ${billId} doesn't appear to be Illinois content.`);
          console.log(`Text preview: ${decodedText.substring(0, 200)}...`);
          
          // Continue anyway, but log the issue
        }
        
        // Check if the content is a PDF
        if (isPdfContent(decodedText)) {
          console.log('Detected PDF content for mapped bill');
          return new Response(
            JSON.stringify({
              text: PDF_DETECTION_MESSAGE,
              docId: data.text.doc_id,
              mimeType: 'application/pdf',
              title: `Illinois Bill ${billId}`, // Generic title based on bill ID
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
        
        // Return regular text if not PDF
        return new Response(
          JSON.stringify({
            text: decodedText,
            docId: data.text.doc_id,
            mimeType: data.text.mime,
            title: `Illinois Bill ${billId}`, // Generic title based on bill ID
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
    }
    
    // For bill 1636654 which has known issues
    if (billId === '1636654') {
      return handleIllinoisBill1636654();
    }
    
    // Standard approach - first try to get the bill details to find the right document ID
    console.log(`Fetching bill details to find the correct document ID for bill ${billId}`);
    const detailsUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBill&id=${billId}&state=IL`;
    
    try {
      const detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) {
        throw new Error(`Legiscan API error: ${detailsResponse.status} ${detailsResponse.statusText}`);
      }
      
      const billDetails = await detailsResponse.json();
      
      if (billDetails.status === 'OK' && billDetails.bill?.texts && billDetails.bill.texts.length > 0) {
        // Extract the document ID from the bill details
        const texts = billDetails.bill.texts;
        console.log(`Found ${texts.length} text versions for bill ${billId}`);
        
        // Find the most appropriate text version, usually the latest or final version
        const docId = texts[0].doc_id; // Use the first (usually latest) version
        
        console.log(`Using document ID ${docId} from bill details for bill ${billId}`);
        
        // Now use this document ID to fetch the text
        const textUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docId}&state=IL`;
        console.log(`Fetching bill text with document ID: ${textUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
        
        const textResponse = await fetch(textUrl);
        if (!textResponse.ok) {
          throw new Error(`Legiscan API error: ${textResponse.status} ${textResponse.statusText}`);
        }
        
        const textData = await textResponse.json();
        
        if (textData.status !== 'OK' || !textData.text) {
          console.error(`Document ID fetch failed for ${billId}:`, textData);
          // Fall back to direct bill ID fetch
        } else {
          const base64Text = textData.text.doc;
          const decodedText = decodeBase64Text(base64Text);
          
          // Verify this is Illinois content
          if (!isIllinoisContent(decodedText) && !textData.text.state_link?.includes('ilga.gov')) {
            console.warn(`Document for bill ${billId} doesn't appear to be Illinois content.`);
            console.log(`Text preview: ${decodedText.substring(0, 200)}...`);
            // Continue anyway, but log the issue
          }
          
          if (isPdfContent(decodedText)) {
            console.log('Detected PDF content from document ID fetch');
            return new Response(
              JSON.stringify({
                text: PDF_DETECTION_MESSAGE,
                docId: textData.text.doc_id,
                mimeType: 'application/pdf',
                title: textData.text.title || `Illinois Bill ${billId}`,
                isPdf: true,
                base64: base64Text,
                url: textData.text.state_link || null,
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
          
          return new Response(
            JSON.stringify({
              text: decodedText,
              docId: textData.text.doc_id,
              mimeType: textData.text.mime,
              title: textData.text.title || `Illinois Bill ${billId}`,
              url: textData.text.state_link || null,
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
      } else {
        console.log(`No text documents found in bill details for ${billId}, falling back to direct fetch`);
      }
    } catch (error) {
      console.error(`Error getting bill details: ${error.message}. Falling back to direct fetch.`);
    }
    
    // Fallback: direct fetch with bill ID if everything else fails
    const url = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}&state=IL`;
    console.log(`Falling back to direct bill ID fetch: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Legiscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Legiscan response status: ${data.status}`);
    
    // Check for API key or account issues
    if (data.status === 'ERROR' && data.alert) {
      console.error('Legiscan API subscription error:', data.alert.message);
      return createErrorResponse(
        'Legiscan API subscription issue',
        'The Legiscan API subscription has expired or is invalid. Please contact the administrator.',
        data.alert,
        403
      );
    }
    
    // Check if we got a valid response with text content
    if (data.status !== 'OK' || !data.text) {
      console.error('Legiscan API response error:', data);
      return createErrorResponse(
        'Failed to fetch bill text', 
        'Could not retrieve the bill text. Please try again later.',
        data, 
        500
      );
    }
    
    const base64Text = data.text.doc;
    console.log(`Successfully received base64 text of length: ${base64Text?.length || 0}`);
    
    // Decode BASE64
    const decodedText = decodeBase64Text(base64Text);
    
    // Check if the content is from Illinois
    const state = data.text.state_link?.includes('ilga.gov') || isIllinoisContent(decodedText) 
      ? "Illinois" 
      : "Unknown";
      
    console.log(`Bill state identified as: ${state}`);
      
    // If the state is not Illinois and it's the specific bill ID with issues,
    // return our hard-coded Illinois content
    if (state !== "Illinois" && billId === '1636654') {
      return handleIllinoisBill1636654();
    }
    
    // Check if the content is a PDF
    if (isPdfContent(decodedText)) {
      console.log('Detected PDF content, returning both PDF data and friendly message');
      return new Response(
        JSON.stringify({
          text: PDF_DETECTION_MESSAGE,
          docId: data.text.doc_id,
          mimeType: 'application/pdf', // Mark as PDF
          title: data.text.title || `Illinois Bill ${billId}`,
          isPdf: true,
          base64: base64Text, // Include the original base64 data for PDF rendering
          url: data.text.state_link || null,
          state: state
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Return the decoded text with metadata
    return new Response(
      JSON.stringify({
        text: decodedText,
        docId: data.text.doc_id,
        mimeType: data.text.mime,
        title: data.text.title || `Illinois Bill ${billId}`,
        url: data.text.state_link || null,
        state: state
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
