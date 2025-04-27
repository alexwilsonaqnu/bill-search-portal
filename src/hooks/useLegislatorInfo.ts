
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
}

export const useLegislatorInfo = (legislatorId: string) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['legislator', legislatorId],
    queryFn: async (): Promise<LegislatorInfo | null> => {
      try {
        console.log(`Fetching legislator info for ID: ${legislatorId}`);
        
        const { data, error } = await supabase.functions.invoke('get-legislator', {
          body: { legislatorId }
        });
        
        if (error) {
          console.error("Error fetching legislator info:", error);
          toast({
            title: "Error",
            description: "Could not load legislator contact information",
            variant: "destructive"
          });
          return null;
        }
        
        console.log("Legislator data received:", data);
        
        // Validate that we have the expected data format
        if (!data || (typeof data !== 'object')) {
          console.error("Invalid legislator data format:", data);
          return null;
        }
        
        return {
          party: data.party || 'Unknown',
          email: Array.isArray(data.email) ? data.email : [],
          phone: Array.isArray(data.phone) ? data.phone : []
        };
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
    enabled: !!legislatorId,
  });
};
