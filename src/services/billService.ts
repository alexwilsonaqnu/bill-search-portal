
import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchBillByIdFromSupabase } from "./supabaseBillService";

/**
 * Fetches bills using LegiScan search API
 */
export async function fetchBills(
  query: string = "",
  page: number = 1,
  pageSize: number = 10
): Promise<SearchResults> {
  try {
    console.log(`Searching bills with query: "${query}", page: ${page}`);
    
    // If no search query, return empty results
    if (!query) {
      return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
    }

    const { data, error } = await supabase.functions.invoke('search-bills', {
      body: { query }
    });

    if (error) {
      console.error("Error searching bills:", error);
      toast.error("Failed to search bills. Please try again later.");
      return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
    }

    return data;
    
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
