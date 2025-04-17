
import { Bill } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS, MAX_BILLS_TO_PROCESS } from "../storageConfig";
import { listFilesInBucket, countFilesInBucket } from "./bucketOperations";
import { processBillFiles, processStorageFile } from "./billProcessor";
import { toast } from "sonner";

/**
 * Fetches bill files from storage with pagination
 */
export async function fetchBillsFromStorage(page = 1, pageSize = 10): Promise<{ storageBills: Bill[], totalCount: number }> {
  console.log(`Trying to fetch bills from bucket: ${BILL_STORAGE_BUCKET}, path: ${BILL_STORAGE_PATH}, page: ${page}, pageSize: ${pageSize}`);
  
  let allBills: Bill[] = [];
  let totalFiles = 0;
  
  // Only use the main path and avoid looping through alternative paths
  const pathsToSearch = [BILL_STORAGE_PATH];
  
  // Try each path and combine results
  for (const path of pathsToSearch) {
    if (allBills.length >= MAX_BILLS_TO_PROCESS) {
      console.log(`Reached maximum bill limit (${MAX_BILLS_TO_PROCESS}), stopping search.`);
      break;
    }
    
    console.log(`Checking path: ${BILL_STORAGE_BUCKET}/${path}`);
    const pathFileCount = await countFilesInBucket(BILL_STORAGE_BUCKET, path);
    totalFiles += pathFileCount;
    
    if (pathFileCount > 0) {
      console.log(`Found ${pathFileCount} total files in path: ${path}`);
      
      // Calculate skip and limit values for pagination
      const from = (page - 1) * pageSize;
      const currentPageSize = Math.min(pageSize, MAX_BILLS_TO_PROCESS - allBills.length);
      
      const { data: pathFiles, error } = await supabaseListWithPagination(
        BILL_STORAGE_BUCKET, 
        path, 
        currentPageSize, 
        from
      );
      
      if (error) {
        console.error(`Error fetching files from ${path}: ${error.message}`);
        continue; // Try next path
      }
      
      if (pathFiles && pathFiles.length > 0) {
        console.log(`Found ${pathFiles.length} files in path: ${path}`);
        
        // Process the JSON files
        const jsonFiles = pathFiles.filter(file => file.name.endsWith('.json'));
        if (jsonFiles.length > 0) {
          console.log(`Processing ${jsonFiles.length} JSON files from ${path}`);
          
          // Calculate how many more bills we can process
          const filesToProcess = jsonFiles;
          
          if (filesToProcess.length > 0) {
            toast.info(`Loading ${filesToProcess.length} bills from ${path || 'root directory'}`);
            const pathBills = await processBillFiles(BILL_STORAGE_BUCKET, path, filesToProcess);
            
            // Add bills from this path to the combined results, avoiding duplicates
            const existingIds = new Set(allBills.map(bill => bill.id));
            for (const bill of pathBills) {
              if (!existingIds.has(bill.id)) {
                allBills.push(bill);
                existingIds.add(bill.id);
              }
            }
            
            console.log(`Added ${pathBills.length} unique bills from ${path}, total: ${allBills.length}`);
          }
        }
      }
    }
  }
  
  if (allBills.length === 0) {
    console.log("No bills could be processed from any storage path");
  } else {
    console.log(`Successfully processed a total of ${allBills.length} bills from all paths`);
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
 * Fetches a specific bill by ID from storage
 * Simplified to only search in the main path
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
  
  // First try the special path if provided, otherwise use the main path
  const pathsToSearch = specialPath ? [specialPath] : [BILL_STORAGE_PATH];
  
  for (const path of pathsToSearch) {
    for (const fileName of possibleFileNames) {
      const filePath = path ? `${path}/${fileName}` : fileName;
      console.log(`Looking for bill ${id} at ${filePath}`);
      
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
      const result = await fetchBillsFromStorage();
      const allBills = result.storageBills;
      
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
  
  console.warn(`Bill ${id} not found in any storage path`);
  return null;
}
