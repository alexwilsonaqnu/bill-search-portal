
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSupabaseStatus = () => {
  const [dbStatus, setDbStatus] = useState<string>("");
  const [storageStatus, setStorageStatus] = useState<string>("");
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Check database
        const { data: dbData, error: dbError } = await supabase
          .from('bills')
          .select('count()', { count: 'exact' });
        
        if (dbError) {
          setDbStatus(`Database error: ${dbError.message}`);
        } else {
          // Correctly access the count value from the response
          const count = dbData?.[0]?.count ?? 0;
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
            setStorageStatus(`Storage connected, but no buckets found. The required bucket "103rd_General_Assembly" is missing.`);
            return;
          }
          
          setStorageStatus(`Storage connected, buckets: ${bucketNames.join(', ')}`);
          
          // For each bucket, try to list contents with more detailed information
          let fullStorageStatus = `Buckets (${bucketNames.length}):\n`;
          
          for (const bucket of bucketNames) {
            try {
              fullStorageStatus += `\n⭐ BUCKET: ${bucket}\n`;
              
              // Try different folders for each bucket
              const folderPaths = ["", "bill", "bills", "data"];
              
              for (const folderPath of folderPaths) {
                const { data: files, error: listError } = await supabase
                  .storage
                  .from(bucket)
                  .list(folderPath, { limit: 10 });
                
                if (listError) {
                  fullStorageStatus += `  📂 ${folderPath || "/"}: Error: ${listError.message}\n`;
                } else {
                  const fileCount = files?.length || 0;
                  const filesInfo = files?.map(f => `${f.name}${f.metadata?.mimetype ? ` (${f.metadata.mimetype})` : ''}`).join(', ');
                  
                  fullStorageStatus += `  📂 ${folderPath || "/"}: ${fileCount} files${fileCount > 0 ? 
                    `\n    Files: ${filesInfo}` : 
                    ' (empty)'}\n`;
                }
              }
            } catch (e) {
              fullStorageStatus += `  Error exploring bucket ${bucket}: ${e instanceof Error ? e.message : String(e)}\n`;
            }
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
