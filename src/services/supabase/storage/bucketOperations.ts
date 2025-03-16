
import { supabase } from "@/integrations/supabase/client";

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
 * Lists files in a specific bucket and folder path
 */
export async function listFilesInBucket(bucketName: string, folderPath: string) {
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
