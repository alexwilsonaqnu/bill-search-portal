
import { corsHeaders } from "./constants.ts";
import { createErrorResponse } from "./billHandlers.ts";

/**
 * Fetches bill text from LegiScan API
 * Includes improved error handling, response processing, and state detection
 */
export async function fetchFromLegiscan(billId: string, apiKey: string) {
  try {
    console.log(`Fetching document content from LegiScan API for bill ${billId}`);
    
    // Construct the LegiScan API request URL for the "getBillText" operation
    const requestUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${billId}`;
    
    // Make API request with retry logic
    const data = await fetchWithRetry(requestUrl);
    
    // Handle API errors
    if (data.status !== 'OK' || !data.text) {
      console.error('LegiScan API returned an error:', data);
      return createErrorResponse(
        data.alert?.message || 'LegiScan API error',
        'The requested bill text could not be retrieved. It may not exist or require special access.',
        data
      );
    }
    
    // Extract text data
    const { text } = data;
    const docId = text.doc_id;
    const base64Content = text.doc;
    
    // Process the content based on mime type
    const mimeType = text.mime || 'text/html';
    const isPdf = mimeType === 'application/pdf' || text.mime_id === 2;
    
    if (!base64Content) {
      return createErrorResponse(
        'No content available',
        'The bill text content is not available from LegiScan.',
        { billId, docId }
      );
    }
    
    // Decode and process the content
    let decodedContent;
    try {
      decodedContent = decodeBase64Text(base64Content);
    } catch (error) {
      console.error('Error decoding base64 content:', error);
      return createErrorResponse(
        'Content decoding error',
        'The bill text could not be decoded properly.',
        { billId, docId }
      );
    }
    
    // Get state information from the bill data
    const stateInfo = text.state || detectStateFromContent(decodedContent);
    const stateCode = text.state_id ? getStateCodeById(text.state_id) : null;
    
    // Check if content is PDF
    const contentIsPdf = isPdf || isPdfContent(decodedContent);
    const isIllinois = stateCode === 'IL' || stateInfo === 'IL' || 
                      (decodedContent && isIllinoisContent(decodedContent));
    
    // Special handling for Illinois content
    if (isIllinois && !contentIsPdf) {
      // Add Illinois-specific styling for better display
      decodedContent = enhanceIllinoisBillText(decodedContent);
    }
    
    // Return the processed response
    return new Response(
      JSON.stringify({
        text: contentIsPdf ? null : decodedContent,
        base64: contentIsPdf ? base64Content : null,
        isPdf: contentIsPdf,
        docId,
        mimeType,
        state: stateCode || stateInfo,
        title: text.title || `Bill ${billId}`,
        url: text.state_link || null
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error in fetchFromLegiscan:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch from LegiScan',
      'An unexpected error occurred while fetching the bill text.',
      { billId }
    );
  }
}

/**
 * Helper function to fetch from LegiScan with retry logic
 */
async function fetchWithRetry(url: string, retries = 2, backoff = 1500) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // If not first attempt, wait with exponential backoff
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${retries} after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential backoff
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds
      
      const response = await fetch(url);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`LegiScan API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry aborted requests (timeouts)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 15 seconds');
      }
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Otherwise continue to next retry attempt
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError;
}

/**
 * Decode base64 text content
 * This is a more robust implementation that handles various edge cases
 */
