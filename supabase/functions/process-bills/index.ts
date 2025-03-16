
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process uploaded files or list existing files
    const { data: params } = await req.json();
    const action = params?.action || "process";
    
    console.log(`Executing '${action}' action`);
    
    if (action === "upload") {
      // Logic for uploading a file to the bill_storage bucket
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
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("bill_storage")
        .upload(`bills/${fileName}`, fileData, {
          contentType: "application/json",
          upsert: true,
        });
      
      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }
      
      console.log(`Successfully uploaded file: ${fileName}`);
      
      // Process the uploaded file
      return await processBillFile(supabase, fileName);
    } else if (action === "list") {
      // List all files in the bill_storage bucket
      const { data: files, error: listError } = await supabase.storage
        .from("bill_storage")
        .list("bills");
      
      if (listError) {
        throw new Error(`Failed to list files: ${listError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          files: files || [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Default action: process all files in the bill_storage bucket
      const { data: files, error: listError } = await supabase.storage
        .from("bill_storage")
        .list("bills");
      
      if (listError) {
        throw new Error(`Failed to list files: ${listError.message}`);
      }
      
      if (!files || files.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No files found in the bill_storage bucket",
            processed: 0 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Found ${files.length} files to process`);
      
      // Process each file
      let processedCount = 0;
      const results = [];
      
      for (const file of files) {
        if (!file.name.endsWith(".json")) continue;
        
        try {
          const result = await processBillFile(supabase, file.name);
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
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});

// Helper function to process a single bill file
async function processBillFile(supabase, fileName) {
  console.log(`Processing file: ${fileName}`);
  
  // Download the file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("bill_storage")
    .download(`bills/${fileName}`);
  
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
