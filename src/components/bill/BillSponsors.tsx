import { Users } from "lucide-react";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BillSponsorsProps {
  bill: Bill;
}

interface LegislatorInfo {
  party: string;
  email: string[];
  phone: string[];
}

const BillSponsors = ({ bill }: BillSponsorsProps) => {
  const sponsor = getSponsor(bill);
  const coSponsors = getCoSponsors(bill);

  const fetchLegislatorInfo = async (legislatorId: string): Promise<LegislatorInfo | null> => {
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
  };

  const getSponsorName = (sponsorData: any): string => {
    if (typeof sponsorData === 'string') return sponsorData;
    if (!sponsorData) return 'Unknown';
    
    if (sponsorData.message && sponsorData.message.includes("Circular")) {
      const path = sponsorData.message.replace("[Circular Reference to ", "").replace("]", "");
      if (path === "root.sponsor" && bill.data?.sponsor) {
        return getSponsorName(bill.data.sponsor);
      }
      return "Referenced Sponsor";
    }
    
    if (typeof sponsorData.name === 'string') return sponsorData.name;
    if (typeof sponsorData.full_name === 'string') return sponsorData.full_name;
    
    const nameParts = [];
    if (sponsorData.first_name) nameParts.push(sponsorData.first_name);
    if (sponsorData.middle_name) nameParts.push(sponsorData.middle_name);
    if (sponsorData.last_name) nameParts.push(sponsorData.last_name);
    
    if (nameParts.length > 0) {
      const fullName = nameParts.join(' ');
      if (sponsorData.suffix) return `${fullName}, ${sponsorData.suffix}`;
      return fullName;
    }
    
    let displayName = 'Unknown';
    if (sponsorData.role) {
      displayName = `${sponsorData.role}.`;
      if (sponsorData.party) displayName += ` (${sponsorData.party})`;
    } else if (sponsorData.title) {
      displayName = sponsorData.title;
    }
    
    return displayName;
  };

  const hasMoreCosponsors = () => {
    if (!bill.data) return false;
    if (!bill.data.cosponsors) return false;
    
    const cosponsorCount = Array.isArray(bill.data.cosponsors) ? bill.data.cosponsors.length : 
                          (Array.isArray(bill.data.sponsors?.cosponsors) ? bill.data.sponsors.cosponsors.length : 0);
    
    return cosponsorCount > coSponsors.length;
  };

  const getTotalCosponsorCount = () => {
    if (!bill.data) return 0;
    
    if (Array.isArray(bill.data.cosponsors)) {
      return bill.data.cosponsors.length;
    } else if (Array.isArray(bill.data.sponsors?.cosponsors)) {
      return bill.data.sponsors.cosponsors.length;
    } else if (Array.isArray(bill.data.co_sponsors)) {
      return bill.data.co_sponsors.length;
    } else if (Array.isArray(bill.data.coSponsors)) {
      return bill.data.coSponsors.length;
    } else if (Array.isArray(bill.data.sponsors) && bill.data.sponsors.length > 1) {
      return bill.data.sponsors.length - 1;
    }
    
    return 0;
  };

  const SponsorHoverCard = ({ sponsorData }: { sponsorData: any }) => {
    const legislatorId = sponsorData.people_id || sponsorData.id;
    const { data: legislatorInfo } = useQuery({
      queryKey: ['legislator', legislatorId],
      queryFn: () => fetchLegislatorInfo(legislatorId),
      enabled: !!legislatorId,
    });

    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-pointer hover:text-blue-600 transition-colors">
          {getSponsorName(sponsorData)}
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{getSponsorName(sponsorData)}</h4>
            {legislatorInfo && (
              <>
                <p className="text-sm text-gray-600">
                  Party Affiliation: {legislatorInfo.party}
                </p>
                {legislatorInfo.email.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium">Email:</div>
                    {legislatorInfo.email.map((email, i) => (
                      <a 
                        key={i} 
                        href={`mailto:${email}`}
                        className="text-blue-600 hover:underline block"
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                )}
                {legislatorInfo.phone.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium">Phone:</div>
                    {legislatorInfo.phone.map((phone, i) => (
                      <a 
                        key={i} 
                        href={`tel:${phone}`}
                        className="text-blue-600 hover:underline block"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  if (!sponsor && coSponsors.length === 0) {
    return <div className="text-gray-500 italic">No sponsor information available</div>;
  }

  return (
    <div className="space-y-3">
      {sponsor && (
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-1">Primary Sponsor:</div>
          <div className="pl-4">
            <SponsorHoverCard sponsorData={sponsor} />
          </div>
        </div>
      )}

      {coSponsors.length > 0 && (
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-1 flex items-center gap-1">
            <Users className="h-4 w-4" />
            Co-sponsors:
          </div>
          <div className="pl-4">
            {coSponsors.map((cosponsor, index) => (
              <div key={index}>
                <SponsorHoverCard sponsorData={cosponsor} />
              </div>
            ))}
            {hasMoreCosponsors() && (
              <div className="text-gray-500 mt-1">
                +{getTotalCosponsorCount() - coSponsors.length} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillSponsors;
