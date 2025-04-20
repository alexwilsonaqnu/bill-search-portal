
import { Bill } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH } from "../storageConfig";
import { processStorageFile } from "./billProcessor";

/**
 * Fetches bill files from storage with pagination - only used by the bills list page
 */
export async function fetchBillsFromStorage(page = 1, pageSize = 10): Promise<{ storageBills: Bill[], totalCount: number }> {
  console.log(`Trying to fetch bills from bucket: ${BILL_STORAGE_BUCKET}, path: ${BILL_STORAGE_PATH}, page: ${page}, pageSize: ${pageSize}`);
  
  let allBills: Bill[] = [];
  let totalFiles = 0;
  
  // Calculate skip and limit values for pagination
  const from = (page - 1) * pageSize;
  
  const { data: pathFiles, error } = await supabaseListWithPagination(
    BILL_STORAGE_BUCKET, 
    BILL_STORAGE_PATH, 
    pageSize, 
    from
  );
  
  if (error) {
    console.error(`Error fetching files: ${error.message}`);
    return { storageBills: [], totalCount: 0 };
  }
  
  // Get total count for pagination
  try {
    // Use list method to get files but we'll only use it for counting
    const listResult = await supabase
      .storage
      .from(BILL_STORAGE_BUCKET)
      .list(BILL_STORAGE_PATH, {
        limit: 1,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    totalFiles = listResult.data ? listResult.data.length : 0;
    
    // For a more accurate count, we could get all files but this might be inefficient
    // for large buckets, so we'll just use the length of the data array for now
    console.log(`Estimated total files: ${totalFiles}`);
  } catch (error) {
    console.error("Error counting files:", error);
  }
  
  if (pathFiles && pathFiles.length > 0) {
    console.log(`Found ${pathFiles.length} files`);
    
    // Process only JSON files
    const jsonFiles = pathFiles.filter(file => file.name.endsWith('.json'));
    
    if (jsonFiles.length > 0) {
      for (const file of jsonFiles) {
        const filePath = `${BILL_STORAGE_PATH}/${file.name}`;
        const bill = await processStorageFile(BILL_STORAGE_BUCKET, filePath, file.name);
        if (bill) {
          allBills.push(bill);
        }
      }
      
      console.log(`Processed ${allBills.length} bills successfully`);
    }
  }
  
  return { storageBills: allBills, totalCount: totalFiles };
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
 * Fetches a specific bill by ID from storage - optimized to fetch only one file
 */
export async function fetchBillByIdFromStorage(id: string): Promise<Bill | null> {
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
  
  // Try the standard path
  for (const fileName of possibleFileNames) {
    const filePath = `${BILL_STORAGE_PATH}/${fileName}`;
    console.log(`Looking for bill ${id} at ${filePath}`);
    
    const bill = await processStorageFile(BILL_STORAGE_BUCKET, filePath, fileName);
    if (bill) {
      console.log(`Found bill ${id} in storage at ${filePath}`);
      return bill;
    }
  }
  
  console.warn(`Bill ${id} not found in storage path`);
  return null;
}
