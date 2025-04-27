
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { fetchBillById, fetchBillHistory, fetchBillVersions } from "@/services/legiscanService";
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
 * Custom hook to fetch bill data by ID from LegiScan API
 */
export function useBillData({ id }: UseBillDataProps): UseBillDataResult {
  console.log(`useBillData hook received ID: ${id}`);
  
  // Determine if it's a numeric ID for better logging and handling
  const isNumeric = id && /^\d+$/.test(id);
  if (isNumeric) {
    console.log(`Numeric bill ID detected: ${id}`);
  }
  
  const { 
    data: billData, 
    isLoading: isBillLoading, 
    error: billError, 
    isError: isBillError 
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

  // Fetch bill history separately
  const { 
    data: historyData,
    isLoading: isHistoryLoading
  } = useQuery({
    queryKey: ["bill-history", id],
    queryFn: async () => {
      if (!id) return [];
      return await fetchBillHistory(id);
    },
    enabled: !!id && !!billData,
    staleTime: 5 * 60 * 1000
  });

  // Fetch bill versions separately
  const { 
    data: versionsData,
    isLoading: isVersionsLoading
  } = useQuery({
    queryKey: ["bill-versions", id],
    queryFn: async () => {
      if (!id) return [];
      return await fetchBillVersions(id);
    },
    enabled: !!id && !!billData,
    staleTime: 5 * 60 * 1000
  });

  // Combine bill data with history and versions
  const combinedBill = billData ? {
    ...billData,
    changes: historyData && historyData.length > 0 ? historyData : billData.changes,
    versions: versionsData && versionsData.length > 0 ? versionsData : billData.versions
  } : null;

  // Additional logging when bill data changes
  if (combinedBill && !isBillLoading) {
    console.log(`Bill data for ${id}:`, {
      id: combinedBill.id,
      title: combinedBill.title?.substring(0, 30) + "...",
      hasChanges: combinedBill.changes?.length || 0,
      hasVersions: combinedBill.versions?.length || 0
    });
  } else if (!combinedBill && !isBillLoading && !isBillError) {
    console.warn(`No bill data returned for ID: ${id}`);
  }

  const isLoading = isBillLoading || isHistoryLoading || isVersionsLoading;

  return {
    bill: combinedBill,
    isLoading,
    isError: isBillError,
    error: billError as Error | null
  };
}
