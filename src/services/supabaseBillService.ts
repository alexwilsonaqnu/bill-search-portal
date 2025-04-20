
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
      
      // Store bill IDs in local storage for easier lookup
      storeBillIdsInLocalCache(tableData);
      
      return { bills: tableData, totalCount };
    }
    
    // If database table has no data, try fetching from storage
    console.log("No bills found in table, trying storage buckets...");
    
    const { storageBills, totalCount: storageCount } = await fetchBillsFromStorage(page, pageSize);
    
    if (storageBills.length > 0) {
      // Store bill IDs in local storage for easier lookup
      storeBillIdsInLocalCache(storageBills);
      
      return { bills: storageBills, totalCount: storageCount };
    }
    
    return { bills: [], totalCount: 0 };
  } catch (error) {
    console.error("Error fetching bills:", error);
    throw error; // Let the caller handle the error instead of returning null
  }
}

/**
 * Helper function to store bill IDs in local storage for easier lookup
 * This helps with the connection between list view and detail view
 */
function storeBillIdsInLocalCache(bills: Bill[]) {
  try {
    // Get existing bill IDs from local storage or initialize as empty object
    const existingData = localStorage.getItem('billIdCache');
    const billIdCache = existingData ? JSON.parse(existingData) : {};
    
    // Add each bill to the cache with normalized IDs
    bills.forEach(bill => {
      // Store with original ID as key
      billIdCache[bill.id] = {
        id: bill.id,
        title: bill.title?.substring(0, 30) + "...",
        altIds: []
      };
      
      // Add alternate IDs if available in bill data
      const billData = bill.data?.bill || bill.data;
      if (billData?.bill_id) {
        const legiscanId = billData.bill_id.toString();
        if (legiscanId !== bill.id) {
          billIdCache[bill.id].altIds.push(legiscanId);
          // Also add as a key in the cache
          billIdCache[legiscanId] = {
            id: bill.id,  // Store the original ID
            title: bill.title?.substring(0, 30) + "...",
            isAlternate: true
          };
        }
      }
    });
    
    // Save back to local storage
    localStorage.setItem('billIdCache', JSON.stringify(billIdCache));
    console.log(`Stored ${bills.length} bill IDs in local cache for faster lookup`);
  } catch (error) {
    console.warn("Failed to store bill IDs in local storage:", error);
    // Non-critical error, continue without storing
  }
}

/**
 * Fetches a specific bill by ID from Supabase
 */
export async function fetchBillByIdFromSupabase(id: string): Promise<Bill | null> {
  try {
    console.log(`Attempting to fetch bill with ID: ${id}`);
    
    // Check local cache first for faster lookup and alternate IDs
    const billFromCache = checkBillCache(id);
    if (billFromCache && billFromCache.originalId && billFromCache.originalId !== id) {
      console.log(`Found alternate ID in cache. Original ID: ${billFromCache.originalId}`);
      // Use the original ID from the cache instead
      id = billFromCache.originalId;
    }
    
    // Step 1: First try fetching from the database table - this is direct and efficient
    const dbBill = await fetchBillByIdFromDatabase(id);
    if (dbBill) {
      console.log(`Found bill ${id} in database table`);
      return dbBill;
    }
    
    // Step 2: If not in database, try fetching from storage DIRECTLY
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
    }
    
    console.warn(`Bill ${id} not found in any location`);
    return null;
  } catch (error) {
    console.error(`Error in fetchBillByIdFromSupabase ${id}:`, error);
    throw error;
  }
}

/**
 * Helper function to check the bill cache in local storage
 */
function checkBillCache(id: string): { originalId?: string } {
  try {
    const cacheData = localStorage.getItem('billIdCache');
    if (!cacheData) return {};
    
    const billCache = JSON.parse(cacheData);
    
    // Direct lookup
    if (billCache[id]) {
      if (billCache[id].isAlternate) {
        return { originalId: billCache[id].id };
      }
      return {};
    }
    
    // No match found
    return {};
  } catch (error) {
    console.warn("Error accessing bill cache:", error);
    return {};
  }
}
