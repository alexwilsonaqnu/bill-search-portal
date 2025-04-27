
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
    enabled: !!legislatorName,
  });
};

