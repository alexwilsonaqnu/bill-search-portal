
import { Bill } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformSupabaseBill, transformStorageBill } from "@/utils/billTransformUtils";
import { FALLBACK_BILLS } from "@/data/fallbackBills";

const BUCKET_NAME = "2023-2024_103rd_General_Assembly";
const FOLDER_PATH = "bill";

/**
 * Fetches all bills from Supabase
 */
export async function fetchBillsFromSupabase() {
  try {
    console.log("Fetching bills from Supabase...");
    
    // First try to fetch from the database table
    const { data: tableData, error: tableError } = await supabase
      .from('bills')
      .select('*');
    
    if (tableError) {
      console.warn(`Error fetching from bills table: ${tableError.message}`);
    }
    
    if (!tableError && tableData && tableData.length > 0) {
      console.log(`Successfully fetched ${tableData.length} bills from Supabase table`);
      const transformedBills: Bill[] = tableData.map(item => transformSupabaseBill(item));
      return transformedBills;
    }
    
    // If database table has no data, try fetching from storage
    console.log("No bills found in table, trying storage bucket...");
    
    // List available buckets for debugging
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error(`Error listing buckets: ${bucketsError.message}`);
    } else {
      console.log("Available buckets:", buckets.map(b => b.name));
    }
    
    // List all files in the storage bucket
    console.log(`Looking in bucket: ${BUCKET_NAME}, folder: ${FOLDER_PATH}`);
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(FOLDER_PATH, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (storageError) {
      console.error(`Supabase storage fetch failed: ${storageError.message}`);
      toast.info("Using demo data - Supabase storage access error");
      return null;
    }
    
    if (!storageData || storageData.length === 0) {
      console.log(`No files found in bucket "${BUCKET_NAME}" under path "${FOLDER_PATH}"`);
      
      // Try listing contents at the root level to see if folder path is incorrect
      const { data: rootFiles, error: rootError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list('', { limit: 20 });
        
      if (!rootError && rootFiles && rootFiles.length > 0) {
        console.log(`Found ${rootFiles.length} files/folders at the root level:`, 
          rootFiles.map(f => f.name));
      }
      
      return [];
    }
    
    console.log(`Found ${storageData.length} files in storage bucket under "${FOLDER_PATH}"`);
    
    // Only process .json files
    const jsonFiles = storageData.filter(file => file.name.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log("No JSON files found in storage bucket");
      return [];
    }
    
    console.log(`Found ${jsonFiles.length} JSON files to process`);
    
    // Fetch and process each JSON file (limit to 50 for performance if there are many)
    const filesToProcess = jsonFiles.slice(0, 50);
    const bills: Bill[] = [];
    
    for (const file of filesToProcess) {
      const filePath = `${FOLDER_PATH}/${file.name}`;
      console.log(`Processing file: ${filePath}`);
      
      const { data: fileContent, error: fileError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .download(filePath);
      
      if (fileError) {
        console.warn(`Error downloading ${file.name}: ${fileError.message}`);
        continue;
      }
      
      try {
        const text = await fileContent.text();
        const bill = transformStorageBill(file.name, text);
        bills.push(bill);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }
    
    if (bills.length > 0) {
      console.log(`Successfully processed ${bills.length} bills from storage`);
      return bills;
    }
    
    console.log("No bills could be processed from storage");
    return [];
  } catch (error) {
    console.error("Error fetching bills:", error);
    return null;
  }
}

/**
 * Fetches a specific bill by ID from Supabase
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Fetching bill ${id} from Supabase...`);
    
    // First try to fetch from the database table
    const { data: tableData, error: tableError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!tableError && tableData) {
      console.log(`Found bill ${id} in database table`);
      return transformSupabaseBill(tableData);
    }
    
    // If not found in database table, try fetching from storage
    console.log(`Bill ${id} not found in table, trying storage bucket...`);
    
    // Try different possible file extensions/formats
    const possibleFileNames = [
      `${id}.json`,
      `${id.toUpperCase()}.json`,
      `${id.toLowerCase()}.json`
    ];
    
    for (const fileName of possibleFileNames) {
      const filePath = `${FOLDER_PATH}/${fileName}`;
      
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .download(filePath);
      
      if (fileError) {
        console.log(`File ${fileName} not found in storage: ${fileError.message}`);
        continue;
      }
      
      try {
        const text = await fileData.text();
        console.log(`Found bill ${id} in storage as ${fileName}`);
        return transformStorageBill(fileName, text);
      } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
      }
    }
    
    console.warn(`Bill ${id} not found in Supabase storage`);
    return null;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    return null;
  }
}
