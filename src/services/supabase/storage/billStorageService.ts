
import { Bill } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "../storageConfig";
import { listFilesInBucket, countFilesInBucket } from "./bucketOperations";
import { processBillFiles, processStorageFile } from "./billProcessor";
import { toast } from "sonner";

/**
 * Fetches bill files from storage with optional pagination
 */
export async function fetchBillsFromStorage(page = 1, pageSize = 100): Promise<Bill[]> {
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
        toast.info(`Loading ${Math.min(jsonFiles.length, 100)} bills from alternate path`);
        return processBillFiles(BILL_STORAGE_BUCKET, alternatePath, jsonFiles.slice(0, 100));
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
 * Enhanced to properly handle numeric IDs
 */
export async function fetchBillByIdFromStorage(id: string, specialPath?: string): Promise<Bill | null> {
  // Try different possible file extensions/formats
  const possibleFileNames = [
    `${id}.json`,
    `${id.toUpperCase()}.json`,
    `${id.toLowerCase()}.json`
  ];
  
  // For numeric IDs, also try them as is without a path prefix
  const isNumeric = /^\d+$/.test(id);
  if (isNumeric) {
    console.log(`Looking for numeric ID ${id}, will try direct file name match`);
    // Try to fetch directly by the numeric ID
    try {
      const { data, error } = await supabase.storage
        .from(BILL_STORAGE_BUCKET)
        .download(`${id}.json`);
        
      if (!error && data) {
        console.log(`Found numeric bill ${id} as direct file`);
        const bill = await processStorageFile(BILL_STORAGE_BUCKET, `${id}.json`, `${id}.json`);
        if (bill) return bill;
      }
    } catch (e) {
      console.log(`No direct match for numeric ID ${id}`);
    }
  }
  
  // First try the main path or the special path if provided
  const initialPath = specialPath ? specialPath : BILL_STORAGE_PATH;
  
  for (const fileName of possibleFileNames) {
    const filePath = `${initialPath}/${fileName}`;
    const bill = await processStorageFile(BILL_STORAGE_BUCKET, filePath, fileName);
    if (bill) {
      console.log(`Found bill ${id} in storage at ${filePath}`);
      return bill;
    }
  }
  
  // If no special path was provided, continue with alternative paths
  if (!specialPath) {
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
    
    // For numeric IDs, also try searching for any bill that contains this ID in the content
    if (isNumeric) {
      console.log(`Numeric ID ${id} not found in standard locations, will look for it in bill content`);
      try {
        // Get all bills from storage
        const allBills = await fetchBillsFromStorage();
        // Look for any bill that might have this numeric ID in its data
        const matchingBill = allBills.find(bill => {
          // Check if data contains this numeric ID
          const stringifiedData = JSON.stringify(bill.data);
          return stringifiedData.includes(`"bill_id":"${id}"`) || 
                 stringifiedData.includes(`"bill_id":${id}`) ||
                 bill.id === id;
        });
        
        if (matchingBill) {
          console.log(`Found bill with numeric ID ${id} in bill content`);
          return matchingBill;
        }
      } catch (error) {
        console.error(`Error searching bills for numeric ID ${id}:`, error);
      }
    }
  }
  
  console.warn(`Bill ${id} not found in any storage path`);
  return null;
}
