
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { transformStorageBill } from "@/utils/billTransformUtils";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "./storageConfig";

/**
 * Lists all available storage buckets
 */
export async function listAvailableBuckets() {
  try {
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();
      
    if (error) {
      console.error(`Error listing buckets: ${error.message}`);
      return [];
    }
    
    return buckets?.map(b => b.name) || [];
  } catch (error) {
    console.error("Error listing buckets:", error);
    return [];
  }
}

/**
 * Fetches a specific file from a bucket
 */
async function fetchFileFromBucket(bucketName: string, filePath: string) {
  try {
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .download(filePath);
    
    if (error) {
      console.error(`Error downloading file ${filePath}: ${error.message}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error downloading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Lists files in a specific bucket and folder path
 */
async function listFilesInBucket(bucketName: string, folderPath: string) {
  try {
    console.log(`Attempting to list files in ${bucketName}/${folderPath}`);
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`Error listing files in ${bucketName}/${folderPath}: ${error.message}`);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log(`No files found in ${bucketName}/${folderPath}`);
      return [];
    }
    
    console.log(`Found ${data.length} files in ${bucketName}/${folderPath}`);
    return data;
  } catch (error) {
    console.error(`Error listing files in ${bucketName}/${folderPath}:`, error);
    return [];
  }
}

/**
 * Processes a JSON file from storage into a Bill object
 */
async function processStorageFile(bucketName: string, filePath: string, fileName: string): Promise<Bill | null> {
  const fileData = await fetchFileFromBucket(bucketName, filePath);
  
  if (!fileData) {
    return null;
  }
  
  try {
    const text = await fileData.text();
    return transformStorageBill(fileName, text);
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return null;
  }
}

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
 * Helper function to process a batch of bill files
 */
async function processBillFiles(bucketName: string, folderPath: string, jsonFiles: any[]): Promise<Bill[]> {
  const filesToProcess = jsonFiles.slice(0, 50); // Process up to 50 files
  const bills: Bill[] = [];
  
  for (const file of filesToProcess) {
    const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
    console.log(`Processing file: ${filePath} from bucket ${bucketName}`);
    
    const bill = await processStorageFile(bucketName, filePath, file.name);
    if (bill) {
      bills.push(bill);
    }
  }
  
  console.log(`Successfully processed ${bills.length} bills from "${bucketName}/${folderPath}"`);
  return bills;
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
