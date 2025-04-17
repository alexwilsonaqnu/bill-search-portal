
import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillsFromSupabase, fetchBillByIdFromSupabase } from "@/services/supabaseBillService";

/**
 * Fetches bill data from Supabase with pagination support
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    console.log(`Fetching bills with query: "${query}", page: ${page}, pageSize: ${pageSize}`);
    
    // Check if we have a search query - if so, we'll need to fetch all and filter
    if (query) {
      console.log(`Search query detected, fetching all bills to filter by: "${query}"`);
      const { bills, totalCount } = await fetchBillsFromSupabase();
      
      console.log(`Raw bills data fetched:`, {
        count: bills?.length || 0,
        hasData: !!bills && bills.length > 0
      });
      
      if (!bills || bills.length === 0) {
        toast.warning("No bills found in the database");
        return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
      }
      
      console.log(`Found ${bills.length} total bills, processing results...`);
      
      // Process the bills from Supabase
      const results = processResults(bills, query, page, pageSize);
      console.log(`Processed results:`, {
        totalItems: results.totalItems,
        totalPages: results.totalPages,
        currentPage: results.currentPage,
        billsCount: results.bills.length
      });
      
      return results;
    } else {
      // No search query - use server-side pagination
      console.log(`No search query, using server-side pagination. Page: ${page}, pageSize: ${pageSize}`);
      const { bills, totalCount } = await fetchBillsFromSupabase(page, pageSize);
      
      if (!bills || bills.length === 0) {
        toast.warning("No bills found in the database");
        return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
      }
      
      const totalPages = Math.ceil(totalCount / pageSize);
      console.log(`Server-side pagination: ${bills.length} bills, page ${page}/${totalPages}, total: ${totalCount}`);
      
      return { 
        bills, 
        currentPage: page, 
        totalPages, 
        totalItems: totalCount 
      };
    }
  } catch (error) {
    console.error("Error in fetchBills:", error);
    toast.error("Failed to fetch bills. Please try again later.");
    return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
  }
}

/**
 * Fetches a bill by ID from Supabase with enhanced ID handling
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    if (!id) {
      throw new Error("Bill ID is required");
    }
    
    console.log(`Fetching bill with original ID: ${id}`);
    
    // Check if we're dealing with a numeric ID (likely a memorial resolution)
    const isNumericId = /^\d+$/.test(id);
    if (isNumericId) {
      console.log(`ID ${id} appears to be numeric, will try multiple formats`);
      
      // For purely numeric IDs, try first with common prefixes
      const prefixedIds = ['HR', 'SR', 'HB', 'SB'].map(prefix => `${prefix}${id}`);
      
      // First try the original numeric ID
      try {
        console.log(`Trying original numeric ID: ${id}`);
        const bill = await fetchBillByIdFromSupabase(id);
        if (bill) {
          console.log(`Found bill with numeric ID: ${id}`);
          return bill;
        }
      } catch (error) {
        console.warn(`Bill not found with numeric ID: ${id}`);
      }
      
      // Try each prefix if original ID failed
      for (const prefixedId of prefixedIds) {
        try {
          console.log(`Trying prefixed ID: ${prefixedId}`);
          const bill = await fetchBillByIdFromSupabase(prefixedId);
          if (bill) {
            console.log(`Found bill with prefixed ID: ${prefixedId}`);
            // Preserve the requested ID for consistency in the UI
            bill.id = id;
            return bill;
          }
        } catch (error) {
          console.warn(`Bill not found with ID: ${prefixedId}`);
        }
      }
      
      console.warn(`No bill found for numeric ID ${id} with any prefix`);
      toast.error(`Bill ${id} not found in any data source`);
      return null;
    }
    
    // For non-numeric IDs, try direct lookup
    try {
      const bill = await fetchBillByIdFromSupabase(id);
      if (bill) {
        console.log(`Found bill with exact ID match: ${bill.id}`);
        return bill;
      }
    } catch (error) {
      console.error(`Error in fetchBillById ${id}:`, error);
      toast.error(`Error fetching bill ${id}`);
      throw error;
    }
    
    return null;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
