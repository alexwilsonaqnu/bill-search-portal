
import { useQuery } from "@tanstack/react-query";
import { Bill } from "@/types";
import { fetchBillById, fetchBillHistory, fetchBillVersions } from "@/services/legiscan";
import { toast } from "sonner";

interface UseBillDataProps {
  id: string | undefined;
  retryCount?: number; // Added to force refetch when retry is clicked
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
export function useBillData({ id, retryCount = 0 }: UseBillDataProps): UseBillDataResult {
  console.log(`useBillData hook received ID: ${id}, retryCount: ${retryCount}`);
  
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
    queryKey: ["bill", id, retryCount], // Include retryCount to force refetch
    queryFn: async () => {
      if (!id) throw new Error("Bill ID is required");
      console.log(`Fetching bill data for ID: ${id}`);
      
      try {
        const result = await fetchBillById(id);
        
        if (!result) {
          console.warn(`No bill found with ID: ${id}`);
          // Instead of throwing, return null so we can handle this in the UI
          return null;
        }
        
        return result;
      } catch (error) {
        // Add specific error handling
        console.error(`Error fetching bill data: ${error.message}`);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Fetch bill history separately
  const { 
    data: historyData,
    isLoading: isHistoryLoading
  } = useQuery({
    queryKey: ["bill-history", id, retryCount], // Include retryCount
    queryFn: async () => {
      if (!id) return [];
      return await fetchBillHistory(id);
    },
    enabled: !!id && !!billData,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Fetch bill versions separately
  const { 
    data: versionsData,
    isLoading: isVersionsLoading
  } = useQuery({
    queryKey: ["bill-versions", id, retryCount], // Include retryCount
    queryFn: async () => {
      if (!id) return [];
      return await fetchBillVersions(id);
    },
    enabled: !!id && !!billData,
    staleTime: 5 * 60 * 1000,
    retry: 1
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
