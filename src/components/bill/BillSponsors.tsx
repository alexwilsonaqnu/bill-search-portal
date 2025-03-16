
import { Users } from "lucide-react";
import { Bill } from "@/types";
import { getSponsor, getCoSponsors } from "@/utils/billCardUtils";

interface BillSponsorsProps {
  bill: Bill;
}

const BillSponsors = ({ bill }: BillSponsorsProps) => {
  const sponsor = getSponsor(bill);
  const coSponsors = getCoSponsors(bill);
  
  return (
    <>
      {sponsor && (
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <span className="mr-2">Sponsor:</span>
          <span className="font-medium">{sponsor}</span>
        </div>
      )}
      
      {coSponsors.length > 0 && (
        <div className="flex items-center text-xs text-gray-600 mb-3">
          <span className="mr-2 flex items-center gap-1">
            <Users className="h-3 w-3" /> Co-sponsors:
          </span>
          <span className="font-medium">
            {coSponsors.join(", ")}
            {bill.data?.cosponsors?.length > 3 && ` +${bill.data.cosponsors.length - 3} more`}
          </span>
        </div>
      )}
    </>
  );
};

export default BillSponsors;
