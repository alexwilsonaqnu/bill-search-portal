
// Main bucket name for bill storage
export const BILL_STORAGE_BUCKET = "103rd_General_Assembly";

// Main folder path for bills within the bucket
export const BILL_STORAGE_PATH = "2025-2026_104th_General_Assembly/bill";

// Alternative paths to try if the main path doesn't work
export const ALTERNATIVE_PATHS = [
  "2025-2026_104th_General_Assembly/bills",
  "bills",
  "bill",
  "2025-2026_104th_General_Assembly", // Try the entire directory
  "2023-2024_103rd_General_Assembly/bill", // Try older bill folder
  "2023-2024_103rd_General_Assembly", // Try older assembly directory
  ""  // Try root of bucket as last resort
];

// Maximum number of files to retrieve in one request
export const MAX_FILES_TO_RETRIEVE = 1000;

// Maximum number of bills to process at once
export const MAX_BILLS_TO_PROCESS = 200; // Increased from 100
