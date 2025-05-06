
import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillById as fetchBillFromLegiscan } from "@/services/legiscan";

// More efficient cache for search results with longer TTL
const searchCache = new Map<string, { data: SearchResults; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes - increased from 5 minutes

/**
 * Fetches bills using LegiScan search API with improved error handling
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

    // Call the edge function with a timeout
    try {
      // Call the edge function with a longer timeout
      const fetchPromise = supabase.functions.invoke('search-bills', {
        body: { query, page, pageSize, sessionId }
      });
      
      // Set our own timeout to handle unresponsive function
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Search request timed out after 20 seconds")), 20000);
      });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

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
      // Include more specific error handling
      if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
        toast.error("Search request timed out", {
          description: "The LegiScan API is taking too long to respond. Please try again later or try a different search term."
        });
      } else if (error.message?.includes("Edge Function returned a non-2xx")) {
        toast.error("Search service error", {
          description: "The bill search service is currently unavailable. Please try again later."
        });
      }
      
      console.error("Error in fetchBills:", error);
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

// Cache for bill details with longer expiration
const billCache = new Map<string, { data: Bill; timestamp: number }>();

/**
 * Fetches a bill by ID from LegiScan API with improved error handling
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
    
    // Show more specific error message to the user
    if (error.message?.includes("timeout") || error.message?.includes("timed out")) {
      toast.error(`Bill information unavailable`, {
        description: "The LegiScan API is taking too long to respond. Please try again later."
      });
    } else {
      toast.error(`Error fetching bill ${id}`, {
        description: "Unable to load bill information at this time"
      });
    }
    
    throw error;
  }
}

/**
 * Clear cached data - useful for debugging or manual refresh
 */
export function clearCache() {
  searchCache.clear();
  billCache.clear();
  console.log("Cache cleared");
  toast.success("Search cache cleared");
}
