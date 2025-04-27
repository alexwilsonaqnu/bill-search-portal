
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
}

interface LegislatorLookupParams {
  legislatorId?: string;
  name?: string;
}

export const useLegislatorInfo = (identifier: string | LegislatorLookupParams) => {
  const { toast } = useToast();
  
  // Process input to determine whether we have an ID or name
  let legislatorId: string | undefined;
  let name: string | undefined;
  
  if (typeof identifier === 'string') {
    legislatorId = identifier;
  } else {
    legislatorId = identifier?.legislatorId;
    name = identifier?.name;
  }

  const hasIdentifier = !!legislatorId || !!name;
  const queryKey = legislatorId ? ['legislator', 'id', legislatorId] : ['legislator', 'name', name];
  
  return useQuery({
    queryKey: queryKey,
    queryFn: async (): Promise<LegislatorInfo | null> => {
      try {
        if (legislatorId) {
          console.log(`Fetching legislator info for ID: ${legislatorId}`);
        } else if (name) {
          console.log(`Fetching legislator info for name: ${name}`);
        } else {
          console.warn("Missing legislator identifier");
          return null;
        }
        
        const { data, error } = await supabase.functions.invoke('get-legislator', {
          body: { legislatorId, name }
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
    enabled: hasIdentifier,
  });
};
