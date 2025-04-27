
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
    
    return 'Unknown';
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
            {bill.data?.cosponsors?.length > coSponsors.length && (
              <div className="text-gray-500 mt-1">
                +{bill.data.cosponsors.length - coSponsors.length} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillSponsors;
