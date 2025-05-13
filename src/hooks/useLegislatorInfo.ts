
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
    staleTime: 30 * 60 * 1000, // Cache results for 30 minutes to reduce API calls (increased from 10 minutes)
    gcTime: 60 * 60 * 1000, // Keep unused query data for 1 hour
  });
};
