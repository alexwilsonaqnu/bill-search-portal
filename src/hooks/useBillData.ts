
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
      
      try {
        const result = await fetchBillById(id);
        
        if (!result) {
          console.warn(`No bill found with ID: ${id}`);
          return null;
        }
        
        return result;
      } catch (error) {
        console.error(`Error fetching bill data: ${error.message}`);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
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
