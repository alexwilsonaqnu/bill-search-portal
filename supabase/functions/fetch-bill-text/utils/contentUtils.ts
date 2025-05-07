
/**
 * Utilities for content detection and state identification
 */

/**
 * Checks if content appears to be from Illinois
 */
export function isIllinoisContent(content: string): boolean {
  if (!content) return false;
  
  return /illinois|ilga\.gov|general assembly|il house|il senate/i.test(content);
}

/**
 * Detect the state from content
 */
export function detectStateFromContent(content: string): string | null {
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
 * Get state code by state ID
 */
export function getStateCodeById(stateId: number): string | null {
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
