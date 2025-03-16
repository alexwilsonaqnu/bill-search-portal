
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
 * Now with improved ID matching for memorial resolutions and numeric IDs
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Fetching bill ${id} from Supabase...`);
    
    // First try to fetch from the database table with exact ID
    const databaseBill = await fetchBillByIdFromDatabase(id);
    
    if (databaseBill) {
      return databaseBill;
    }
    
    // Is this a purely numeric ID (memorial resolution)?
    const isNumericId = /^\d+$/.test(id);
    
    // Try common prefixes if it's a numeric ID
    if (isNumericId) {
      console.log(`ID ${id} is numeric, trying with common prefixes...`);
      const prefixes = ['HB', 'SB', 'HR', 'SR'];
      
      for (const prefix of prefixes) {
        const prefixedId = `${prefix}${id}`;
        console.log(`Trying with prefix: ${prefixedId}`);
        const prefixedBill = await fetchBillByIdFromDatabase(prefixedId);
        if (prefixedBill) {
          return prefixedBill;
        }
      }
    }
    
    // If not found in database table, try fetching from storage
    console.log(`Bill ${id} not found in table, trying storage buckets...`);
    
    // Try directly with the given ID
    const storageBill = await fetchBillByIdFromStorage(id);
    
    if (storageBill) {
      return storageBill;
    }
    
    // If it's a numeric ID, try common prefixes for storage as well
    if (isNumericId) {
      const prefixes = ['HB', 'SB', 'HR', 'SR'];
      for (const prefix of prefixes) {
        const prefixedId = `${prefix}${id}`;
        console.log(`Trying storage with prefix: ${prefixedId}`);
        const prefixedBill = await fetchBillByIdFromStorage(prefixedId);
        if (prefixedBill) {
          return prefixedBill;
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
