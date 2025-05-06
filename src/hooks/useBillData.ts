
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { fetchBillById } from "@/services/billService";

interface UseBillDataProps {
  id: string | undefined;
  retryCount?: number;
}

interface UseBillDataResult {
  bill: Bill | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch bill data by ID
 */
export function useBillData({ id, retryCount = 0 }: UseBillDataProps): UseBillDataResult {
  console.log(`useBillData hook received ID: ${id}, retryCount: ${retryCount}`);
  
  const { 
    data: bill, 
    isLoading, 
    error, 
    isError 
  } = useQuery({
    queryKey: ["bill", id, retryCount], // Include retryCount to force refetch
    queryFn: async () => {
      if (!id) throw new Error("Bill ID is required");
      console.log(`Fetching bill data for ID: ${id}`);
      
      // Always attempt to fetch fresh data first
      try {
        const result = await fetchBillById(id);
        
        if (!result) {
          console.warn(`No bill found with ID: ${id}`);
          
          // If no result, check local cache before giving up
          const cachedBill = localStorage.getItem(`bill_${id}`);
          if (cachedBill) {
            const parsedBill = JSON.parse(cachedBill);
            console.log(`Using cached bill data for ID: ${id}`);
            return parsedBill;
          }
          
          return null;
        }
        
        // Cache the result
        try {
          localStorage.setItem(`bill_${id}`, JSON.stringify(result));
        } catch (storageError) {
          console.warn(`Failed to cache bill: ${storageError.message}`);
        }
        
        return result;
      } catch (error) {
        console.error(`Error fetching bill data: ${error.message}`);
        
        // If API fetch fails, check local cache
        try {
          const cachedBill = localStorage.getItem(`bill_${id}`);
          if (cachedBill) {
            const parsedBill = JSON.parse(cachedBill);
            console.log(`Using cached bill data for ID: ${id} after fetch failure`);
            return parsedBill;
          }
        } catch (cacheError) {
          console.warn(`Failed to retrieve bill from cache: ${cacheError.message}`);
        }
        
        throw error;
      }
    },
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  return {
    bill,
    isLoading,
    isError,
    error: error as Error | null
  };
}
