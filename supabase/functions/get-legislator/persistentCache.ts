
// Simple key-value cache object
let memoryCache: Record<string, any> = {};
let isCacheInitialized = false;

// Initialize the cache
export async function initializeCache() {
  if (isCacheInitialized) {
    console.log("Cache already initialized");
    return;
  }
  
  try {
    console.log("Initializing legislator cache");
    // You can add logic here to load cache from database if needed
    // For now, we'll just initialize the memory cache
    memoryCache = {};
    isCacheInitialized = true;
    console.log("Cache initialized successfully");
  } catch (error) {
    console.error("Error initializing cache:", error);
    // Initialize with empty cache on error
    memoryCache = {};
    isCacheInitialized = true;
  }
}

// Get a value from the cache
export function getCachedValue(key: string): any {
  return memoryCache[key] || null;
}

// Set a value in the cache
export function setCachedValue(key: string, value: any): void {
  memoryCache[key] = value;
}

// Check if a key exists in the cache
export function cacheHasKey(key: string): boolean {
  return key in memoryCache;
}
