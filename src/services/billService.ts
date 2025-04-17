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
    
    // Normalize ID format to improve matching
    let normalizedId = id.trim();
    
    // Check if we're dealing with a numeric ID (likely a memorial resolution)
    const isNumericId = /^\d+$/.test(normalizedId);
    
    if (isNumericId) {
      console.log(`ID ${normalizedId} is numeric, will try all possible formats`);
      
      // Try with the original numeric ID first
      try {
        console.log(`Trying with original numeric ID: ${normalizedId}`);
        const bill = await fetchBillByIdFromSupabase(normalizedId);
        if (bill) {
          console.log(`Found bill with numeric ID: ${normalizedId}`);
          return bill;
        }
      } catch (error) {
        console.log(`No bill found with exact numeric ID: ${normalizedId}`);
      }
      
      // Try with common bill prefixes
      const prefixes = ['HR', 'SR', 'HB', 'SB', 'HJR', 'SJR', 'HCR', 'SCR'];
      for (const prefix of prefixes) {
        const prefixedId = `${prefix}${normalizedId}`;
        try {
          console.log(`Trying with prefixed ID: ${prefixedId}`);
          const bill = await fetchBillByIdFromSupabase(prefixedId);
          if (bill) {
            console.log(`Found bill with prefixed ID: ${prefixedId}`);
            // Keep the original ID for UI consistency
            bill.id = normalizedId;
            return bill;
          }
        } catch (error) {
          console.log(`No bill found with ID: ${prefixedId}`);
        }
      }
      
      // Try to find any bill containing this numeric ID in its content
      console.log(`Trying to find bill containing ID ${normalizedId} in content`);
      try {
        const { bills } = await fetchBills("", 1, 100);  // Get a larger batch of bills
        
        const matchingBill = bills.find(bill => {
          return bill.id.includes(normalizedId) || 
                 JSON.stringify(bill.data || {}).includes(`"bill_id":"${normalizedId}"`) ||
                 JSON.stringify(bill.data || {}).includes(`"bill_id":${normalizedId}`);
        });
        
        if (matchingBill) {
          console.log(`Found bill containing ID ${normalizedId} in content: ${matchingBill.id}`);
          // Keep the original ID for UI consistency
          matchingBill.id = normalizedId;
          return matchingBill;
        }
      } catch (error) {
        console.error(`Error searching for bill with ID ${normalizedId} in content:`, error);
      }
    } else {
      // For non-numeric IDs, try variations
      const variations = [
        normalizedId,
        normalizedId.toUpperCase(),
        normalizedId.toLowerCase()
      ];
      
      for (const variant of variations) {
        try {
          console.log(`Trying with ID variant: ${variant}`);
          const bill = await fetchBillByIdFromSupabase(variant);
          if (bill) {
            console.log(`Found bill with ID variant: ${variant}`);
            bill.id = normalizedId; // Keep the original ID for UI consistency
            return bill;
          }
        } catch (error) {
          console.log(`No bill found with ID variant: ${variant}`);
        }
      }
    }
    
    console.warn(`Bill ${normalizedId} not found with any approach`);
    toast.error(`Bill ${normalizedId} not found in any data source`);
    return null;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
