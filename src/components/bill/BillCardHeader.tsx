
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";
import { Bill } from "@/types";
import { getRelevantDate } from "@/utils/billCardUtils";
import { normalizeBillId } from "@/utils/billTransformUtils";

interface BillCardHeaderProps {
  bill: Bill;
}

const BillCardHeader = ({ bill }: BillCardHeaderProps) => {
  const relevantDate = getRelevantDate(bill);
  // Use the same normalized ID format that's used in the URL
  const displayId = normalizeBillId(bill.id);
  
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">
            {displayId}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {relevantDate}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
};

export default BillCardHeader;
