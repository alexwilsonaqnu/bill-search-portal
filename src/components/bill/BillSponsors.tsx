
import { useEffect } from "react";
import { Users } from "lucide-react";
import { User } from "lucide-react";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";
import SponsorHoverCard from "./sponsors/SponsorHoverCard";
import { preloadLegislatorData, getSponsorName, getLegislatorId } from "@/services/legislator/simple";

interface BillSponsorsProps {
  bill: Bill;
}

const BillSponsors = ({ bill }: BillSponsorsProps) => {
  const sponsor = getSponsor(bill);
  const coSponsors = getCoSponsors(bill);

  // Log sponsor information for debugging
  useEffect(() => {
    console.log("BillSponsors component: bill ID:", bill.id);
    console.log("Primary sponsor:", sponsor);
    console.log("Co-sponsors:", coSponsors);
    
    if (sponsor) {
      const sponsorId = getLegislatorId(sponsor);
      console.log("Primary sponsor ID:", sponsorId);
      console.log("Primary sponsor name:", getSponsorName(sponsor));
    }
  }, [bill.id, sponsor, coSponsors]);

  // Preload sponsor data when the component mounts
  useEffect(() => {
    if (sponsor) {
      // Start with primary sponsor first
      console.log("Preloading primary sponsor data");
      preloadLegislatorData([sponsor]);
    }
    
    // Then preload co-sponsors (limited to first 5 to avoid too many requests)
    if (coSponsors.length > 0) {
      console.log(`Preloading ${Math.min(coSponsors.length, 5)} co-sponsor data`);
      preloadLegislatorData(coSponsors.slice(0, 5));
    }
  }, [bill.id, sponsor, coSponsors]);

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

  if (!sponsor && coSponsors.length === 0) {
    return <div className="text-gray-500 italic">No sponsor information available</div>;
  }

  return (
    <div className="space-y-3">
      {sponsor && (
        <div className="text-md text-gray-700">
          <div className="font-medium mb-1 flex items-center gap-1">
            <User className="h-4 w-4" />
            Primary Sponsor:
          </div>
          <div className="pl-4">
            <SponsorHoverCard 
              sponsorData={sponsor} 
              getSponsorName={getSponsorName} 
              legislatorId={getLegislatorId(sponsor)}
            />
          </div>
        </div>
      )}

      {coSponsors.length > 0 && (
        <div className="text-md text-gray-700">
          <div className="font-medium mb-1 flex items-center gap-1">
            <Users className="h-4 w-4" />
            Co-sponsors:
          </div>
          <div className="pl-4">
            {coSponsors.map((cosponsor, index) => (
              <div key={index} className="mb-1">
                <SponsorHoverCard 
                  sponsorData={cosponsor} 
                  getSponsorName={getSponsorName}
                  legislatorId={getLegislatorId(cosponsor)}
                />
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
