
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bill } from "@/types";
import { getTags } from "@/utils/billCardUtils";
import { normalizeBillId } from "@/utils/billTransformUtils";

interface BillFooterProps {
  bill: Bill;
}

const BillFooter = ({ bill }: BillFooterProps) => {
  const tags = getTags(bill);
  // Make sure we use the normalized ID for the link URL
  const normalizedId = normalizeBillId(bill.id);
  
  return (
    <div className="flex items-center justify-between flex-wrap gap-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" /> {tag}
          </Badge>
        ))}
      </div>
      
      <Link to={`/bill/${normalizedId}`} className="inline-block">
        <Button size="sm" variant="ghost" className="text-xs">
          View Details
        </Button>
      </Link>
    </div>
  );
};

export default BillFooter;
