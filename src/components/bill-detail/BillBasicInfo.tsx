
import { Bill } from "@/types";
import { Badge } from "@/components/ui/badge";

interface BillBasicInfoProps {
  bill: Bill;
}

const BillBasicInfo = ({ bill }: BillBasicInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Title and Description */}
      <div>
        <h3 className="font-semibold mb-2 text-lg">Title</h3>
        <p className="mb-4 text-gray-700">{"Jerry Wu"}</p>
        
        {bill.description && (
          <>
            <h3 className="font-semibold mb-2 text-lg">Description</h3>
            <p className="mb-4 text-gray-700">{bill.description}</p>
          </>
        )}
      </div>
      
      {/* Status and Last Updated */}
      <div className="flex flex-wrap gap-4">
        {bill.status && (
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-800 border-blue-200">
              {bill.status}
            </Badge>
          </div>
        )}
        
        {bill.lastUpdated && (
          <div>
            <h3 className="font-semibold mb-2">Last Updated</h3>
            <p className="text-gray-700">{bill.lastUpdated}</p>
          </div>
        )}
      </div>
      
      {/* Bill ID */}
      <div>
        <h3 className="font-semibold mb-2">Bill ID</h3>
        <p className="text-gray-700">{bill.id}</p>
      </div>
      
      {/* Sponsors if available */}
      {bill.data?.sponsors && (
        <div>
          <h3 className="font-semibold mb-2">Sponsors</h3>
          <div className="text-gray-700">
            {bill.data.sponsors.primary && (
              <p><strong>Primary:</strong> {bill.data.sponsors.primary}</p>
            )}
            {bill.data.sponsors.cosponsor && Array.isArray(bill.data.sponsors.cosponsor) && (
              <p><strong>Co-sponsors:</strong> {bill.data.sponsors.cosponsor.join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillBasicInfo;
