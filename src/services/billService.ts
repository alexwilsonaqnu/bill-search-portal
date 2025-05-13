import { Bill, SearchResults } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { processResults } from "@/utils/billProcessingUtils";
import { fetchBillById as fetchBillFromLegiscan } from "@/services/legiscan";

// Simple cache for search results
const searchCache = new Map<string, { data: SearchResults; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Fetches bills using LegiScan search API with simplified error handling
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
    const fetchPromise = supabase.functions.invoke('search-bills', {
      body: { query, page, pageSize, sessionId }
    });
    
    // Set our own timeout to handle unresponsive function
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Search request timed out after 15 seconds")), 15000);
    });
    
    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Error searching bills:", error);
        throw new Error(error.message || "Failed to search bills");
      }
      
      if (data?.error) {
        console.error("API returned error:", data.error);
        
        // Check if API is down
        if (data.apiDown) {
          throw new Error("LegiScan API is currently unavailable");
        } else {
          throw new Error(data.error || "Failed to search bills");
        }
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
    } catch (fetchError) {
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error("Error in fetchBills:", error);
    
    // Create a more descriptive error that contains the original message
    const enhancedError = new Error(error.message || "Failed to search bills");
    
    // Add a flag to indicate API down if the message suggests connectivity issues
    if (error.message?.includes("timeout") || 
        error.message?.includes("timed out") ||
        error.message?.includes("Failed to send") ||
        error.message?.includes("Edge Function") ||
        error.message?.includes("unavailable")) {
      
      // @ts-ignore - Adding custom property
      enhancedError.apiDown = true;
    }
    
    throw enhancedError;
  }
}

// Simple cache for bill details
const billCache = new Map<string, { data: Bill; timestamp: number }>();

/**
 * Fetches a bill by ID - with improved state handling
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
      
      // Ensure the cached bill has state information
      if (!cached.data.state) {
        cached.data.state = 'IL'; // Always set state as IL for consistency
      }
      
      return cached.data;
    }
    
    console.log(`Fetching bill with ID: ${id} from LegiScan API (state: IL)`);
    const bill = await fetchBillFromLegiscan(id);
    
    if (!bill) {
      console.warn(`Bill ${id} not found`);
      return null;
    }
    
    // Ensure the bill has state information
    if (!bill.state) {
      bill.state = 'IL'; // Always set state as IL for consistency
    }
    
    // Cache the bill with state information
    billCache.set(id, { 
      data: { 
        ...bill,
        state: 'IL' // Always ensure state is IL
      }, 
      timestamp: Date.now() 
    });
    
    return bill;
  } catch (error) {
    console.error(`Error fetching bill ${id}:`, error);
    
    // Show user-friendly error message
    toast.error(`Bill information unavailable`, {
      description: "Unable to load bill information at this time. Please try again later."
    });
    
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
