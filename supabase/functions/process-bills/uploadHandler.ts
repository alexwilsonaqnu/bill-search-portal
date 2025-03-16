
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BILL_STORAGE_BUCKET, BILL_STORAGE_PATH } from "./config.ts";
import { corsHeaders } from "./cors.ts";
import { processBillFile } from "./billProcessor.ts";

/**
 * Handle file upload and processing
 */
export async function handleUpload(supabase, params: { fileContent?: string; fileName?: string }) {
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
