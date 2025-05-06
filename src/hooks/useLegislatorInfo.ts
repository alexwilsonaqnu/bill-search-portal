
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

export interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
  district: string;
  role: string;
  name: LegislatorName;
  office?: string;
  state?: string;
}

export const useLegislatorInfo = (legislatorId: string, sponsorName?: string) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['legislator', legislatorId, sponsorName],
    queryFn: async (): Promise<LegislatorInfo | null> => {
      try {
        console.log(`Fetching legislator info for ID: ${legislatorId}, Name: ${sponsorName || 'N/A'}`);
        
        if (!legislatorId && !sponsorName) {
          console.warn("Missing both legislator ID and name");
          return null;
        }
        
        const { data, error } = await supabase.functions.invoke('get-legislator', {
          body: { legislatorId, sponsorName }
        });
        
        if (error) {
          console.error("Error fetching legislator info:", error);
          throw new Error(error.message || "Failed to load legislator information");
        }
        
        console.log("Legislator data received:", data);
        
        // Validate that we have the expected data format
        if (!data || typeof data !== 'object') {
          console.error("Invalid legislator data format:", data);
          return null;
        }

        // Ensure email and phone are arrays
        const legislatorInfo: LegislatorInfo = {
          ...data as LegislatorInfo,
          email: Array.isArray(data.email) ? data.email : data.email ? [data.email] : [],
          phone: Array.isArray(data.phone) ? data.phone : data.phone ? [data.phone] : []
        };

        return legislatorInfo;

      } catch (error) {
        console.error("Error in fetchLegislatorInfo:", error);
        throw error; // Let React Query handle the error state
      }
    },
    enabled: !!(legislatorId || sponsorName),
    retry: 1, // Only retry once to avoid too many requests if API is rate limiting
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
  });
};
