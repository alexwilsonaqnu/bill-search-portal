
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { Bill } from "@/types";
import { getMostRecentAction, getActionType } from "@/utils/billCardUtils";

interface BillActionProps {
  bill: Bill;
}

const BillAction = ({ bill }: BillActionProps) => {
  const mostRecentAction = getMostRecentAction(bill);
  const actionType = getActionType(bill);
  
  if (!mostRecentAction) return null;
  
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
        <Activity className="h-3 w-3" /> Recent Action:
      </h4>
      <p className="text-gray-600 text-sm line-clamp-2">{mostRecentAction}</p>
      {actionType && (
        <Badge variant="outline" className="mt-1 text-xs">
          {actionType}
        </Badge>
      )}
    </div>
  );
};

export default BillAction;
