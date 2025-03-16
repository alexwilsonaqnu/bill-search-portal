
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
 * Attempts multiple ways to find a bill by ID across all available sources
 * Enhanced to better handle numeric IDs like memorial resolutions
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    console.log(`Original bill ID requested: ${id}`);
    
    // Normalize the ID for consistent lookup
    const normalizedId = normalizeBillId(id);
    console.log(`Normalized ID for lookup: ${normalizedId}`);
    
    // Try to fetch from Supabase first with the normalized ID
    const bill = await fetchBillByIdFromSupabase(normalizedId);
    
    if (bill) {
      console.log(`Found bill in Supabase: ${bill.id}`);
      return bill;
    }
    
    // If not found in Supabase, try fallback data
    console.log(`Bill ${normalizedId} not found in Supabase, checking fallback data...`);
    
    // First try with exact ID match (both original and normalized)
    let fallbackBill = FALLBACK_BILLS.find(bill => 
      bill.id === id || bill.id === normalizedId
    );
    
    if (fallbackBill) {
      console.log(`Found exact match in fallback data: ${fallbackBill.id}`);
      toast.info("Using demo data - Bill found in fallback data");
      return fallbackBill;
    }
    
    // Handle numeric IDs (like memorial resolutions)
    if (/^\d+$/.test(normalizedId)) {
      console.log(`Checking for numeric ID match in fallback data: ${normalizedId}`);
      
      fallbackBill = FALLBACK_BILLS.find(bill => 
        bill.id === normalizedId
      );
      
      if (fallbackBill) {
        console.log(`Found matching memorial resolution: ${fallbackBill.id}`);
        toast.info("Using demo data - Memorial resolution found");
        return fallbackBill;
      }
    }
    
    // Try with case-insensitive normalized IDs
    console.log("Trying case-insensitive normalized ID matching...");
    fallbackBill = FALLBACK_BILLS.find(bill => 
      normalizeBillId(bill.id).toLowerCase() === normalizedId.toLowerCase()
    );
    
    if (fallbackBill) {
      console.log(`Found case-insensitive match: ${fallbackBill.id}`);
      toast.info("Using demo data - Bill found with case-insensitive matching");
      return fallbackBill;
    }
    
    // Try matching by numeric part only as last resort
    if (/\d+/.test(normalizedId)) {
      console.log("Trying to match by numeric part only...");
      const numericPart = normalizedId.replace(/\D/g, '');
      
      if (numericPart) {
        fallbackBill = FALLBACK_BILLS.find(bill => 
          bill.id.replace(/\D/g, '') === numericPart
        );
        
        if (fallbackBill) {
          console.log(`Found numeric part match: ${fallbackBill.id}`);
          toast.info("Using demo data - Bill found by numeric matching");
          return fallbackBill;
        }
      }
    }
    
    console.log(`No matching bill found for ID: ${id}`);
    toast.info(`Bill ${id} not found`);
    return null;
  } catch (error) {
    console.error(`Error in fetchBillById ${id}:`, error);
    
    // Even if there's an error, try fallback with multiple matching strategies
    try {
      console.log("Error occurred, trying fallback data as last resort...");
      const normalizedId = normalizeBillId(id);
      
      // First try with exact matches
      let bill = FALLBACK_BILLS.find(bill => 
        bill.id === id || bill.id === normalizedId
      );
      
      // Check for numeric IDs specifically
      if (!bill && /^\d+$/.test(normalizedId)) {
        bill = FALLBACK_BILLS.find(bill => bill.id === normalizedId);
      }
      
      // If still not found, try with case-insensitive normalized IDs
      if (!bill) {
        bill = FALLBACK_BILLS.find(bill => 
          normalizeBillId(bill.id).toLowerCase() === normalizedId.toLowerCase()
        );
      }
      
      // If still not found, try numeric part only
      if (!bill) {
        const numericPart = normalizedId.replace(/\D/g, '');
        if (numericPart) {
          bill = FALLBACK_BILLS.find(bill => 
            bill.id.replace(/\D/g, '') === numericPart
          );
        }
      }
      
      if (bill) {
        console.log(`Found fallback bill after error: ${bill.id}`);
        toast.info("Using demo data - Connection to Supabase failed");
        return bill;
      }
    } catch (fallbackError) {
      console.error("Error in fallback bill finder:", fallbackError);
    }
    
    return null;
  }
}
