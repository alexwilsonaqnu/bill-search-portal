
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
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching bill ${id}:`, error);
      return null;
    }
    
    if (!data) {
      console.log(`No bill found with ID: ${id}`);
      return null;
    }
    
    return transformSupabaseBill(data);
  } catch (error) {
    console.error(`Error in fetchBillByIdFromSupabase ${id}:`, error);
    throw error;
  }
}
