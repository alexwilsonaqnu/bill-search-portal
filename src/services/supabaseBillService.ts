
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
    throw error; // Let the caller handle the error instead of returning null
  }
}

/**
 * Fetches a specific bill by ID from Supabase
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Fetching bill ${id} from Supabase...`);
    
    // Check if we're dealing with a numeric ID (likely a memorial resolution)
    const isNumericId = /^\d+$/.test(id);
    if (isNumericId) {
      console.log(`ID ${id} appears to be a memorial resolution or numeric ID`);
    }
    
    // First try to fetch from the database table with exact ID
    let databaseBill = await fetchBillByIdFromDatabase(id);
    
    if (databaseBill) {
      console.log(`Found bill ${id} in database table`);
      return databaseBill;
    }
    
    // If it's a numeric ID, try common prefixes
    if (isNumericId) {
      console.log(`Trying to find numeric ID ${id} with common prefixes...`);
      const prefixes = ['HB', 'SB', 'HR', 'SR'];
      
      for (const prefix of prefixes) {
        const prefixedId = `${prefix}${id}`;
        console.log(`Trying with prefix: ${prefixedId}`);
        const prefixedBill = await fetchBillByIdFromDatabase(prefixedId);
        if (prefixedBill) {
          console.log(`Found bill with ID ${prefixedId} in database`);
          // Make sure the returned bill has the requested ID format
          prefixedBill.id = id;
          return prefixedBill;
        }
      }
    }
    
    // If not found in database table, try fetching from storage
    console.log(`Bill ${id} not found in table, trying storage buckets...`);
    
    // Try directly with the given ID
    let storageBill = await fetchBillByIdFromStorage(id);
    
    if (storageBill) {
      console.log(`Found bill ${id} in storage`);
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
          console.log(`Found bill with ID ${prefixedId} in storage`);
          // Make sure the returned bill has the requested ID format
          prefixedBill.id = id;
          return prefixedBill;
        }
      }
    }
    
    console.warn(`Bill ${id} not found in any Supabase storage bucket`);
    throw new Error(`Bill ${id} not found in Supabase`);
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    throw error; // Let the caller handle the error
  }
}
