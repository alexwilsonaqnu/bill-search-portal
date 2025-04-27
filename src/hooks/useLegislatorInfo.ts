
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface Office {
  type: string;
  address: string;
  phone: string | null;
  email: string | null;
}

interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
  offices?: Office[];
}

export const useLegislatorInfo = (legislatorId: string) => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['legislator', legislatorId],
    queryFn: async (): Promise<LegislatorInfo | null> => {
      try {
        console.log(`Fetching legislator info for ID: ${legislatorId}`);
        
        if (!legislatorId) {
          console.warn("Missing legislator ID");
          return null;
        }
        
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

        const extractContactInfo = (legislator: any): { emails: string[], phones: string[] } => {
          const emails: string[] = [];
          const phones: string[] = [];
          
          // Extract direct email and phone if available
          if (legislator.email && typeof legislator.email === 'string' && legislator.email.trim()) {
            emails.push(legislator.email.trim());
          }
          if (legislator.phone && typeof legislator.phone === 'string' && legislator.phone.trim()) {
            phones.push(legislator.phone.trim());
          }
          
          // Extract from offices array
          if (legislator.offices && Array.isArray(legislator.offices)) {
            legislator.offices.forEach((office: any) => {
              if (office.email && typeof office.email === 'string' && office.email.trim()) {
                const email = office.email.trim();
                if (!emails.includes(email)) {
                  emails.push(email);
                }
              }
              if (office.phone && typeof office.phone === 'string' && office.phone.trim()) {
                const phone = office.phone.trim();
                if (!phones.includes(phone)) {
                  phones.push(phone);
                }
              }
            });
          }
          
          return { emails, phones };
        };

        const contactInfo = extractContactInfo(data);
        
        return {
          party: data.party || 'Unknown',
          email: contactInfo.emails,
          phone: contactInfo.phones,
          offices: data.offices || []
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

