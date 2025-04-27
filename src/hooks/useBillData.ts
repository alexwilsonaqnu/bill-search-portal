
import { useQuery } from "@tanstack/react-query";
import { Bill, Change } from "@/types";
import { fetchBillById, fetchBillHistory } from "@/services/billService";
import { toast } from "sonner";

interface UseBillDataProps {
  id: string | undefined;
}

interface UseBillDataResult {
  bill: Bill | null;
  billHistory: Change[];
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
  
  // Try to find alternative ID in local cache
  let lookupId = id;
  try {
    const cacheData = localStorage.getItem('billIdCache');
    if (cacheData && id) {
      const billCache = JSON.parse(cacheData);
      
      // If this ID is in the cache and has a different original ID, use that instead
      if (billCache[id] && billCache[id].isAlternate) {
        lookupId = billCache[id].id;
        console.log(`Using original bill ID ${lookupId} from cache instead of ${id}`);
      }
    }
  } catch (e) {
    console.warn("Error checking bill cache:", e);
  }
  
  const { 
    data: bill, 
    isLoading: isBillLoading, 
    error: billError, 
    isError: isBillError 
  } = useQuery({
    queryKey: ["bill", lookupId],
    queryFn: async () => {
      if (!lookupId) throw new Error("Bill ID is required");
      console.log(`Fetching bill data for ID: ${lookupId}`);
      const result = await fetchBillById(lookupId);
      
      if (!result) {
        console.warn(`No bill found with ID: ${lookupId}`);
        // Instead of throwing, return null so we can handle this in the UI
        return null;
      }
      
      return result;
    },
    enabled: !!lookupId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Add a new query for bill history
  const {
    data: billHistory = [],
    isLoading: isHistoryLoading,
    error: historyError,
    isError: isHistoryError
  } = useQuery({
    queryKey: ["billHistory", id],
    queryFn: async () => {
      if (!id) return [];
      console.log(`Fetching bill history for ID: ${id}`);
      const history = await fetchBillHistory(id);
      console.log(`Fetched bill history for ${id}:`, history);
      return history;
    },
    enabled: !!id,
    retry: 1
  });

  // Merge the bill history data with the bill data
  const mergedBill = bill ? {
    ...bill,
    changes: billHistory.length > 0 ? billHistory : bill.changes || []
  } : null;

  // Log merged bill data
  if (mergedBill) {
    console.log("Merged bill data with history:", {
      id: mergedBill.id,
      historyLength: mergedBill.changes?.length || 0
    });
  }

  // Determine overall loading and error state
  const isLoading = isBillLoading || isHistoryLoading;
  const isError = isBillError || isHistoryError;
  const error = billError || historyError;

  return {
    bill: mergedBill,
    billHistory,
    isLoading,
    isError,
    error: error as Error | null
  };
}
