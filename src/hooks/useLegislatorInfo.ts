
import { useQuery } from "@tanstack/react-query";
import { fetchLegislatorInfo } from "@/services/legislatorService";

// Re-export the type using the correct TypeScript syntax
export type { LegislatorInfo } from "@/services/legislatorService";

export const useLegislatorInfo = (legislatorId?: string, sponsorName?: string) => {
  return useQuery({
    queryKey: ['legislator', legislatorId, sponsorName],
    queryFn: () => fetchLegislatorInfo(legislatorId, sponsorName),
    enabled: !!(legislatorId || sponsorName),
    retry: 1, // Only retry once to avoid too many requests if API is rate limiting
    staleTime: 10 * 60 * 1000, // Cache results for 10 minutes to reduce API calls
    gcTime: 60 * 60 * 1000, // Keep unused query data for 1 hour
  });
};
