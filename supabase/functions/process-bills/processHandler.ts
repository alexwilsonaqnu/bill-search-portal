
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS, MAX_BILLS_TO_PROCESS } from "./config.ts";
import { corsHeaders } from "./cors.ts";
import { processBillFile } from "./billProcessor.ts";

/**
 * Handle processing of all files from multiple directories
 */
export async function handleProcess(supabase) {
  const pathsToSearch = [BILL_STORAGE_PATH, ...ALTERNATIVE_PATHS];
  const processedBills = [];
  let totalProcessed = 0;
  
  console.log(`Starting bill processing with bucket: ${BILL_STORAGE_BUCKET}`);
  console.log(`Paths to search: ${pathsToSearch.join(', ')}`);
  
  for (const path of pathsToSearch) {
    // Stop if we've reached the processing limit
    if (totalProcessed >= MAX_BILLS_TO_PROCESS) {
      console.log(`Reached maximum processing limit of ${MAX_BILLS_TO_PROCESS} bills`);
      break;
    }
    
    console.log(`Checking path: ${BILL_STORAGE_BUCKET}/${path}`);
    const { data: files, error: listError } = await supabase.storage
      .from(BILL_STORAGE_BUCKET)
      .list(path);
    
    if (listError) {
      console.log(`Error listing files in ${path}: ${listError.message}`);
      continue; // Try next path
    }
    
    if (!files || files.length === 0) {
      console.log(`No files found in ${BILL_STORAGE_BUCKET}/${path}`);
      continue; // Try next path
    }
    
    console.log(`Found ${files.length} files in ${path}`);
    
    // Process only JSON files
    const jsonFiles = files.filter(file => file.name.endsWith(".json"));
    
    if (jsonFiles.length === 0) {
      console.log(`No JSON files found in ${path}`);
      continue; // Try next path
    }
    
    console.log(`Found ${jsonFiles.length} JSON files to process in ${path}`);
    
    // Calculate how many files we can process from this path
    const remainingCapacity = MAX_BILLS_TO_PROCESS - totalProcessed;
    const filesToProcess = jsonFiles.slice(0, remainingCapacity);
    
    // Process each file
    for (const file of filesToProcess) {
      try {
        const result = await processBillFile(supabase, file.name, path);
        const data = await result.json();
        processedBills.push(data);
        totalProcessed++;
      } catch (error) {
        console.error(`Error processing file ${file.name} from ${path}:`, error);
        processedBills.push({ 
          file: file.name, 
          path: path,
          success: false, 
          error: error.message 
        });
      }
    }
    
    console.log(`Processed ${filesToProcess.length} files from ${path}, total processed: ${totalProcessed}`);
  }
  
  if (totalProcessed === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `No files found in the ${BILL_STORAGE_BUCKET} bucket in any path`,
        processed: 0,
        paths_checked: pathsToSearch
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Processed ${totalProcessed} files from multiple paths`,
      paths_processed: pathsToSearch.filter(p => processedBills.some(bill => bill.path === p)),
      processed: totalProcessed,
      results: processedBills
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
