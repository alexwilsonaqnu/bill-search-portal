
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
          setStorageStatus(`Storage connected, buckets: ${bucketNames.join(', ') || 'none'}`);
          
          // For each bucket, try to list contents
          for (const bucket of bucketNames) {
            try {
              const { data: files, error: listError } = await supabase
                .storage
                .from(bucket)
                .list('', { limit: 10 });
              
              if (listError) {
                setStorageStatus(prev => `${prev} | ${bucket} error: ${listError.message}`);
              } else {
                const fileCount = files?.length || 0;
                const fileNames = files?.map(f => f.name).slice(0, 3).join(', ');
                setStorageStatus(prev => 
                  `${prev} | ${bucket}: ${fileCount} files${fileCount > 0 ? ` (examples: ${fileNames}${fileCount > 3 ? '...' : ''})` : ''}`
                );
              }
            } catch (e) {
              console.error(`Error listing contents of bucket ${bucket}:`, e);
            }
          }
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
