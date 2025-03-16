
import { Bill } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { transformSupabaseBill, transformStorageBill } from "@/utils/billTransformUtils";
import { FALLBACK_BILLS } from "@/data/fallbackBills";

// We'll try different bucket names since we're not sure which one contains the bills
const POSSIBLE_BUCKETS = [
  "2023-2024_103rd_General_Assembly", 
  "bill_storage",
  "bills"
];

// We'll try different folder paths
const POSSIBLE_FOLDERS = [
  "bill",  // original path
  "bills", 
  "",      // root level
];

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
    console.log("No bills found in table, trying storage buckets...");
    
    // List available buckets for debugging
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error(`Error listing buckets: ${bucketsError.message}`);
      return null;
    }
    
    console.log("Available buckets:", buckets?.map(b => b.name));
    
    // Try each possible bucket and folder combination
    for (const bucketName of POSSIBLE_BUCKETS) {
      // Check if the bucket exists in the available buckets
      if (!buckets?.some(b => b.name === bucketName)) {
        console.log(`Bucket "${bucketName}" does not exist, skipping`);
        continue;
      }
      
      console.log(`Checking bucket: ${bucketName}`);
      
      for (const folderPath of POSSIBLE_FOLDERS) {
        console.log(`Checking folder path: "${folderPath}" in bucket "${bucketName}"`);
        
        // List all files in the storage bucket and folder
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from(bucketName)
          .list(folderPath, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (storageError) {
          console.error(`Error listing files in "${bucketName}/${folderPath}": ${storageError.message}`);
          continue;
        }
        
        if (!storageData || storageData.length === 0) {
          console.log(`No files found in "${bucketName}/${folderPath}"`);
          continue;
        }
        
        console.log(`Found ${storageData.length} files in "${bucketName}/${folderPath}"`);
        
        // Only process .json files
        const jsonFiles = storageData.filter(file => file.name.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
          console.log(`No JSON files found in "${bucketName}/${folderPath}"`);
          continue;
        }
        
        console.log(`Found ${jsonFiles.length} JSON files to process in "${bucketName}/${folderPath}"`);
        
        // We found JSON files, process them
        const filesToProcess = jsonFiles.slice(0, 50);
        const bills: Bill[] = [];
        
        for (const file of filesToProcess) {
          const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;
          console.log(`Processing file: ${filePath} from bucket ${bucketName}`);
          
          const { data: fileContent, error: fileError } = await supabase
            .storage
            .from(bucketName)
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
          console.log(`Successfully processed ${bills.length} bills from "${bucketName}/${folderPath}"`);
          toast.success(`Loaded ${bills.length} bills from Supabase storage`);
          return bills;
        }
      }
    }
    
    console.log("No bills could be processed from any storage bucket");
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
    console.log(`Bill ${id} not found in table, trying storage buckets...`);
    
    // Try different possible file extensions/formats
    const possibleFileNames = [
      `${id}.json`,
      `${id.toUpperCase()}.json`,
      `${id.toLowerCase()}.json`
    ];
    
    // List available buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error(`Error listing buckets: ${bucketsError.message}`);
      return null;
    }
    
    // Try each possible bucket and folder combination
    for (const bucketName of POSSIBLE_BUCKETS) {
      // Check if the bucket exists in the available buckets
      if (!buckets?.some(b => b.name === bucketName)) {
        continue;
      }
      
      for (const folderPath of POSSIBLE_FOLDERS) {
        for (const fileName of possibleFileNames) {
          const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
          
          const { data: fileData, error: fileError } = await supabase
            .storage
            .from(bucketName)
            .download(filePath);
          
          if (fileError) {
            continue;
          }
          
          try {
            const text = await fileData.text();
            console.log(`Found bill ${id} in storage as ${filePath} in bucket ${bucketName}`);
            return transformStorageBill(fileName, text);
          } catch (error) {
            console.error(`Error processing ${fileName}:`, error);
          }
        }
      }
    }
    
    console.warn(`Bill ${id} not found in any Supabase storage bucket`);
    return null;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    return null;
  }
}
