import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillById as fetchBillFromLegiscan } from "@/services/legiscan";

// More efficient cache for search results with longer TTL
const searchCache = new Map<string, { data: SearchResults; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes - increased from 5 minutes

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
    
    // If no search query, return empty results immediately
    if (!query) {
      return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
    }

    // Create a cache key from the query parameters
    const cacheKey = `${query}-${page}-${pageSize}-${sessionId || ''}`;
    
    // Check if we have a cached result
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Using cached results for "${query}"`);
      return cached.data;
    }

    // Set a timeout to prevent UI from hanging too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Call the edge function without passing the signal parameter
      const { data, error } = await supabase.functions.invoke('search-bills', {
        body: { query, page, pageSize, sessionId }
      });

      // Clear timeout
      clearTimeout(timeoutId);

      if (error) {
        console.error("Error searching bills:", error);
        throw new Error(error.message || "Failed to search bills");
      }
      
      if (data?.error) {
        console.error("API returned error:", data.error);
        throw new Error(data.error);
      }
      
      let result: SearchResults;
      
      // Process the search results
      if (data && data.bills && typeof data.currentPage === 'number' && typeof data.totalPages === 'number') {
        // We have proper pagination from the API, use it directly
        result = data;
      } else if (data && data.bills) {
        // Otherwise, process the results locally with our pagination logic
        result = processResults(data.bills, query, page, pageSize);
      } else {
        result = { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
      }

      // Cache the result
      searchCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      // Clear timeout if there was an error
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error("Search request timed out after 10 seconds");
      }
      throw error;
    }
    
  } catch (error) {
    console.error("Error in fetchBills:", error);
    toast.error("Failed to fetch bills", {
      description: error.message || "Please try again later"
    });
    return { bills: [], currentPage: page, totalPages: 0, totalItems: 0 };
  }
}

// Cache for bill details
const billCache = new Map<string, { data: Bill; timestamp: number }>();

/**
 * Fetches a bill by ID from LegiScan API
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  try {
    if (!id) {
      throw new Error("Bill ID is required");
    }
    
    // Check for cached bill
    const cached = billCache.get(id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Using cached bill ${id}`);
      return cached.data;
    }
    
    console.log(`Fetching bill with ID: ${id} from LegiScan API`);
    const bill = await fetchBillFromLegiscan(id);
    
    if (!bill) {
      console.warn(`Bill ${id} not found`);
      return null;
    }
    
    // Cache the bill
    billCache.set(id, { data: bill, timestamp: Date.now() });
    
    return bill;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    toast.error(`Error fetching bill ${id}`);
    throw error;
  }
}
