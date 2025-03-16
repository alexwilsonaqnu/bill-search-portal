
import { Bill } from "@/types";
import VersionComparison from "@/components/VersionComparison";

interface BillComparisonContainerProps {
  bill: Bill;
}

const BillComparisonContainer = ({ bill }: BillComparisonContainerProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Version Comparison</h2>
      {bill.versions && bill.versions.length > 1 ? (
        <VersionComparison versions={bill.versions} />
      ) : (
        <p className="text-gray-500">This bill only has one version. Comparison is not available.</p>
      )}
    </div>
  );
};

export default BillComparisonContainer;
