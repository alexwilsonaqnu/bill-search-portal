
import { Bill } from "@/types";
import { toast } from "sonner";
import { fetchBillsFromDatabase, fetchBillByIdFromDatabase } from "./supabase/dbService";
import { fetchBillsFromStorage, fetchBillByIdFromStorage } from "./supabase/storageService";

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
 * Enhanced to better handle numeric IDs and debugging
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Fetching bill ${id} from Supabase...`);
    
    // Check if we're dealing with a numeric ID (likely a memorial resolution)
    const isNumericId = /^\d+$/.test(id);
    if (isNumericId) {
      console.log(`ID ${id} appears to be a numeric ID (possibly memorial resolution)`);
    }
    
    // First try to fetch from the database table with exact ID
    let databaseBill = null;
    try {
      databaseBill = await fetchBillByIdFromDatabase(id);
      if (databaseBill) {
        console.log(`Found bill ${id} in database table`);
        return databaseBill;
      }
    } catch (error) {
      console.log(`Bill ${id} not found in database table:`, error);
    }
    
    // If it's a numeric ID, try common prefixes
    if (isNumericId) {
      console.log(`Trying to find numeric ID ${id} with common prefixes...`);
      const prefixes = ['HR', 'SR', 'HB', 'SB', 'HJR', 'SJR', 'HCR', 'SCR'];
      
      for (const prefix of prefixes) {
        const prefixedId = `${prefix}${id}`;
        console.log(`Trying with prefix: ${prefixedId}`);
        try {
          const prefixedBill = await fetchBillByIdFromDatabase(prefixedId);
          if (prefixedBill) {
            console.log(`Found bill with ID ${prefixedId} in database`);
            // Make sure the returned bill has the requested ID format
            prefixedBill.id = id;
            return prefixedBill;
          }
        } catch (error) {
          console.log(`Bill not found with prefixed ID: ${prefixedId}`);
        }
      }
    }
    
    // If not found in database table, try fetching from storage
    console.log(`Bill ${id} not found in table, trying storage buckets...`);
    
    // Try directly with the given ID
    let storageBill = null;
    try {
      storageBill = await fetchBillByIdFromStorage(id);
      if (storageBill) {
        console.log(`Found bill ${id} in storage`);
        return storageBill;
      }
    } catch (error) {
      console.log(`Bill not found in storage with exact ID: ${id}`);
    }
    
    // If it's a numeric ID, try common prefixes for storage as well
    if (isNumericId) {
      const prefixes = ['HR', 'SR', 'HB', 'SB', 'HJR', 'SJR', 'HCR', 'SCR'];
      for (const prefix of prefixes) {
        const prefixedId = `${prefix}${id}`;
        console.log(`Trying storage with prefix: ${prefixedId}`);
        try {
          const prefixedBill = await fetchBillByIdFromStorage(prefixedId);
          if (prefixedBill) {
            console.log(`Found bill with ID ${prefixedId} in storage`);
            // Make sure the returned bill has the requested ID format
            prefixedBill.id = id;
            return prefixedBill;
          }
        } catch (error) {
          console.log(`Bill not found in storage with prefixed ID: ${prefixedId}`);
        }
      }
    }
    
    // Special case for numeric IDs - also try without prefixes in alternative locations
    if (isNumericId) {
      console.log(`Trying to find numeric ID ${id} in alternative storage paths...`);
      const specialPaths = ["resolutions", "memorials", "numeric", "bills", "bill"];
      
      for (const path of specialPaths) {
        console.log(`Trying special path: ${path}`);
        try {
          const specialBill = await fetchBillByIdFromStorage(id, path);
          if (specialBill) {
            console.log(`Found bill ${id} in special path: ${path}`);
            return specialBill;
          }
        } catch (error) {
          console.log(`Bill not found in special path: ${path}`);
        }
      }
      
      // Look for it as a root file (no folder)
      console.log(`Trying numeric ID ${id} as root file (no folder)`);
      try {
        const rootBill = await fetchBillByIdFromStorage(id, "");
        if (rootBill) {
          console.log(`Found bill ${id} as root file`);
          return rootBill;
        }
      } catch (error) {
        console.log(`Bill not found as root file: ${id}`);
      }
    }
    
    console.warn(`Bill ${id} not found in any Supabase storage bucket`);
    
    // For debugging - try to find any bill that matches this pattern in a larger set
    try {
      console.log(`DEBUG: Searching broadly for any bill containing ${id}...`);
      const result = await fetchBillsFromSupabase(1, 50);  // Get a larger batch
      const allBills = result.bills;
      const matchingBills = allBills.filter(b => 
        b.id.includes(id) || 
        (b.id.replace(/[^0-9]/g, '') === id) ||
        (b.data && JSON.stringify(b.data).includes(`"bill_id":"${id}"`)) ||
        (b.data && JSON.stringify(b.data).includes(`"bill_id":${id}`))
      );
      
      if (matchingBills.length > 0) {
        console.log(`Found ${matchingBills.length} similar bills:`, 
          matchingBills.map(b => `ID: ${b.id}, Title: ${b.title?.substring(0, 30) || 'No title'}`));
          
        // If exactly one match is found, return it with the requested ID
        if (matchingBills.length === 1) {
          console.log(`Returning the single matching bill with the requested ID ${id}`);
          const bill = matchingBills[0];
          bill.id = id; // Ensure it has the requested ID
          return bill;
        }
      } else {
        console.log(`No bills found containing ID ${id} in broader search`);
      }
    } catch (e) {
      console.error(`Error in debug search:`, e);
    }
    
    throw new Error(`Bill ${id} not found in Supabase`);
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    throw error; // Let the caller handle the error
  }
}
