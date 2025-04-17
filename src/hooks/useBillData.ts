
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
  // Don't normalize the ID here, pass it as-is to the service
  console.log(`useBillData hook received ID: ${id}`);
  
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
        } else {
          console.log(`Successfully loaded bill: ${id}`);
        }
      }
    }
  });

  return {
    bill: bill || null,
    isLoading,
    isError,
    error: error as Error | null
  };
}
