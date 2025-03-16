
import { Bill } from "@/types";
import { toast } from "sonner";
import { fetchBillsFromDatabase, fetchBillByIdFromDatabase } from "./supabase/dbService";
import { fetchBillsFromStorage, fetchBillByIdFromStorage } from "./supabase/storageService";

/**
 * Fetches all bills from Supabase
 */
export async function fetchBillsFromSupabase() {
  try {
    console.log("Fetching bills from Supabase...");
    
    // First try to fetch from the database table
    const tableData = await fetchBillsFromDatabase();
    
    if (tableData && tableData.length > 0) {
      return tableData;
    }
    
    // If database table has no data, try fetching from storage
    console.log("No bills found in table, trying storage buckets...");
    
    const storageBills = await fetchBillsFromStorage();
    
    if (storageBills.length > 0) {
      toast.success(`Loaded ${storageBills.length} bills from Supabase storage`);
      return storageBills;
    }
    
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
    const databaseBill = await fetchBillByIdFromDatabase(id);
    
    if (databaseBill) {
      return databaseBill;
    }
    
    // If not found in database table, try fetching from storage
    console.log(`Bill ${id} not found in table, trying storage buckets...`);
    
    const storageBill = await fetchBillByIdFromStorage(id);
    
    if (storageBill) {
      return storageBill;
    }
    
    console.warn(`Bill ${id} not found in any Supabase storage bucket`);
    return null;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    return null;
  }
}
