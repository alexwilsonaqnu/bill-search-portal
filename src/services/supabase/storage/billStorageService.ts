
import { Bill } from "@/types";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "../storageConfig";
import { listFilesInBucket } from "./bucketOperations";
import { processBillFiles, processStorageFile } from "./billProcessor";

/**
 * Fetches all bill files from storage
 */
export async function fetchBillsFromStorage(): Promise<Bill[]> {
  console.log(`Trying to fetch bills from bucket: ${BILL_STORAGE_BUCKET}`);
  
  // First try the main configured path
  const mainPathFiles = await listFilesInBucket(BILL_STORAGE_BUCKET, BILL_STORAGE_PATH);
  if (mainPathFiles.length > 0) {
    console.log(`Found ${mainPathFiles.length} files in main path: ${BILL_STORAGE_PATH}`);
    
    // Process the JSON files
    const jsonFiles = mainPathFiles.filter(file => file.name.endsWith('.json'));
    if (jsonFiles.length > 0) {
      return processBillFiles(BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, jsonFiles);
    }
  }
  
  // If no files found in main path, try alternative paths
  console.log("No JSON files found in main path, trying alternative paths...");
  for (const alternatePath of ALTERNATIVE_PATHS) {
    const files = await listFilesInBucket(BILL_STORAGE_BUCKET, alternatePath);
    if (files.length > 0) {
      const jsonFiles = files.filter(file => file.name.endsWith('.json'));
      if (jsonFiles.length > 0) {
        console.log(`Found ${jsonFiles.length} JSON files in alternative path: ${alternatePath}`);
        return processBillFiles(BILL_STORAGE_BUCKET, alternatePath, jsonFiles);
      }
    }
  }
  
  console.log("No bills could be processed from any storage path");
  return [];
}

/**
 * Fetches a specific bill by ID from storage
 */
export async function fetchBillByIdFromStorage(id: string): Promise<Bill | null> {
  // Try different possible file extensions/formats
  const possibleFileNames = [
    `${id}.json`,
    `${id.toUpperCase()}.json`,
    `${id.toLowerCase()}.json`
  ];
  
  // First try the main path
  for (const fileName of possibleFileNames) {
    const filePath = `${BILL_STORAGE_PATH}/${fileName}`;
    const bill = await processStorageFile(BILL_STORAGE_BUCKET, filePath, fileName);
    if (bill) {
      console.log(`Found bill ${id} in storage at ${filePath}`);
      return bill;
    }
  }
  
  // If not found in the main path, try alternative paths
  for (const alternatePath of ALTERNATIVE_PATHS) {
    for (const fileName of possibleFileNames) {
      const filePath = alternatePath ? `${alternatePath}/${fileName}` : fileName;
      const bill = await processStorageFile(BILL_STORAGE_BUCKET, filePath, fileName);
      if (bill) {
        console.log(`Found bill ${id} in storage at ${filePath}`);
        return bill;
      }
    }
  }
  
  console.warn(`Bill ${id} not found in any storage path`);
  return null;
}
