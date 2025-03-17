
import { Users } from "lucide-react";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";

interface BillSponsorsProps {
  bill: Bill;
}

const BillSponsors = ({ bill }: BillSponsorsProps) => {
  const sponsor = getSponsor(bill);
  const coSponsors = getCoSponsors(bill);
  
  if (!sponsor && coSponsors.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-1">
      {sponsor && (
        <div className="flex items-center text-sm text-gray-700">
          <span className="mr-2">Sponsor:</span>
          <span className="font-medium">{sponsor}</span>
        </div>
      )}
      
      {coSponsors.length > 0 && (
        <div className="flex items-center text-sm text-gray-700">
          <span className="mr-2 flex items-center gap-1">
            <Users className="h-4 w-4" /> Co-sponsors:
          </span>
          <span className="font-medium">
            {coSponsors.join(", ")}
            {bill.data?.cosponsors?.length > 3 && ` +${bill.data.cosponsors.length - 3} more`}
          </span>
        </div>
      )}
    </div>
  );
};

export default BillSponsors;
