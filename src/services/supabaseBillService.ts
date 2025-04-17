
import { Bill } from "@/types";
import { toast } from "sonner";
import { fetchBillsFromDatabase, fetchBillByIdFromDatabase } from "./supabase/dbService";
import { fetchBillsFromStorage, fetchBillByIdFromStorage } from "./supabase/storageService";
import { supabase } from "@/integrations/supabase/client";
import { transformSupabaseBill } from "@/utils/billTransformUtils";

/**
 * Fetches bills from Supabase with pagination support
 */
export async function fetchBillsFromSupabase(page = 1, pageSize = 10): Promise<{ bills: Bill[], totalCount: number }> {
  try {
    console.log(`Fetching bills from Supabase... Page: ${page}, PageSize: ${pageSize}`);
    
    // First try to fetch from the database table with pagination
    const { tableData, totalCount } = await fetchBillsFromDatabase(page, pageSize);
    
    if (tableData && tableData.length > 0) {
      console.log(`Found ${tableData.length} bills in database table (page ${page}/${Math.ceil(totalCount/pageSize)})`);
      return { bills: tableData, totalCount };
    }
    
    // If database table has no data, try fetching from storage
    console.log("No bills found in table, trying storage buckets...");
    
    const { storageBills, totalCount: storageCount } = await fetchBillsFromStorage(page, pageSize);
    
    if (storageBills.length > 0) {
      toast.success(`Loaded ${storageBills.length} bills from Supabase storage`);
      return { bills: storageBills, totalCount: storageCount };
    }
    
    return { bills: [], totalCount: 0 };
  } catch (error) {
    console.error("Error fetching bills:", error);
    throw error; // Let the caller handle the error instead of returning null
  }
}

/**
 * Fetches a specific bill by ID from Supabase
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Attempting to fetch bill with ID: ${id}`);
    
    // Step 1: First try fetching from the database table
    const dbBill = await fetchBillByIdFromDatabase(id);
    if (dbBill) {
      console.log(`Found bill ${id} in database table`);
      return dbBill;
    }
    
    // Step 2: If not in database, try fetching from storage
    console.log(`Bill ${id} not found in database table, trying storage...`);
    const storageBill = await fetchBillByIdFromStorage(id);
    if (storageBill) {
      console.log(`Found bill ${id} in storage`);
      return storageBill;
    }
    
    // Try as a fallback with direct query if the id is numeric (for memorial resolutions)
    const isNumeric = /^\d+$/.test(id);
    if (isNumeric) {
      console.log(`Trying direct database query for numeric ID: ${id}`);
      try {
        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data && !error) {
          console.log(`Found bill with numeric ID ${id} in database via direct query`);
          return transformSupabaseBill(data);
        }
      } catch (e) {
        console.log(`Direct query attempt failed for numeric ID ${id}`);
      }
      
      // As a last resort, try to fetch all bills and find by ID
      console.log(`Last resort: Fetching all bills to find numeric ID ${id}`);
      try {
        const { bills } = await fetchBillsFromSupabase(1, 50);
        const foundBill = bills.find(b => b.id === id || 
                                     b.id.toString() === id || 
                                     (b.data && b.data.bill_id === id));
        
        if (foundBill) {
          console.log(`Found bill ${id} in full bill collection`);
          return foundBill;
        }
      } catch (e) {
        console.error(`Failed to search all bills for ID ${id}:`, e);
      }
    }
    
    console.warn(`Bill ${id} not found in any location`);
    return null;
  } catch (error) {
    console.error(`Error in fetchBillByIdFromSupabase ${id}:`, error);
    throw error;
  }
}
