
// Utility functions for handling bill text

/**
 * Checks if the content starts with %PDF- which is the marker for PDF files
 */
export function isPdfContent(content: string): boolean {
  return content.trim().startsWith('%PDF-');
}

/**
 * Decodes base64 text to a string
 */
export function decodeBase64Text(base64Text: string): string {
  try {
    // Step 1: Base64 decode
    const binaryText = atob(base64Text);
    
    // Step 2: Convert binary string to string
    return binaryText;
  } catch (error) {
    console.error('Error decoding base64 text:', error);
    return 'Error: Failed to decode text content';
  }
}

/**
 * Checks if content appears to be from Illinois
 * Improved to be more robust in identifying relevant content
 */
export function isIllinoisContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Key phrases that would indicate Illinois content
  const illinoisIndicators = [
    'illinois',
    'ilga.gov',
    'general assembly',
    'state of illinois',
    'il house',
    'il senate',
    'illinois house',
    'illinois senate'
  ];
  
  // Check if any of the Illinois indicators are in the content
  return illinoisIndicators.some(indicator => lowerContent.includes(indicator));
}

/**
 * Determines if content is from a specific state
 * Returns the state name if detected, null otherwise
 */
export function detectStateFromContent(content: string): string | null {
  const lowerContent = content.toLowerCase();
  
  // Map of state identifiers to state names
  const stateMap: Record<string, string> = {
    'illinois': 'Illinois',
    'state of illinois': 'Illinois',
    'new york': 'New York',
    'state of new york': 'New York',
    'california': 'California',
    'state of california': 'California',
    'texas': 'Texas',
    'state of texas': 'Texas',
    'florida': 'Florida',
    'state of florida': 'Florida',
    'pennsylvania': 'Pennsylvania',
    'state of pennsylvania': 'Pennsylvania',
    'ohio': 'Ohio',
    'state of ohio': 'Ohio',
    'michigan': 'Michigan',
    'state of michigan': 'Michigan'
  };
  
  // Look for state identifiers in the content
  for (const [identifier, stateName] of Object.entries(stateMap)) {
    if (lowerContent.includes(identifier)) {
      return stateName;
    }
  }
  
  return null;
}

/**
 * Extract bill number from content for verification
 */
export function extractBillNumber(content: string): string | null {
  // Look for patterns like "HB123", "SB456", etc.
  const billPatterns = [
    /\b(HB\s*\d+)/i,
    /\b(SB\s*\d+)/i,
    /\b(House\s*Bill\s*\d+)/i,
    /\b(Senate\s*Bill\s*\d+)/i,
    /\b(Bill\s*\d+)/i
  ];
  
  for (const pattern of billPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/\s+/g, ''); // Remove spaces
    }
  }
  
  return null;
}
