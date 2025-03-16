
import { supabase } from "@/integrations/supabase/client";
import { Bill } from "@/types";
import { transformStorageBill } from "@/utils/billTransformUtils";
import { POSSIBLE_BUCKETS, POSSIBLE_FOLDERS } from "./storageConfig";

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
      console.debug(`Error downloading file ${filePath}: ${error.message}`);
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
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error || !data) {
      console.debug(`Error or no data listing files in ${bucketName}/${folderPath}: ${error?.message || 'No data returned'}`);
      return [];
    }
    
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
  // List available buckets
  const availableBuckets = await listAvailableBuckets();
  console.log("Available buckets:", availableBuckets);
  
  // Try each possible bucket and folder combination
  for (const bucketName of POSSIBLE_BUCKETS) {
    // Check if the bucket exists in the available buckets
    if (!availableBuckets.includes(bucketName)) {
      console.log(`Bucket "${bucketName}" does not exist, skipping`);
      continue;
    }
    
    console.log(`Checking bucket: ${bucketName}`);
    
    for (const folderPath of POSSIBLE_FOLDERS) {
      console.log(`Checking folder path: "${folderPath}" in bucket "${bucketName}"`);
      
      // List all files in the storage bucket and folder
      const storageData = await listFilesInBucket(bucketName, folderPath);
      
      if (storageData.length === 0) {
        console.log(`No files found in "${bucketName}/${folderPath}"`);
        continue;
      }
      
      console.log(`Found ${storageData.length} files in "${bucketName}/${folderPath}"`);
      
      // Only process .json files
      const jsonFiles = storageData.filter(file => file.name.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log(`No JSON files found in "${bucketName}/${folderPath}"`);
        continue;
      }
      
      console.log(`Found ${jsonFiles.length} JSON files to process in "${bucketName}/${folderPath}"`);
      
      // Process the files
      const filesToProcess = jsonFiles.slice(0, 50);
      const bills: Bill[] = [];
      
      for (const file of filesToProcess) {
        const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
        console.log(`Processing file: ${filePath} from bucket ${bucketName}`);
        
        const bill = await processStorageFile(bucketName, filePath, file.name);
        if (bill) {
          bills.push(bill);
        }
      }
      
      if (bills.length > 0) {
        console.log(`Successfully processed ${bills.length} bills from "${bucketName}/${folderPath}"`);
        return bills;
      }
    }
  }
  
  console.log("No bills could be processed from any storage bucket");
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
  
  // List available buckets
  const availableBuckets = await listAvailableBuckets();
  
  // Try each possible bucket and folder combination
  for (const bucketName of POSSIBLE_BUCKETS) {
    // Check if the bucket exists in the available buckets
    if (!availableBuckets.includes(bucketName)) {
      continue;
    }
    
    for (const folderPath of POSSIBLE_FOLDERS) {
      for (const fileName of possibleFileNames) {
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
        
        const bill = await processStorageFile(bucketName, filePath, fileName);
        if (bill) {
          console.log(`Found bill ${id} in storage as ${filePath} in bucket ${bucketName}`);
          return bill;
        }
      }
    }
  }
  
  console.warn(`Bill ${id} not found in any Supabase storage bucket`);
  return null;
}
