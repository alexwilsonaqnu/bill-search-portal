
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSupabaseStatus = () => {
  const [dbStatus, setDbStatus] = useState<string>("");
  const [storageStatus, setStorageStatus] = useState<string>("");
  
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
        
        // Check storage
        const { data: bucketsData, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          setStorageStatus(`Storage error: ${bucketsError.message}`);
        } else {
          setStorageStatus(`Storage connected, buckets: ${bucketsData?.map(b => b.name).join(', ') || 'none'}`);
          
          // Check bill_storage bucket
          const { data: storageFiles, error: storageError } = await supabase
            .storage
            .from('bill_storage')
            .list('', { limit: 10 });
          
          if (storageError) {
            setStorageStatus(prev => `${prev} | bill_storage error: ${storageError.message}`);
          } else {
            setStorageStatus(prev => `${prev} | bill_storage files: ${storageFiles?.length || 0}`);
          }
        }
      } catch (e) {
        console.error("Supabase connection check failed:", e);
        setDbStatus(`Connection check failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  return { dbStatus, storageStatus };
};
