
/**
 * Configuration constants for Supabase storage access
 */

// Main bucket name for bill storage
export const BILL_STORAGE_BUCKET = "103rd_General_Assembly";

// Main folder path for bills within the bucket - only using the 2025-2026 path
export const BILL_STORAGE_PATH = "2025-2026_104th_General_Assembly/bill";

// Maximum number of files to retrieve in one request
export const MAX_FILES_TO_RETRIEVE = 1000;

// Maximum number of bills to process at once
export const MAX_BILLS_TO_PROCESS = 200;
