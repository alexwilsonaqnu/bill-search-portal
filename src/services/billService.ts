import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillById as fetchBillFromLegiscan } from "./legiscanService";

/**
 * Fetches bills using LegiScan search API
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10,
  sessionId?: string
): Promise<SearchResults> {
  try {
    console.log(`Searching bills with query: "${query}", page: ${page}, sessionId: ${sessionId}`);
    
    // If no search query, return empty results
    if (!query) {
      return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
    }

    const { data, error } = await supabase.functions.invoke('search-bills', {
      body: { query, page, pageSize, sessionId }
    });

    if (error) {
      console.error("Error searching bills:", error);
      toast.error("Failed to search bills. Please try again later.");
      return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
    }
    
    // If we have proper pagination from the API, use it
    if (data && data.bills && typeof data.currentPage === 'number' && typeof data.totalPages === 'number') {
      return data;
    } else if (data && data.bills) {
      // Otherwise, process the results locally with our pagination logic
      return processResults(data.bills, "", page, pageSize);
    }

    return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
    
  } catch (error) {
    console.error("Error in fetchBills:", error);
    toast.error("Failed to fetch bills. Please try again later.");
    return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
  }
}

/**
 * Fetches a bill by ID from LegiScan API
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    if (!id) {
      throw new Error("Bill ID is required");
    }
    
    console.log(`Fetching bill with ID: ${id} from LegiScan API`);
    const bill = await fetchBillFromLegiscan(id);
    
    if (!bill) {
      console.warn(`Bill ${id} not found`);
      return null;
    }
    
    return bill;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
