
import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillsFromSupabase, fetchBillByIdFromSupabase } from "@/services/supabaseBillService";
import { normalizeBillId } from "@/utils/billTransformUtils";

/**
 * Fetches bill data from Supabase
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    console.log(`Fetching bills with query: "${query}", page: ${page}, pageSize: ${pageSize}`);
    const bills = await fetchBillsFromSupabase();
    
    console.log(`Raw bills data fetched:`, {
      count: bills?.length || 0,
      hasData: !!bills && bills.length > 0
    });
    
    if (!bills || bills.length === 0) {
      // No bills found, let the user know
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
    console.log(`Original bill ID requested: ${id}`);
    
    // Normalize the ID for consistent lookup
    const normalizedId = normalizeBillId(id);
    console.log(`Normalized ID for lookup: ${normalizedId}`);
    
    // Try to fetch from Supabase
    try {
      const bill = await fetchBillByIdFromSupabase(normalizedId);
      if (bill) {
        console.log(`Found bill in Supabase: ${bill.id}`);
        return bill;
      }
    } catch (error) {
      console.error(`Supabase fetch error: ${error}`);
      toast.error(`Error fetching bill ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
    
    // Bill not found
    console.log(`No matching bill found for ID: ${id}`);
    toast.error(`Bill ${id} not found in any data source`);
    return null;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
