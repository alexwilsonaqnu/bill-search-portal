
/**
 * Configuration constants for Supabase storage access
 */

// Main bucket name for bill storage
export const BILL_STORAGE_BUCKET = "103rd_General_Assembly";

// Main folder path for bills within the bucket
export const BILL_STORAGE_PATH = "2023-2024_103rd_General_Assembly/bill";

// Alternative paths to try if the main path doesn't work
export const ALTERNATIVE_PATHS = [
  "2023-2024_103rd_General_Assembly/bills",
  "bill",
  "bills",
  ""  // Try root of bucket as last resort
];
