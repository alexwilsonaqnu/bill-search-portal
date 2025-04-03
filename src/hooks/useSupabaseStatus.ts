
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "@/services/supabase/storageConfig";
import { countFilesInBucket, listFilesInBucket } from "@/services/supabase/storageService";
import { toast } from "sonner";

export const useSupabaseStatus = () => {
  const [dbStatus, setDbStatus] = useState<string>("");
  const [storageStatus, setStorageStatus] = useState<string>("");
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        setIsInitializing(true);
        
        // Check database by fetching bills without using aggregate functions
        const { data: dbData, error: dbError } = await supabase
          .from('bills')
          .select('id');
        
        if (dbError) {
          setDbStatus(`Database error: ${dbError.message}`);
          toast.error(`Database connection error: ${dbError.message}`);
        } else {
          // Manually count the results instead of using COUNT()
          const count = dbData?.length || 0;
          setDbStatus(`Database connected, bills count: ${count}`);
          if (count === 0) {
            console.log("No bills found in database table");
          } else {
            console.log(`Found ${count} bills in database table`);
          }
        }
        
        // Check storage and list all available buckets
        const { data: bucketsData, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          setStorageStatus(`Storage error: ${bucketsError.message}`);
          toast.error(`Storage connection error: ${bucketsError.message}`);
        } else {
          const bucketNames = bucketsData?.map(b => b.name) || [];
          setAvailableBuckets(bucketNames);
          console.log(`Available storage buckets: ${bucketNames.join(', ')}`);
          
          if (bucketNames.length === 0) {
            setStorageStatus(`Storage connected, but no buckets found. The required bucket "${BILL_STORAGE_BUCKET}" is missing.`);
            toast.warning(`No storage buckets found - bills cannot be loaded`);
            return;
          }
          
          // Check if the main bucket exists
          if (!bucketNames.includes(BILL_STORAGE_BUCKET)) {
            setStorageStatus(`Storage connected, but required bucket "${BILL_STORAGE_BUCKET}" is missing.`);
            toast.warning(`Required bucket "${BILL_STORAGE_BUCKET}" not found`);
            return;
          }
          
          // Count files in the main bucket path
          const mainPathCount = await countFilesInBucket(BILL_STORAGE_BUCKET, BILL_STORAGE_PATH);
          
          // Check all paths for files
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
            
            // Check alternative paths
            let filesFound = false;
            for (const path of ALTERNATIVE_PATHS) {
              const count = await countFilesInBucket(BILL_STORAGE_BUCKET, path);
              if (count > 0) {
                filesFound = true;
                fullStorageStatus += `  📂 ${path}: ${count} files found\n`;
                
                // Sample files
                const files = await listFilesInBucket(BILL_STORAGE_BUCKET, path, 3);
                if (files.length > 0) {
                  fullStorageStatus += `    Sample files: ${files.map(f => f.name).join(', ')}\n`;
                }
              } else {
                fullStorageStatus += `  📂 ${path}: No files found\n`;
              }
            }
            
            // Also check the root of the bucket
            const { data: rootFiles } = await supabase
              .storage
              .from(BILL_STORAGE_BUCKET)
              .list('', { limit: 10 });
            
            if (rootFiles && rootFiles.length > 0) {
              filesFound = true;
              const jsonFiles = rootFiles.filter(f => f.name.endsWith('.json'));
              fullStorageStatus += `  📂 Root: ${rootFiles.length} files found (${jsonFiles.length} JSON files)\n`;
              fullStorageStatus += `    Sample files: ${rootFiles.slice(0, 3).map(f => f.name).join(', ')}\n`;
            } else {
              fullStorageStatus += `  📂 Root: No files found\n`;
            }
            
            if (!filesFound) {
              toast.warning(`No bill files found in any path of bucket "${BILL_STORAGE_BUCKET}"`);
            }
          }
          
          setStorageStatus(fullStorageStatus);
        }
      } catch (e) {
        console.error("Supabase connection check failed:", e);
        setDbStatus(`Connection check failed: ${e instanceof Error ? e.message : String(e)}`);
        toast.error("Failed to check Supabase connection status");
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  return { 
    dbStatus, 
    storageStatus, 
    availableBuckets,
    isInitializing
  };
};
