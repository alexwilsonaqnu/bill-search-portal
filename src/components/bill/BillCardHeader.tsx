
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
  const displayId = normalizeBillId(bill.id);
  
  // Get a clean title from the API data if available
  const apiTitle = bill.data?.title || '';
  const displayTitle = apiTitle !== bill.title ? apiTitle : '';
  
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span>{displayId}</span>
            {displayTitle && (
              <span className="text-gray-600 font-normal text-base">
                {displayTitle}
              </span>
            )}
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
