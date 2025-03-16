
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { fetchBillById } from "@/services/billService";
import { normalizeBillId } from "@/utils/billTransformUtils";
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
  const normalizedId = id ? normalizeBillId(id) : "";
  
  const { 
    data: bill, 
    isLoading, 
    error, 
    isError 
  } = useQuery({
    queryKey: ["bill", normalizedId],
    queryFn: () => fetchBillById(normalizedId),
    enabled: !!normalizedId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Silent handling of specific errors for demo purposes
    meta: {
      onSettled: (_data: any, err: any) => {
        if (err) {
          console.error("Bill fetch error:", err);
        }
      }
    }
  });

  return {
    bill: bill || null,
    isLoading,
    isError: isError && !bill, // Only consider it an error if we don't have fallback data
    error: error as Error | null
  };
}
