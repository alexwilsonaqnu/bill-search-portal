
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
  const isNumericId = id && /^\d+$/.test(id);
  if (isNumericId) {
    console.log(`Numeric bill ID detected: ${id}`);
  }
  
  const { 
    data: bill, 
    isLoading, 
    error, 
    isError 
  } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => fetchBillById(id || ""),
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    meta: {
      onSettled: (_data: any, err: any) => {
        if (err) {
          console.error("Bill fetch error:", err);
          toast.error(`Failed to load bill ${id}: ${err.message}`);
        } else if (_data) {
          console.log(`Successfully loaded bill: ${id}`, { 
            returnedId: _data?.id,
            hasData: !!_data?.data
          });
        } else {
          console.warn(`No bill data returned for ID: ${id}`);
        }
      }
    }
  });

  // Additional logging when bill data changes
  if (bill && !isLoading) {
    console.log(`Bill data for ${id}:`, {
      id: bill.id,
      title: bill.title?.substring(0, 30) + "...",
      dataPresent: !!bill.data
    });
  }

  return {
    bill: bill || null,
    isLoading,
    isError,
    error: error as Error | null
  };
}
