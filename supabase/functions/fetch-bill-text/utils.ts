
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
 * Check if content seems to be from a different state
 */
export function detectNonIllinoisState(content: string): string | null {
  const lowerContent = content.toLowerCase();
  
  // Map of state names to look for
  const stateIndicators = {
    'new york': 'New York',
    'state of new york': 'New York',
    'california': 'California',
    'texas': 'Texas',
    'florida': 'Florida',
    'pennsylvania': 'Pennsylvania',
    'ohio': 'Ohio',
    'michigan': 'Michigan',
    'georgia': 'Georgia',
    'north carolina': 'North Carolina',
    'new jersey': 'New Jersey'
  };
  
  // Check if any state indicators are in the content
  for (const [indicator, stateName] of Object.entries(stateIndicators)) {
    if (lowerContent.includes(indicator)) {
      return stateName;
    }
  }
  
  return null;
}
