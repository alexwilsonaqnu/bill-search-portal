
import { Bill } from "@/types";
import { Badge } from "../ui/badge";
import { format } from "date-fns";

interface BillCardHeaderProps {
  bill: Bill;
}

const BillCardHeader = ({ bill }: BillCardHeaderProps) => {
  const formattedDate = bill.lastUpdated 
    ? format(new Date(bill.lastUpdated), 'MMM d, yyyy')
    : null;

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{bill.title}</h3>
          {formattedDate && (
            <Badge variant="outline" className="whitespace-nowrap">
              {formattedDate}
            </Badge>
          )}
        </div>
        {bill.sessionName && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {bill.sessionName}
            </p>
            <p className="text-sm text-muted-foreground">
              IL
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillCardHeader;
