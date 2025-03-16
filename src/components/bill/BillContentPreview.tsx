
import { Bill } from "@/types";
import { getFirstThreeLines } from "@/utils/billCardUtils";

interface BillContentPreviewProps {
  bill: Bill;
}

const BillContentPreview = ({ bill }: BillContentPreviewProps) => {
  const firstThreeLines = getFirstThreeLines(bill);
  
  if (!firstThreeLines) return null;
  
  return (
    <div className="p-3 bg-gray-50 border border-gray-100 rounded-md mb-4 text-xs text-gray-700 italic">
      <p className="line-clamp-3 whitespace-pre-line">{firstThreeLines}</p>
    </div>
  );
};

export default BillContentPreview;
