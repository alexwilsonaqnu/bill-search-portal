
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface LegislatorName {
  first: string;
  middle: string;
  last: string;
  suffix: string;
  full: string;
}

interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
  district: string;
  role: string;
  name: LegislatorName;
}

export const useLegislatorInfo = (legislatorName: string) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['legislator', legislatorName],
    queryFn: async (): Promise<LegislatorInfo | null> => {
      try {
        console.log(`Fetching legislator info for name: ${legislatorName}`);
        
        if (!legislatorName) {
          console.warn("Missing legislator name");
          return null;
        }
        
        const { data, error } = await supabase.functions.invoke('get-legislator', {
          body: { legislatorName }
        });
        
        if (error) {
          console.error("Error fetching legislator info:", error);
          
          // Don't show toast for rate limit errors to avoid overwhelming the user
          if (!error.message?.includes("429")) {
            toast({
              title: "Information Notice",
              description: "Legislator details temporarily unavailable",
              variant: "default"
            });
          }
          return null;
        }
        
        console.log("Legislator data received:", data);
        
        // Validate that we have the expected data format
        if (!data || typeof data !== 'object') {
          console.error("Invalid legislator data format:", data);
          return null;
        }

        return data as LegislatorInfo;

      } catch (error) {
        console.error("Error in fetchLegislatorInfo:", error);
        
        // Don't show destructive toast for expected errors
        toast({
          title: "Information Notice",
          description: "Legislator information temporarily unavailable",
          variant: "default"
        });
        return null;
      }
    },
    enabled: !!legislatorName,
    retry: (failureCount, error: any) => {
      // Don't retry on 429 rate limit errors
      if (error?.message?.includes('429')) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep unused data for 1 day
  });
};