function decodeBase64Text(base64Content: string) {
  // First, handle URL-safe base64
  const normalizedBase64 = base64Content.replace(/-/g, '+').replace(/_/g, '/');
  
  try {
    // Try standard atob first
    return atob(normalizedBase64);
  } catch (e) {
    console.error("Error decoding with atob:", e);
    
    // Try the Deno.decode approach as a fallback
    try {
      const binaryString = atob(normalizedBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch (denoError) {
      console.error("Error with Deno text decoding:", denoError);
      throw new Error("Failed to decode base64 content");
    }
  }
}

/**
 * Detect if content is in PDF format based on signature
 */
function isPdfContent(content: string): boolean {
  if (!content) return false;
  
  // Check for PDF file signature
  return content.startsWith('%PDF-') || 
         // Check for binary PDF data
         (content.length > 5 && (content.charCodeAt(0) === 37 && content.charCodeAt(1) === 80));
}

/**
 * Detect the state from content
 */
function detectStateFromContent(content: string): string | null {
  if (!content) return null;
  
  // Look for state identifiers in the content
  if (/illinois|ilga\.gov/i.test(content)) return 'IL';
  if (/texas|capitol\.texas\.gov/i.test(content)) return 'TX';
  if (/california|leginfo\.legislature\.ca\.gov/i.test(content)) return 'CA';
  if (/new york|nysenate\.gov/i.test(content)) return 'NY';
  if (/florida|flsenate\.gov/i.test(content)) return 'FL';
  
  return null;
}

/**
 * Check if content appears to be from Illinois
 */
function isIllinoisContent(content: string): boolean {
  if (!content) return false;
  
  return /illinois|ilga\.gov|general assembly|il house|il senate/i.test(content);
}

/**
 * Get state code by state ID
 */
function getStateCodeById(stateId: number): string | null {
  const stateMap: Record<number, string> = {
    1: 'AL', 2: 'AK', 3: 'AZ', 4: 'AR', 5: 'CA',
    6: 'CO', 7: 'CT', 8: 'DE', 9: 'FL', 10: 'GA',
    11: 'HI', 12: 'ID', 13: 'IL', 14: 'IN', 15: 'IA',
    16: 'KS', 17: 'KY', 18: 'LA', 19: 'ME', 20: 'MD',
    21: 'MA', 22: 'MI', 23: 'MN', 24: 'MS', 25: 'MO',
    26: 'MT', 27: 'NE', 28: 'NV', 29: 'NH', 30: 'NJ',
    31: 'NM', 32: 'NY', 33: 'NC', 34: 'ND', 35: 'OH',
    36: 'OK', 37: 'OR', 38: 'PA', 39: 'RI', 40: 'SC',
    41: 'SD', 42: 'TN', 43: 'TX', 44: 'UT', 45: 'VT',
    46: 'VA', 47: 'WA', 48: 'WV', 49: 'WI', 50: 'WY',
    51: 'DC', 52: 'PR', 53: 'VI', 54: 'GU', 55: 'MP',
    56: 'AS', 57: 'US'
  };
  
  return stateMap[stateId] || null;
}

/**
 * Enhance Illinois bill text with better formatting
 */
function enhanceIllinoisBillText(content: string): string {
  if (!content) return content;
  
  // For Illinois bills, they often come with minimal HTML
  if (content.includes('ilga.gov') || isIllinoisContent(content)) {
    // If it's plain text without HTML structure, wrap it
    if (!content.includes('<html') && !content.includes('<body')) {
      return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Noto Serif', Georgia, serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 100%;
      overflow-x: auto;
    }
    h1, h2, h3 { color: #333; }
    h1 { font-size: 22px; }
    h2 { font-size: 18px; }
    pre { 
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
    }
    .bill-section {
      margin-bottom: 20px;
      padding-left: 20px;
      border-left: 2px solid #ddd;
    }
    .bill-header {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .amendment { color: #c00; }
    .addition { color: #060; text-decoration: underline; }
    .deletion { color: #900; text-decoration: line-through; }
  </style>
</head>
<body>
  <div class="bill-content">
    ${formatIllinoisBillText(content)}
  </div>
</body>
</html>`;
    } else {
      // If it already has HTML structure, enhance the styling
      return enhanceExistingHtml(content);
    }
  }
  
  return content;
}

/**
 * Format Illinois bill text for better readability
 */
function formatIllinoisBillText(text: string): string {
  // Simple formatting for plain text bills
  const lines = text.split('\n');
  let formattedContent = '';
  let inSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^(Section|SECTION)\s+\d+/)) {
      // New section header
      if (inSection) {
        formattedContent += '</div>\n';
      }
      formattedContent += `<div class="bill-section">\n<h2>${trimmedLine}</h2>\n`;
      inSection = true;
    } else if (trimmedLine.match(/^[A-Z\s]{5,}$/)) {
      // All caps lines are likely headers
      formattedContent += `<h3>${trimmedLine}</h3>\n`;
    } else if (trimmedLine) {
      formattedContent += `<p>${trimmedLine}</p>\n`;
    } else {
      formattedContent += '<br/>\n';
    }
  }
  
  if (inSection) {
    formattedContent += '</div>\n';
  }
  
  return formattedContent;
}

/**
 * Enhance existing HTML with better styling
 */
function enhanceExistingHtml(html: string): string {
  // Add responsive styling to existing HTML
  const styleTag = `
<style>
  body, td, th { 
    font-family: 'Noto Serif', Georgia, serif;
    font-size: 14px;
    line-height: 1.6;
  }
  table { 
    border-collapse: collapse;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    display: block;
    margin-bottom: 20px;
  }
  td, th {
    padding: 8px;
    vertical-align: top;
    border: 1px solid #ddd;
  }
  pre {
    white-space: pre-wrap;
    margin: 0;
  }
  s { color: #900; }
  u { color: #060; }
  center { font-weight: bold; }
  .amendment { color: #c00; }
  .bill-content {
    max-width: 100%;
    overflow-x: auto;
  }
  @media (max-width: 768px) {
    td, th { font-size: 12px; padding: 5px; }
  }
</style>`;
  
  // Insert our style tag
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${styleTag}`);
  } else if (html.includes('<html>')) {
    html = html.replace('<html>', `<html><head>${styleTag}</head>`);
  } else {
    html = `<!DOCTYPE html><html><head>${styleTag}</head><body><div class="bill-content">${html}</div></body></html>`;
  }
  
  return html;
}
