
import { Bill } from "@/types";

interface BillSummaryProps {
  bill: Bill;
}

const BillSummary = ({ bill }: BillSummaryProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2 text-blue-800">{bill.title}</h3>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{bill.description}</p>
      
      {bill.data?.description && bill.data.description !== bill.description && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Official Description:</h4>
          <p className="text-gray-600 text-sm line-clamp-2">{bill.data.description}</p>
        </div>
      )}
    </div>
  );
};

export default BillSummary;
