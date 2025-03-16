
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH, ALTERNATIVE_PATHS } from "./config.ts";

// Shared CORS headers for all responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface for request parameters
export interface RequestParams {
  action?: "process" | "upload" | "list";
  fileContent?: string;
  fileName?: string;
}

// Handle file upload and processing
export async function handleUpload(supabase, params: RequestParams) {
  const { fileContent, fileName } = params;
  if (!fileContent || !fileName) {
    throw new Error("Missing required parameters: fileContent or fileName");
  }
  
  // Convert base64 to Uint8Array if needed
  let fileData;
  if (typeof fileContent === "string") {
    // Handle base64 content
    const base64Data = fileContent.split(",")[1] || fileContent;
    fileData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  } else {
    throw new Error("File content must be a base64 string");
  }
  
  // Upload to storage using the correct bucket
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BILL_STORAGE_BUCKET)
    .upload(`${BILL_STORAGE_PATH}/${fileName}`, fileData, {
      contentType: "application/json",
      upsert: true,
    });
  
  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }
  
  console.log(`Successfully uploaded file: ${fileName} to ${BILL_STORAGE_BUCKET}/${BILL_STORAGE_PATH}`);
  
  // Process the uploaded file
  return await processBillFile(supabase, fileName);
}

// Handle listing of files
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

// Handle processing of all files
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

// Helper function to process a single bill file
export async function processBillFile(supabase, fileName, folderPath = BILL_STORAGE_PATH) {
  console.log(`Processing file: ${fileName} from ${folderPath}`);
  
  // Download the file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BILL_STORAGE_BUCKET)
    .download(`${folderPath}/${fileName}`);
  
  if (downloadError) {
    throw new Error(`Failed to download file ${fileName}: ${downloadError.message}`);
  }
  
  // Parse the JSON content
  let billData;
  try {
    const text = await fileData.text();
    billData = JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON for ${fileName}: ${error.message}`);
  }
  
  // Extract ID from filename (e.g., "HB1234.json" -> "HB1234")
  const id = fileName.replace(".json", "");
  
  // Prepare bill record
  const record = {
    id,
    title: billData.title || `Bill ${id}`,
    description: billData.description || "",
    status: billData.status || "",
    last_updated: billData.lastUpdated ? new Date(billData.lastUpdated) : new Date(),
    data: billData
  };
  
  // Insert/update the bill in the database
  const { data: insertData, error: insertError } = await supabase
    .from("bills")
    .upsert(record)
    .select();
  
  if (insertError) {
    throw new Error(`Failed to insert/update bill ${id}: ${insertError.message}`);
  }
  
  console.log(`Successfully processed bill: ${id}`);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Successfully processed bill: ${id}`,
      bill: insertData ? insertData[0] : record
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
