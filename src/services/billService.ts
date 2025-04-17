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
 * Fetches a bill by ID from Supabase
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    if (!id) {
      throw new Error("Bill ID is required");
    }
    
    console.log(`Fetching bill with ID: ${id}`);
    const bill = await fetchBillByIdFromSupabase(id);
    
    if (!bill) {
      console.warn(`Bill ${id} not found`);
      toast.error(`Bill ${id} not found`);
      return null;
    }
    
    return bill;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
