
import { useQuery } from "@tanstack/react-query";
import { fetchLegislatorInfo, fetchMultipleLegislators, LegislatorInfo } from "@/services/legislator";

// Use 'export type' instead of just 'export' for types when isolatedModules is enabled
export type { LegislatorInfo };

interface UseLegislatorInfoOptions {
  forceRefresh?: boolean;
}

export const useLegislatorInfo = (
  legislatorId?: string, 
  sponsorName?: string,
  options: UseLegislatorInfoOptions = {}
) => {
  console.log(`useLegislatorInfo hook called with ID: ${legislatorId || 'undefined'}, name: ${sponsorName || 'undefined'}, forceRefresh: ${options.forceRefresh || false}`);
  
  return useQuery({
    queryKey: ['legislator', legislatorId, sponsorName, options.forceRefresh],
    queryFn: () => {
      console.log(`useLegislatorInfo queryFn executing for ID: ${legislatorId || 'undefined'}, name: ${sponsorName || 'undefined'}, forceRefresh: ${options.forceRefresh || false}`);
      return fetchLegislatorInfo(legislatorId, sponsorName, options.forceRefresh);
    },
    enabled: !!(legislatorId || sponsorName),
    retry: 1, // Only retry once to avoid too many requests if API is rate limiting
    staleTime: 60 * 60 * 1000, // Cache results for 60 minutes (increased from 30)
    gcTime: 24 * 60 * 60 * 1000, // Keep unused query data for 24 hours (increased from 1 hour)
    // Disable automatic refetches to prevent unnecessary API calls
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

// Add a new hook for efficiently fetching multiple legislators at once
export const useBatchLegislatorInfo = (
  legislatorIds?: string[],
  options: UseLegislatorInfoOptions = {}
) => {
  return useQuery({
    queryKey: ['legislators-batch', legislatorIds, options.forceRefresh],
    queryFn: async () => {
      if (!legislatorIds || legislatorIds.length === 0) return [];
      
      // Create a unique set of IDs to avoid duplicates
      const uniqueIds = [...new Set(legislatorIds)];
      console.log(`useBatchLegislatorInfo fetching ${uniqueIds.length} unique legislator IDs, forceRefresh: ${options.forceRefresh || false}`);
      
      // Batch fetch through the service
      return await fetchMultipleLegislators(uniqueIds, options.forceRefresh);
    },
    enabled: !!(legislatorIds && legislatorIds.length > 0),
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
