
import { useQuery } from "@tanstack/react-query";
import { fetchLegislatorInfo, LegislatorInfo } from "@/services/legislator";

// Use 'export type' instead of just 'export' for types when isolatedModules is enabled
export type { LegislatorInfo };

export const useLegislatorInfo = (legislatorId?: string, sponsorName?: string) => {
  return useQuery({
    queryKey: ['legislator', legislatorId, sponsorName],
    queryFn: () => fetchLegislatorInfo(legislatorId, sponsorName),
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
export const useBatchLegislatorInfo = (legislatorIds?: string[]) => {
  return useQuery({
    queryKey: ['legislators-batch', legislatorIds],
    queryFn: async () => {
      if (!legislatorIds || legislatorIds.length === 0) return [];
      
      // Create a unique set of IDs to avoid duplicates
      const uniqueIds = [...new Set(legislatorIds)];
      
      // Batch fetch through the service
      const legislators = await Promise.all(
        uniqueIds.map(id => fetchLegislatorInfo(id, undefined))
      );
      
      // Return only valid results (filter out nulls)
      return legislators.filter(Boolean);
    },
    enabled: !!(legislatorIds && legislatorIds.length > 0),
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
