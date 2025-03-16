
import { supabase } from "@/integrations/supabase/client";
import { MAX_FILES_TO_RETRIEVE } from "../storageConfig";

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
 * Lists files in a specific bucket and folder path with pagination support
 */
export async function listFilesInBucket(bucketName: string, folderPath: string, limit = MAX_FILES_TO_RETRIEVE) {
  try {
    console.log(`Attempting to list files in ${bucketName}/${folderPath} (limit: ${limit})`);
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(folderPath, {
        limit: limit,
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
 * Fetches a specific file from a bucket
 */
export async function fetchFileFromBucket(bucketName: string, filePath: string) {
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
 * Counts the number of files in a bucket path
 */
export async function countFilesInBucket(bucketName: string, folderPath: string): Promise<number> {
  try {
    // First, we need to list files to count them manually since count property is not available
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(folderPath, {
        limit: MAX_FILES_TO_RETRIEVE,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.error(`Error counting files in ${bucketName}/${folderPath}: ${error.message}`);
      return 0;
    }
    
    const fileCount = data ? data.length : 0;
    console.log(`Total count in ${bucketName}/${folderPath}: ${fileCount}`);
    return fileCount;
  } catch (error) {
    console.error(`Error counting files in ${bucketName}/${folderPath}:`, error);
    return 0;
  }
}
