
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
}

export const useLegislatorInfo = (legislatorId: string) => {
  return useQuery({
    queryKey: ['legislator', legislatorId],
    queryFn: async (): Promise<LegislatorInfo | null> => {
      try {
        const { data, error } = await supabase.functions.invoke('get-legislator', {
          body: { legislatorId }
        });
        
        if (error) {
          console.error("Error fetching legislator info:", error);
          return null;
        }
        
        return data;
      } catch (error) {
        console.error("Error in fetchLegislatorInfo:", error);
        return null;
      }
    },
    enabled: !!legislatorId,
  });
};
