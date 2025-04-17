
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bill } from "@/types";
import { getTags } from "@/utils/billCardUtils";

interface BillFooterProps {
  bill: Bill;
}

const BillFooter = ({ bill }: BillFooterProps) => {
  const tags = getTags(bill);
  
  // Ensure we have a valid ID for the link
  const billId = bill.id || '';
  
  // Add logging to help debug bill ID issues
  const handleViewDetails = () => {
    console.log(`Viewing bill details for ID: ${billId}`, {
      billData: {
        id: billId,
        title: bill.title?.substring(0, 30) + "...",
        hasData: !!bill.data
      }
    });
  };
  
  return (
    <div className="flex items-center justify-between flex-wrap gap-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" /> {tag}
          </Badge>
        ))}
      </div>
      
      <Link to={`/bill/${billId}`} className="inline-block" onClick={handleViewDetails}>
        <Button size="sm" variant="ghost" className="text-xs">
          View Details
        </Button>
      </Link>
    </div>
  );
};

export default BillFooter;
