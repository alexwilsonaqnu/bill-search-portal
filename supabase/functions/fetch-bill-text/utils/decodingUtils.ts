
/**
 * Utilities for decoding and processing content from the LegiScan API
 */

/**
 * Decode base64 text content
 * This is a more robust implementation that handles various edge cases
 */
export function decodeBase64Text(base64Content: string) {
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
export function isPdfContent(content: string): boolean {
  if (!content) return false;
  
  // Check for PDF file signature
  return content.startsWith('%PDF-') || 
         // Check for binary PDF data
         (content.length > 5 && (content.charCodeAt(0) === 37 && content.charCodeAt(1) === 80));
}
