
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "./config.ts";
import { corsHeaders } from "./cors.ts";

/**
 * Handle listing of files
 */
export async function handleList(supabase) {
  // Try main path first
  let { data: files, error: listError } = await supabase.storage
    .from(BILL_STORAGE_BUCKET)
    .list(BILL_STORAGE_PATH);
  
  // If main path doesn't work, try alternative paths
  if (listError || !files || files.length === 0) {
    console.log(`No files found in ${BILL_STORAGE_BUCKET}/${BILL_STORAGE_PATH}, trying alternatives`);
    
    for (const path of ALTERNATIVE_PATHS) {
      const { data: altFiles, error: altError } = await supabase.storage
        .from(BILL_STORAGE_BUCKET)
        .list(path);
        
      if (!altError && altFiles && altFiles.length > 0) {
        files = altFiles;
        console.log(`Found ${files.length} files in alternative path: ${path}`);
        break;
      }
    }
  }
  
  if (!files || files.length === 0) {
    console.log(`No files found in any path of bucket ${BILL_STORAGE_BUCKET}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        files: [] 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      files: files || [] 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
