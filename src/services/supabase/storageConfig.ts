
/**
 * Configuration constants for Supabase storage access
 */

// Possible bucket names to try when fetching bills
export const POSSIBLE_BUCKETS = [
  "103rd_General_Assembly",
  "2023-2024_103rd_General_Assembly", // Keep as fallback
  "bill_storage",
  "bills"
];

// Possible folder paths to try within buckets
export const POSSIBLE_FOLDERS = [
  "bill",  // original path
  "bills", 
  "",      // root level
];
