
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
    
    // Try to fetch directly with the original ID first
    try {
      const bill = await fetchBillByIdFromSupabase(id);
      if (bill) {
        console.log(`Found bill in Supabase with exact ID match: ${bill.id}`);
        return bill;
      }
    } catch (error) {
      console.warn(`Could not find bill with exact ID: ${id}. Will try alternative approaches.`);
      // Continue to other approaches
    }
    
    // If original ID didn't work, try with different ID formats
    // Try without any normalization first
    const alternativeFormats = [
      id,
      id.toUpperCase(),
      id.toLowerCase(),
      // For numeric only IDs, try with common prefixes
      ...(/^\d+$/.test(id) ? ['HB', 'SB', 'HR', 'SR'].map(prefix => `${prefix}${id}`) : [])
    ];
    
    console.log(`Trying alternative ID formats: ${alternativeFormats.join(', ')}`);
    
    // Try each alternative format
    for (const format of alternativeFormats) {
      if (format === id) continue; // Skip if it's the original ID (already tried)
      
      try {
        const bill = await fetchBillByIdFromSupabase(format);
        if (bill) {
          console.log(`Found bill using alternative format: ${format}`);
          // Make sure the returned bill shows the ID that was requested
          bill.id = id;
          return bill;
        }
      } catch (error) {
        console.warn(`No match found for ID format: ${format}`);
        // Continue to the next format
      }
    }
    
    // Bill not found with any ID format
    console.log(`No matching bill found for ID: ${id} or any alternative formats`);
    toast.error(`Bill ${id} not found in any data source`);
    return null;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
