
import { Bill } from "@/types";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS, MAX_BILLS_TO_PROCESS } from "../storageConfig";
import { listFilesInBucket, countFilesInBucket } from "./bucketOperations";
import { processBillFiles, processStorageFile } from "./billProcessor";
import { toast } from "sonner";

/**
 * Fetches bill files from storage with optional pagination
 */
export async function fetchBillsFromStorage(page = 1, pageSize = MAX_BILLS_TO_PROCESS): Promise<Bill[]> {
  console.log(`Trying to fetch bills from bucket: ${BILL_STORAGE_BUCKET}, page: ${page}, pageSize: ${pageSize}`);
  
  // First try the main configured path
  const totalCount = await countFilesInBucket(BILL_STORAGE_BUCKET, BILL_STORAGE_PATH);
  
  if (totalCount > 0) {
    const offset = (page - 1) * pageSize;
    console.log(`Found ${totalCount} total files in main path: ${BILL_STORAGE_PATH}, fetching page ${page} (offset ${offset})`);
    
    const { data: mainPathFiles, error } = await supabaseListWithPagination(
      BILL_STORAGE_BUCKET, 
      BILL_STORAGE_PATH, 
      pageSize, 
      offset
    );
    
    if (error) {
      console.error(`Error fetching files: ${error.message}`);
      toast.error(`Error loading bills: ${error.message}`);
      return [];
    }
    
    if (mainPathFiles.length > 0) {
      console.log(`Found ${mainPathFiles.length} files in main path for page ${page}`);
      
      // Process the JSON files
      const jsonFiles = mainPathFiles.filter(file => file.name.endsWith('.json'));
      if (jsonFiles.length > 0) {
        console.log(`Processing ${jsonFiles.length} JSON files for page ${page}`);
        toast.info(`Loading ${jsonFiles.length} bills (page ${page} of ${Math.ceil(totalCount / pageSize)})`);
        return processBillFiles(BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, jsonFiles);
      }
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
        toast.info(`Loading ${Math.min(jsonFiles.length, MAX_BILLS_TO_PROCESS)} bills from alternate path`);
        return processBillFiles(BILL_STORAGE_BUCKET, alternatePath, jsonFiles.slice(0, MAX_BILLS_TO_PROCESS));
      }
    }
  }
  
  console.log("No bills could be processed from any storage path");
  return [];
}

/**
 * Helper function to list files with pagination
 */
async function supabaseListWithPagination(bucketName: string, folderPath: string, limit: number, offset: number) {
  try {
    return await supabase
      .storage
      .from(bucketName)
      .list(folderPath, {
        limit: limit,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });
  } catch (error) {
    console.error(`Error in pagination: ${error instanceof Error ? error.message : String(error)}`);
    return { data: [], error };
  }
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
