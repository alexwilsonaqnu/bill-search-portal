
import { Users } from "lucide-react";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";

interface BillSponsorsProps {
  bill: Bill;
}

const BillSponsors = ({ bill }: BillSponsorsProps) => {
  const sponsor = getSponsor(bill);
  const coSponsors = getCoSponsors(bill);
  
  // Debug log to see what data we're working with
  console.log("BillSponsors component data:", { 
    bill_id: bill.id,
    sponsor, 
    coSponsors,
    rawData: bill.data 
  });
  
  // Don't render anything if there are no sponsors
  if (!sponsor && coSponsors.length === 0) {
    return <div className="text-gray-500 italic">No sponsor information available</div>;
  }
  
  // Function to extract name from sponsor object
  const getSponsorName = (sponsorData: any): string => {
    if (typeof sponsorData === 'string') return sponsorData;
    if (!sponsorData) return 'Unknown';
    
    // Check if this is a circular reference message
    if (sponsorData.message && sponsorData.message.includes("Circular")) {
      // Extract the path from the circular reference
      const path = sponsorData.message.replace("[Circular Reference to ", "").replace("]", "");
      
      // If it's pointing to root.sponsor, use the sponsor data directly
      if (path === "root.sponsor" && bill.data?.sponsor) {
        return getSponsorName(bill.data.sponsor);
      }
      
      return "Referenced Sponsor";
    }
    
    // Check for name field first
    if (typeof sponsorData.name === 'string') return sponsorData.name;
    if (typeof sponsorData.full_name === 'string') return sponsorData.full_name;
    
    // Try to construct name from parts
    const nameParts = [];
    if (sponsorData.first_name) nameParts.push(sponsorData.first_name);
    if (sponsorData.middle_name) nameParts.push(sponsorData.middle_name);
    if (sponsorData.last_name) nameParts.push(sponsorData.last_name);
    
    // If we have name parts, join them
    if (nameParts.length > 0) {
      const fullName = nameParts.join(' ');
      if (sponsorData.suffix) return `${fullName}, ${sponsorData.suffix}`;
      return fullName;
    }
    
    // If we have a title or role, add that to the display
    let displayName = 'Unknown';
    if (sponsorData.role) {
      displayName = `${sponsorData.role}.`;
      if (sponsorData.party) displayName += ` (${sponsorData.party})`;
    } else if (sponsorData.title) {
      displayName = sponsorData.title;
    }
    
    return displayName;
  };
  
  // Function to check if there are more cosponsors than we're showing
  const hasMoreCosponsors = () => {
    if (!bill.data) return false;
    if (!bill.data.cosponsors) return false;
    
    // Check all possible places where more co-sponsor count could be found
    const cosponsorCount = Array.isArray(bill.data.cosponsors) ? bill.data.cosponsors.length : 
                          (Array.isArray(bill.data.sponsors?.cosponsors) ? bill.data.sponsors.cosponsors.length : 0);
    
    return cosponsorCount > coSponsors.length;
  };
  
  // Function to get the count of total co-sponsors
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
      // First one is primary sponsor, rest are co-sponsors
      return bill.data.sponsors.length - 1;
    }
    
    return 0;
  };
  
  return (
    <div className="space-y-3">
      {sponsor && (
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-1">Primary Sponsor:</div>
          <div className="pl-4">{getSponsorName(sponsor)}</div>
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
              <div key={index}>{getSponsorName(cosponsor)}</div>
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
