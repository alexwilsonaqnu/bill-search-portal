
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BILL_STORAGE_BUCKET } from "./config.ts";
import { corsHeaders } from "./cors.ts";

/**
 * Helper function to process a single bill file
 */
export async function processBillFile(supabase, fileName, folderPath = "") {
  console.log(`Processing file: ${fileName} from ${folderPath}`);
  
  // Download the file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(BILL_STORAGE_BUCKET)
    .download(`${folderPath}/${fileName}`);
  
  if (downloadError) {
    throw new Error(`Failed to download file ${fileName} from ${folderPath}: ${downloadError.message}`);
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
  
  console.log(`Successfully processed bill: ${id} from ${folderPath}`);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Successfully processed bill: ${id}`,
      path: folderPath,
      bill: insertData ? insertData[0] : record
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
