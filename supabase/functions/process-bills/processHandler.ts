
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "./config.ts";
import { corsHeaders } from "./cors.ts";
import { processBillFile } from "./billProcessor.ts";

/**
 * Handle processing of all files
 */
export async function handleProcess(supabase) {
  // Try main path first
  let { data: files, error: listError } = await supabase.storage
    .from(BILL_STORAGE_BUCKET)
    .list(BILL_STORAGE_PATH);
  
  let currentPath = BILL_STORAGE_PATH;
  
  // If main path doesn't work, try alternative paths
  if (listError || !files || files.length === 0) {
    console.log(`No files found in ${BILL_STORAGE_BUCKET}/${BILL_STORAGE_PATH}, trying alternatives`);
    
    for (const path of ALTERNATIVE_PATHS) {
      const { data: altFiles, error: altError } = await supabase.storage
        .from(BILL_STORAGE_BUCKET)
        .list(path);
        
      if (!altError && altFiles && altFiles.length > 0) {
        files = altFiles;
        currentPath = path;
        console.log(`Found ${files.length} files in alternative path: ${path}`);
        break;
      }
    }
  }
  
  if (!files || files.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `No files found in the ${BILL_STORAGE_BUCKET} bucket in any path`,
        processed: 0 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  console.log(`Found ${files.length} files to process in ${currentPath}`);
  
  // Process only JSON files
  const jsonFiles = files.filter(file => file.name.endsWith(".json"));
  
  if (jsonFiles.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `No JSON files found in the ${BILL_STORAGE_BUCKET} bucket`,
        processed: 0 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  console.log(`Found ${jsonFiles.length} JSON files to process`);
  
  // Process each file
  let processedCount = 0;
  const results = [];
  
  for (const file of jsonFiles) {
    try {
      const result = await processBillFile(supabase, file.name, currentPath);
      const data = await result.json();
      results.push(data);
      processedCount++;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      results.push({ 
        file: file.name, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Processed ${processedCount} files`,
      results 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
