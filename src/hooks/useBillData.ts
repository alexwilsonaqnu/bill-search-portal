
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { fetchBillById } from "@/services/billService";
import { normalizeBillId } from "@/utils/billTransformUtils";

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
  });

  if (error) {
    console.error("Bill fetch error:", error);
  }

  return {
    bill: bill || null,
    isLoading,
    isError,
    error: error as Error | null
  };
}
