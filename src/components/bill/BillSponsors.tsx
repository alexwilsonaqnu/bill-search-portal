
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
  console.log("BillSponsors component data:", { sponsor, coSponsors });
  
  // Don't render anything if there are no sponsors
  if (!sponsor && coSponsors.length === 0) {
    return null;
  }
  
  // Function to extract name from sponsor object
  const getSponsorName = (sponsorData: any): string => {
    if (typeof sponsorData === 'string') return sponsorData;
    if (!sponsorData) return 'Unknown';
    
    // Check different possible name fields
    if (sponsorData.name) return sponsorData.name;
    if (sponsorData.full_name) return sponsorData.full_name;
    
    // Try to construct name from parts
    const nameParts = [];
    if (sponsorData.first_name) nameParts.push(sponsorData.first_name);
    if (sponsorData.middle_name) nameParts.push(sponsorData.middle_name);
    if (sponsorData.last_name) nameParts.push(sponsorData.last_name);
    
    return nameParts.length > 0 ? nameParts.join(' ') : 'Unknown';
  };
  
  return (
    <div className="space-y-1">
      {sponsor && (
        <div className="flex items-center text-sm text-gray-700">
          <span className="mr-2">Sponsor:</span>
          <span className="font-medium">
            {getSponsorName(sponsor)}
          </span>
        </div>
      )}
      
      {coSponsors.length > 0 && (
        <div className="flex items-center text-sm text-gray-700">
          <span className="mr-2 flex items-center gap-1">
            <Users className="h-4 w-4" /> Co-sponsors:
          </span>
          <span className="font-medium">
            {coSponsors.map((cosponsor, index) => (
              (index > 0 ? ', ' : '') + getSponsorName(cosponsor)
            ))}
            {bill.data?.cosponsors?.length > 3 && ` +${bill.data.cosponsors.length - 3} more`}
          </span>
        </div>
      )}
    </div>
  );
};

export default BillSponsors;
