
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "@/services/supabase/storageConfig";
import { countFilesInBucket } from "@/services/supabase/storageService";

export const useSupabaseStatus = () => {
  const [dbStatus, setDbStatus] = useState<string>("");
  const [storageStatus, setStorageStatus] = useState<string>("");
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Check database by fetching bills without using aggregate functions
        const { data: dbData, error: dbError } = await supabase
          .from('bills')
          .select('id');
        
        if (dbError) {
          setDbStatus(`Database error: ${dbError.message}`);
        } else {
          // Manually count the results instead of using COUNT()
          const count = dbData?.length || 0;
          setDbStatus(`Database connected, bills count: ${count}`);
        }
        
        // Check storage and list all available buckets
        const { data: bucketsData, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          setStorageStatus(`Storage error: ${bucketsError.message}`);
        } else {
          const bucketNames = bucketsData?.map(b => b.name) || [];
          setAvailableBuckets(bucketNames);
          
          if (bucketNames.length === 0) {
            setStorageStatus(`Storage connected, but no buckets found. The required bucket "${BILL_STORAGE_BUCKET}" is missing.`);
            return;
          }
          
          // Check if the main bucket exists
          if (!bucketNames.includes(BILL_STORAGE_BUCKET)) {
            setStorageStatus(`Storage connected, but required bucket "${BILL_STORAGE_BUCKET}" is missing.`);
            return;
          }
          
          // Count files in the main bucket path
          const mainPathCount = await countFilesInBucket(BILL_STORAGE_BUCKET, BILL_STORAGE_PATH);
          
          // Check path for files
          let fullStorageStatus = `Storage connected, buckets: ${bucketNames.join(', ')}\n`;
          fullStorageStatus += `\n⭐ MAIN BUCKET: ${BILL_STORAGE_BUCKET}\n`;
          
          // If main path has files, show count
          if (mainPathCount > 0) {
            fullStorageStatus += `  📂 ${BILL_STORAGE_PATH}: ${mainPathCount} files found!\n`;
            
            // Get a sample of files
            const { data: sampleFiles } = await supabase
              .storage
              .from(BILL_STORAGE_BUCKET)
              .list(BILL_STORAGE_PATH, { limit: 5 });
              
            if (sampleFiles && sampleFiles.length > 0) {
              const fileNames = sampleFiles.map(f => f.name).join(', ');
              fullStorageStatus += `    Sample files: ${fileNames}\n`;
            }
          } else {
            fullStorageStatus += `  📂 ${BILL_STORAGE_PATH}: No files found\n`;
          }
          
          setStorageStatus(fullStorageStatus);
        }
      } catch (e) {
        console.error("Supabase connection check failed:", e);
        setDbStatus(`Connection check failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  return { dbStatus, storageStatus, availableBuckets };
};
