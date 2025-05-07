
/**
 * Utility functions for bill text caching operations
 */

// Generate a consistent cache key based on available identifiers
export function generateCacheKey(billId?: string, state: string = 'IL', billNumber?: string): string {
  // Prioritize state+billNumber if available
  return billNumber 
    ? `bill_text_${state}_${billNumber}` 
    : `bill_text_${billId}`;
}

// Check if cached text is valid for the provided identifiers
export function validateCachedText(
  cachedData: any, 
  state: string = 'IL', 
  billId?: string, 
  billNumber?: string
): boolean {
  if (!cachedData) return false;

  // Validate the state in cache matches our expected state
  if (cachedData.state !== state) {
    console.warn(`Cached text has incorrect state: ${cachedData.state}, expected: ${state}`);
    return false;
  }
  
  // Validate ID matches if we're using billId
  if (!billNumber && billId && cachedData.billId && cachedData.billId !== billId) {
    console.warn(`Cached text has mismatched billId: ${cachedData.billId}, expected: ${billId}`);
    return false;
  }
  
  // Validate bill number matches if we're using billNumber
  if (billNumber && cachedData.billNumber && cachedData.billNumber !== billNumber) {
    console.warn(`Cached text has mismatched billNumber: ${cachedData.billNumber}, expected: ${billNumber}`);
    return false;
  }
  
  return true;
}

// Get text from cache
export function getCachedBillText(
  billId?: string, 
  state: string = 'IL', 
  billNumber?: string
): any | null {
  try {
    const cacheKey = generateCacheKey(billId, state, billNumber);
    const cachedText = localStorage.getItem(cacheKey);
    
    if (cachedText) {
      const parsedCache = JSON.parse(cachedText);
      console.log(`Found cached text for ${billNumber ? `${state} bill ${billNumber}` : `bill ID ${billId}`}`);
      
      if (validateCachedText(parsedCache, state, billId, billNumber)) {
        return parsedCache;
      }
    }
  } catch (e) {
    console.warn("Error retrieving bill text from cache:", e);
  }
  return null;
}

// Store text in cache
export function cacheBillText(
  result: any,
  billId?: string,
  state: string = 'IL',
  billNumber?: string
): void {
  try {
    const cacheKey = generateCacheKey(billId, state, billNumber);
    
    localStorage.setItem(cacheKey, JSON.stringify({
      ...result,
      state,
      billId,
      billNumber
    }));
  } catch (storageError) {
    console.warn("Failed to cache text result:", storageError);
  }
}
