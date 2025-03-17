
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
  // The ID should already be normalized by BillFetchWrapper, but normalize it again to be safe
  const normalizedId = id ? normalizeBillId(id) : "";
  console.log(`useBillData hook received ID: ${id}, normalized: ${normalizedId}`);
  
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
    meta: {
      onSettled: (_data: any, err: any) => {
        if (err) {
          console.error("Bill fetch error:", err);
          toast.error(`Failed to load bill ${normalizedId}: ${err.message}`);
        } else {
          console.log(`Successfully loaded bill: ${normalizedId}`);
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
