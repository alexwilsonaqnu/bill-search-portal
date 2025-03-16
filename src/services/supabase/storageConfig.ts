
/**
 * Configuration constants for Supabase storage access
 */

// Possible bucket names to try when fetching bills
export const POSSIBLE_BUCKETS = [
  "103rd_General_Assembly", // Primary bucket name
  "2023-2024_103rd_General_Assembly", // Alternate bucket name
  "bill_storage",
  "bills"
];

// Possible folder paths to try within buckets
export const POSSIBLE_FOLDERS = [
  "2023-2024_103rd_General_Assembly/bill", // Primary path based on user feedback
  "bill",
  "bills", 
  "",      // root level
];

