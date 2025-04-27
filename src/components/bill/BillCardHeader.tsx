
import { Bill } from "@/types";
import { Badge } from "../ui/badge";

interface BillCardHeaderProps {
  bill: Bill;
}

const BillCardHeader = ({ bill }: BillCardHeaderProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{bill.title}</h3>
        {bill.sessionYear && (
          <Badge variant="outline" className="whitespace-nowrap">
            {bill.sessionYear}
          </Badge>
        )}
      </div>
      {bill.sessionName && (
        <p className="text-sm text-muted-foreground">
          {bill.sessionName}
        </p>
      )}
    </div>
  );
};

export default BillCardHeader;
