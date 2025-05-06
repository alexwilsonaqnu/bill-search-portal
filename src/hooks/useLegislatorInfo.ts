
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
          toast({
            title: "Error",
            description: "Could not load legislator information",
            variant: "destructive"
          });
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
        toast({
          title: "Error",
          description: "Failed to load legislator information",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!(legislatorId || sponsorName),
  });
};
