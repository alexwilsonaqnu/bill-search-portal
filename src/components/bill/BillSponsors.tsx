
import { Users } from "lucide-react";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";
import SponsorHoverCard from "./sponsors/SponsorHoverCard";

interface BillSponsorsProps {
  bill: Bill;
}

const BillSponsors = ({ bill }: BillSponsorsProps) => {
  const sponsor = getSponsor(bill);
  const coSponsors = getCoSponsors(bill);

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

  if (!sponsor && coSponsors.length === 0) {
    return <div className="text-gray-500 italic">No sponsor information available</div>;
  }

  return (
    <div className="space-y-3">
      {sponsor && (
        <div className="text-md text-gray-700">
          <div className="font-medium mb-1">Primary Sponsor:</div>
          <div className="pl-4">
            <SponsorHoverCard sponsorData={sponsor} getSponsorName={getSponsorName} />
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
              <div key={index}>
                <SponsorHoverCard sponsorData={cosponsor} getSponsorName={getSponsorName} />
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
