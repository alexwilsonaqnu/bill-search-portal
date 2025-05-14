
import { useQuery } from "@tanstack/react-query";
import { LegislatorInfo, LegislatorSearchOptions } from "@/services/legislator/simple/types";
import { fetchLegislator, fetchMultipleLegislators } from "@/services/legislator/simple/api";

export type { LegislatorInfo };

/**
 * Hook for fetching a single legislator by ID or name
 */
export function useLegislator(
  legislatorId?: string,
  sponsorName?: string,
  options: LegislatorSearchOptions = {}
) {
  return useQuery({
    queryKey: ['legislator-simple', legislatorId, sponsorName, options.forceRefresh],
    queryFn: () => fetchLegislator(legislatorId, sponsorName, options),
    enabled: !!(legislatorId || sponsorName),
    retry: 1,
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for fetching multiple legislators by ID
 */
export function useBatchLegislators(
  legislatorIds?: string[],
  options: LegislatorSearchOptions = {}
) {
  return useQuery({
    queryKey: ['legislators-batch-simple', legislatorIds, options.forceRefresh],
    queryFn: async () => {
      if (!legislatorIds || legislatorIds.length === 0) return [];
      const uniqueIds = [...new Set(legislatorIds)];
      return await fetchMultipleLegislators(uniqueIds, options);
    },
    enabled: !!(legislatorIds && legislatorIds.length > 0),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
