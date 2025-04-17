
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { fetchBillById } from "@/services/billService";
import { toast } from "sonner";

interface UseBillDataProps {
  id: string | undefined;
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
export function useBillData({ id }: UseBillDataProps): UseBillDataResult {
  console.log(`useBillData hook received ID: ${id}`);
  
  // Determine if it's a numeric ID for better logging and handling
  const isNumeric = id && /^\d+$/.test(id);
  if (isNumeric) {
    console.log(`Numeric bill ID detected: ${id}`);
  }
  
  const { 
    data: bill, 
    isLoading, 
    error, 
    isError 
  } = useQuery({
    queryKey: ["bill", id],
    queryFn: async () => {
      if (!id) throw new Error("Bill ID is required");
      console.log(`Fetching bill data for ID: ${id}`);
      const result = await fetchBillById(id);
      
      if (!result) {
        console.warn(`No bill found with ID: ${id}`);
        // Instead of throwing, return null so we can handle this in the UI
        return null;
      }
      
      return result;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Additional logging when bill data changes
  if (bill && !isLoading) {
    console.log(`Bill data for ${id}:`, {
      id: bill.id,
      title: bill.title?.substring(0, 30) + "...",
      dataPresent: !!bill.data
    });
  } else if (!bill && !isLoading && !isError) {
    console.warn(`No bill data returned for ID: ${id}`);
  }

  return {
    bill: bill || null,
    isLoading,
    isError,
    error: error as Error | null
  };
}
