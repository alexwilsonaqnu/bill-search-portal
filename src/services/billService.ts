
import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillsFromSupabase, fetchBillByIdFromSupabase } from "@/services/supabaseBillService";
import { FALLBACK_BILLS } from "@/data/fallbackBills";
import { normalizeBillId } from "@/utils/billTransformUtils";

/**
 * Fetches bill data from Supabase, falling back to demo data if necessary
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    const bills = await fetchBillsFromSupabase();
    
    if (!bills) {
      // If there was an error fetching from Supabase
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    if (bills.length === 0) {
      // If no bills were found in Supabase
      toast.info("Using demo data - No bills found in Supabase");
      return processResults(FALLBACK_BILLS, query, page, pageSize);
    }
    
    // Process the bills from Supabase
    return processResults(bills, query, page, pageSize);
  } catch (error) {
    console.error("Error in fetchBills:", error);
    toast.info("Using demo data - Connection to Supabase failed");
    return processResults(FALLBACK_BILLS, query, page, pageSize);
  }
}

/**
 * Fetches a specific bill by ID from Supabase, falling back to demo data if necessary
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    const normalizedId = normalizeBillId(id);
    console.log(`Fetching bill with normalized ID: ${normalizedId}`);
    
    // Try to fetch from Supabase first
    const bill = await fetchBillByIdFromSupabase(normalizedId);
    
    if (bill) {
      return bill;
    }
    
    // If not found in Supabase, try fallback data
    console.log(`Bill ${normalizedId} not found in Supabase, checking fallback data...`);
    
    // Try to find the bill in fallback data, checking both the original and normalized ID
    const fallbackBill = FALLBACK_BILLS.find(bill => 
      normalizeBillId(bill.id) === normalizedId || bill.id === id
    );
    
    if (!fallbackBill) {
      toast.info(`Bill ${id} not found`);
      return null;
    }
    
    toast.info("Using demo data - Bill not found in Supabase");
    return fallbackBill;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    
    const normalizedId = normalizeBillId(id);
    const bill = FALLBACK_BILLS.find(bill => 
      normalizeBillId(bill.id) === normalizedId || bill.id === id
    );
    
    if (!bill) return null;
    
    toast.info("Using demo data - Connection to Supabase failed");
    return bill;
  }
}
